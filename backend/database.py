import os
import sqlite3

# Determine database path with env override (backward compatible)
# CARE_DB_PATH can point to an absolute file or a relative path (relative to project root or this file's dir).
_default_db = os.path.join(os.path.dirname(__file__), 'database.db')
_env_db = os.environ.get('CARE_DB_PATH')
if _env_db:
    # Expand user (~) and vars; if relative, resolve relative to current working dir, else leave absolute.
    _candidate = os.path.expandvars(os.path.expanduser(_env_db))
    if not os.path.isabs(_candidate):
        _candidate = os.path.abspath(_candidate)
    DATABASE = _candidate
else:
    DATABASE = _default_db

def connect_db():
    """Connect to the SQLite database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # To return rows as dictionaries
    # Ensure foreign keys if we ever add them
    conn.execute('PRAGMA foreign_keys = ON')
    return conn

def _column_exists(conn, table, column):
    cur = conn.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cur.fetchall())

def init_db():
    """Initialize the database with necessary tables and columns."""
    conn = connect_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            position TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS shifts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            shift_time TEXT NOT NULL,
            -- Optional fields added by migration helpers
            end_time TEXT,
            series_id TEXT,
            FOREIGN KEY (employee_id) REFERENCES employees (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            date TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES employees (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER,
            task TEXT NOT NULL,
            status TEXT NOT NULL,
            FOREIGN KEY (employee_id) REFERENCES employees (id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Lightweight migration: ensure new columns on existing DBs
    # SQLite doesn't support IF NOT EXISTS for columns; guard manually
    if not _column_exists(conn, 'shifts', 'end_time'):
        conn.execute('ALTER TABLE shifts ADD COLUMN end_time TEXT')
    if not _column_exists(conn, 'shifts', 'series_id'):
        conn.execute('ALTER TABLE shifts ADD COLUMN series_id TEXT')
    
    conn.commit()
    conn.close()
    
def insert_user(name, email, password):
    conn = connect_db()
    c = conn.cursor()
    c.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, password))
    conn.commit()
    conn.close()

def get_user_by_email(email):
    conn = connect_db()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()
    return user

def insert_employee(name, position):
    """Insert a new employee into the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO employees (name, position) VALUES (?, ?)", (name, position))
    conn.commit()
    conn.close()

def get_employees():
    """Get all employees from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM employees")
    employees = cursor.fetchall()
    conn.close()
    return employees

def insert_shift(employee_id, shift_time, end_time=None, series_id=None):
    """Insert a new shift into the database. Idempotent on (employee_id, shift_time)."""
    conn = connect_db()
    cursor = conn.cursor()
    # Guard against duplicate recurrence submissions
    cursor.execute(
        "SELECT 1 FROM shifts WHERE employee_id = ? AND shift_time = ? LIMIT 1",
        (employee_id, shift_time),
    )
    exists = cursor.fetchone() is not None
    if not exists:
        cursor.execute(
            "INSERT INTO shifts (employee_id, shift_time, end_time, series_id) VALUES (?, ?, ?, ?)",
            (employee_id, shift_time, end_time, series_id)
        )
        conn.commit()
    conn.close()

def get_shifts():
    """Get all shifts from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM shifts")
    shifts = cursor.fetchall()
    conn.close()
    return shifts

def get_shifts_in_range(start_iso_date, end_iso_date):
    """Get shifts where date(shift_time) between start and end inclusive."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT * FROM shifts
        WHERE date(shift_time) BETWEEN date(?) AND date(?)
        """,
        (start_iso_date, end_iso_date)
    )
    rows = cursor.fetchall()
    conn.close()
    return rows


def insert_attendance(employee_id, date, status):
    """Insert a new attendance record into the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO attendance (employee_id, date, status) VALUES (?, ?, ?)", (employee_id, date, status))
    conn.commit()
    conn.close()

def get_attendance():
    """Get all attendance records from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM attendance")
    attendance_records = cursor.fetchall()
    conn.close()
    return attendance_records


def insert_task(employee_id, task, status):
    """Insert a new task into the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (employee_id, task, status) VALUES (?, ?, ?)", (employee_id, task, status))
    conn.commit()
    conn.close()

def get_tasks():
    """Get all tasks from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks")
    tasks = cursor.fetchall()
    conn.close()
    return tasks

def delete_employee(employee_id):
    """Delete an employee and their shifts from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    # Delete related shifts first (soft cascade)
    cursor.execute("DELETE FROM shifts WHERE employee_id = ?", (employee_id,))
    cursor.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
    conn.commit()
    conn.close()

def delete_shift(shift_id):
    """Delete a shift from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shifts WHERE id = ?", (shift_id,))
    conn.commit()
    conn.close()

def delete_shifts_by_series(series_id):
    """Delete all shifts belonging to a series."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM shifts WHERE series_id = ?", (series_id,))
    conn.commit()
    conn.close()

def update_shift_employee(shift_id, new_employee_id):
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE shifts SET employee_id = ? WHERE id = ?", (new_employee_id, shift_id))
    conn.commit()
    conn.close()

def delete_attendance(attendance_id):
    """Delete an attendance record from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM attendance WHERE id = ?", (attendance_id,))
    conn.commit()
    conn.close()

def delete_task(task_id):
    """Delete a task from the database."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()

def get_shifts_with_names():
    """Get all shifts from the database with employee names."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT shifts.id, employees.name, employees.id as employee_id, shifts.shift_time, shifts.end_time, shifts.series_id
        FROM shifts 
        JOIN employees ON shifts.employee_id = employees.id
        ORDER BY shifts.shift_time
        """
    )
    shifts = cursor.fetchall()
    conn.close()
    return shifts

def get_shifts_with_names_between(start_iso_date: str, end_iso_date: str):
        """Get shifts with employee names where date(shift_time) is between start and end (inclusive).
        Dates must be 'YYYY-MM-DD'. Returns rows with columns:
            id, name, employee_id, shift_time, end_time, series_id
        """
        conn = connect_db()
        cursor = conn.cursor()
        cursor.execute(
                """
                SELECT shifts.id, employees.name, employees.id as employee_id, shifts.shift_time, shifts.end_time, shifts.series_id
                FROM shifts
                JOIN employees ON shifts.employee_id = employees.id
                WHERE date(shifts.shift_time) BETWEEN date(?) AND date(?)
                ORDER BY shifts.shift_time
                """,
                (start_iso_date, end_iso_date)
        )
        rows = cursor.fetchall()
        conn.close()
        return rows

def get_attendance_with_names():
    """Get all attendance records from the database with employee names."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT attendance.id, employees.name, attendance.date, attendance.status 
        FROM attendance 
        JOIN employees ON attendance.employee_id = employees.id
        """
    )
    attendance_records = cursor.fetchall()
    conn.close()
    return attendance_records

def get_tasks_with_names():
    """Get all tasks from the database with employee names."""
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT tasks.id, employees.name, tasks.task, tasks.status 
        FROM tasks 
        JOIN employees ON tasks.employee_id = employees.id
        """
    )
    tasks = cursor.fetchall()
    conn.close()
    return tasks

def get_series_start_date(series_id: str):
    """Return the earliest date (YYYY-MM-DD) for a given series_id, or None if not found."""
    conn = connect_db()
    cur = conn.cursor()
    cur.execute("SELECT MIN(date(shift_time)) AS start_date FROM shifts WHERE series_id = ?", (series_id,))
    row = cur.fetchone()
    conn.close()
    if not row or row[0] is None:
        return None
    return row[0]
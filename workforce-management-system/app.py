from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from database import init_db, insert_employee, get_employees, insert_shift, get_shifts_with_names
from database import insert_attendance, get_attendance_with_names, insert_task, get_tasks_with_names
from database import delete_employee, delete_shift, delete_attendance, delete_task
from database import insert_user, get_user_by_email
import sqlite3
from datetime import datetime, timedelta, date

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Change this to a random secret key

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_statistics():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Count number of employees
    cursor.execute("SELECT COUNT(*) FROM employees")
    no_of_employees = cursor.fetchone()[0]

    # Count number of tasks
    cursor.execute("SELECT COUNT(*) FROM tasks")
    no_of_tasks = cursor.fetchone()[0]

    # Count number of shifts
    cursor.execute("SELECT COUNT(*) FROM shifts")
    no_of_shifts = cursor.fetchone()[0]

    # Count number of attendance present
    cursor.execute("SELECT COUNT(*) FROM attendance WHERE status = 'Present'")
    no_of_present = cursor.fetchone()[0]

    # Count number of attendance absent
    cursor.execute("SELECT COUNT(*) FROM attendance WHERE status = 'Absent'")
    no_of_absent = cursor.fetchone()[0]

    conn.close()

    return no_of_employees, no_of_tasks, no_of_shifts, no_of_present, no_of_absent

@app.route('/performance')
def performance():
    no_of_employees, no_of_tasks, no_of_shifts, no_of_present, no_of_absent = get_statistics()
    return render_template('performance.html', 
                            no_of_employees=no_of_employees,
                            no_of_tasks=no_of_tasks,
                            no_of_shifts=no_of_shifts,
                            no_of_present=no_of_present,
                            no_of_absent=no_of_absent)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        user = get_user_by_email(email)
        
        if user and check_password_hash(user[3], password):  # Assuming password is the 4th column
            session['user_id'] = user[0]  # Assuming id is the 1st column
            flash('Logged in successfully', 'success')
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return redirect(url_for('signup'))
        
        hashed_password = generate_password_hash(password)
        
        try:
            insert_user(name, email, hashed_password)
            flash('Account created successfully', 'success')
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash('Email already exists', 'error')
    
    return render_template('signup.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash('Logged out successfully', 'success')
    return redirect(url_for('login'))

# Add the login_required decorator to all your existing routes
@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/employees', methods=['GET', 'POST'])
def employees():
    if request.method == 'POST':
        name = request.form['name']
        position = request.form['position']
        insert_employee(name, position)
        return redirect(url_for('employees'))

    employees = get_employees()
    return render_template('employees.html', employees=employees)

@app.route('/delete_employee/<int:employee_id>')
def delete_employee_route(employee_id):
    delete_employee(employee_id)
    return redirect(url_for('employees'))

@app.route('/shifts', methods=['GET', 'POST'])
def shifts():
    if request.method == 'POST':
        employee_id = request.form['employee_id']
        shift_time_raw = request.form['shift_time']  # format: YYYY-MM-DDTHH:MM
        repeat_weekly = request.form.get('repeat_weekly')  # 'on' if checked
        repeat_until_raw = request.form.get('repeat_until')  # optional YYYY-MM-DD
        selected_days = request.form.getlist('selected_days')  # list of weekday indices as strings (0=Mon)

        # Parse the initial shift datetime
        try:
            base_dt = datetime.strptime(shift_time_raw, '%Y-%m-%dT%H:%M')
        except ValueError:
            flash('Invalid shift time format', 'error')
            return redirect(url_for('shifts'))

        if repeat_weekly:
            # Determine end date (inclusive)
            if repeat_until_raw:
                try:
                    end_date = datetime.strptime(repeat_until_raw, '%Y-%m-%d').date()
                except ValueError:
                    flash('Invalid repeat-until date format', 'error')
                    return redirect(url_for('shifts'))
            else:
                end_date = date(base_dt.year, 12, 31)

            # If no specific weekdays selected, default to the weekday of the base date
            if not selected_days:
                selected_days = [str(base_dt.weekday())]  # Monday=0
            # Convert to ints and dedupe
            try:
                weekday_indices = sorted({int(d) for d in selected_days if 0 <= int(d) <= 6})
            except ValueError:
                flash('Invalid weekday selection', 'error')
                return redirect(url_for('shifts'))

            start_date = base_dt.date()
            time_part = base_dt.time()
            # Start from Monday of the week containing the base date
            current_week_start = start_date - timedelta(days=start_date.weekday())
            occurrences = 0
            while current_week_start <= end_date:
                for dow in weekday_indices:
                    shift_date = current_week_start + timedelta(days=dow)
                    if shift_date < start_date or shift_date > end_date:
                        continue
                    shift_dt = datetime.combine(shift_date, time_part)
                    insert_shift(employee_id, shift_dt.isoformat())
                    occurrences += 1
                current_week_start += timedelta(days=7)
            flash(f'Recurring weekly pattern created ({occurrences} shifts).', 'success')
        else:
            insert_shift(employee_id, base_dt.isoformat())
            flash('Shift added.', 'success')
        return redirect(url_for('shifts'))

    shifts_data = get_shifts_with_names()
    employees = get_employees()
    # Convert Row objects to plain dicts for JSON serialization
    shifts_serializable = [
        { 'id': s['id'], 'name': s['name'], 'shift_time': s['shift_time'] } for s in shifts_data
    ]
    employees_serializable = [ { 'id': e['id'], 'name': e['name'] } for e in employees ]
    return render_template('shifts.html', shifts=shifts_serializable, employees=employees_serializable)

@app.route('/delete_shifts', methods=['POST'])
def delete_shifts_batch():
    ids = request.form.getlist('shift_ids')
    deleted = 0
    for sid in ids:
        try:
            delete_shift(int(sid))
            deleted += 1
        except Exception:
            continue
    if deleted:
        flash(f'Deleted {deleted} shift(s).', 'success')
    else:
        flash('No shifts deleted.', 'error')
    return redirect(url_for('shifts'))

@app.route('/delete_shift/<int:shift_id>')
def delete_shift_route(shift_id):
    delete_shift(shift_id)
    flash('Shift deleted.', 'success')
    return redirect(url_for('shifts'))

@app.route('/attendance', methods=['GET', 'POST'])
def attendance():
    if request.method == 'POST':
        employee_id = request.form['employee_id']
        date = request.form['date']
        status = request.form['status']
        insert_attendance(employee_id, date, status)
        return redirect(url_for('attendance'))

    attendance_records = get_attendance_with_names()
    employees = get_employees()
    return render_template('attendance.html', attendance_records=attendance_records, employees=employees)

@app.route('/delete_attendance/<int:attendance_id>')
def delete_attendance_route(attendance_id):
    delete_attendance(attendance_id)
    return redirect(url_for('attendance'))

@app.route('/tasks', methods=['GET', 'POST'])
def tasks():
    if request.method == 'POST':
        employee_id = request.form['employee_id']
        task = request.form['task']
        status = request.form['status']
        insert_task(employee_id, task, status)
        return redirect(url_for('tasks'))

    tasks = get_tasks_with_names()
    employees = get_employees()
    return render_template('tasks.html', tasks=tasks, employees=employees)

@app.route('/delete_task/<int:task_id>')
def delete_task_route(task_id):
    delete_task(task_id)
    return redirect(url_for('tasks'))

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
#!/usr/bin/env python3
"""
Deterministic, idempotent database seeding for Care Calendar.

Usage:
    python scripts/seed_database.py [--reset] [--verbose] [--dry-run] [--yes]

This script provides a robust seeding mechanism to populate a fresh dev or 
container environment with usable data (admin user, caregivers, shifts, time off).
"""

import os
import sys
import sqlite3
import argparse
import datetime as dt
from pathlib import Path
from werkzeug.security import generate_password_hash

# Add backend directory to path to import database helpers
sys.path.append(str(Path(__file__).resolve().parent.parent / "backend"))
from database import init_db, connect_db

# Deterministic seed data
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "password"  # Will be hashed
ADMIN_NAME = "Administrator"

EMPLOYEES = [
    ("Alice Day", "Day Shift Caregiver"),
    ("Bob Evening", "Evening Shift Caregiver"), 
    ("Carol Float", "Float Caregiver"),
    ("Dave Nights", "Night Shift Caregiver"),
    ("Eve Relief", "Relief Caregiver")
]

# Deterministic series IDs for shifts
SERIES_ID_ALICE_DAY = "1001"
SERIES_ID_BOB_EVENING = "1002"

def detect_schema(conn, table):
    """Detect and return column names for a table using PRAGMA table_info."""
    cur = conn.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cur.fetchall()]
    return columns

def get_anchor_monday():
    """Get the Monday of the current ISO week as the anchor date."""
    today = dt.date.today()
    # ISO weekday: Monday=1, Sunday=7
    weekday = today.isoweekday()
    monday = today - dt.timedelta(days=weekday - 1)
    return monday

def format_shift_datetime(date_obj, hour, minute):
    """Format a shift datetime in the expected format: YYYY-MM-DD HH:MM"""
    return f"{date_obj.strftime('%Y-%m-%d')} {hour:02d}:{minute:02d}"

def ensure_admin_user(conn, verbose=False, dry_run=False):
    """Ensure admin user exists. Returns (created, skipped)."""
    # Check if admin user exists
    cur = conn.execute("SELECT id FROM users WHERE email = ?", (ADMIN_EMAIL,))
    existing = cur.fetchone()
    
    if existing:
        if verbose:
            print(f"[SKIP]   user {ADMIN_EMAIL} (exists with id={existing[0]})")
        return 0, 1
    
    if dry_run:
        print(f"[DRY-RUN] would create user {ADMIN_EMAIL}")
        return 1, 0
    
    # Create admin user with hashed password
    password_hash = generate_password_hash(ADMIN_PASSWORD)
    conn.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        (ADMIN_NAME, ADMIN_EMAIL, password_hash)
    )
    print(f"[CREATE] user {ADMIN_EMAIL}")
    return 1, 0

def ensure_employee(conn, name, position, verbose=False, dry_run=False):
    """Ensure employee exists. Returns (created, skipped, employee_id)."""
    # Check if employee exists by name
    cur = conn.execute("SELECT id FROM employees WHERE name = ?", (name,))
    existing = cur.fetchone()
    
    if existing:
        if verbose:
            print(f"[SKIP]   employee {name} (exists with id={existing[0]})")
        return 0, 1, existing[0]
    
    if dry_run:
        print(f"[DRY-RUN] would create employee {name}")
        return 1, 0, None
    
    # Create employee
    cur = conn.execute(
        "INSERT INTO employees (name, position) VALUES (?, ?)",
        (name, position)
    )
    employee_id = cur.lastrowid
    print(f"[CREATE] employee {name}")
    return 1, 0, employee_id

def ensure_shift_series(conn, employee_id, series_id, start_date, days_pattern, 
                       start_time, end_time, weeks=2, verbose=False, dry_run=False):
    """
    Ensure recurring shift series exists.
    
    Args:
        employee_id: Employee ID
        series_id: Deterministic series ID
        start_date: Starting Monday date
        days_pattern: List of weekday numbers (0=Monday, 6=Sunday)
        start_time: Tuple (hour, minute) for shift start
        end_time: Tuple (hour, minute) for shift end
        weeks: Number of weeks to generate
    
    Returns: (created_count, skipped_count)
    """
    created = 0
    skipped = 0
    
    # Check if any shift with this series_id exists
    cur = conn.execute("SELECT COUNT(*) FROM shifts WHERE series_id = ?", (series_id,))
    existing_count = cur.fetchone()[0]
    
    if existing_count > 0:
        if verbose:
            print(f"[SKIP]   shift series {series_id} (exists with {existing_count} shifts)")
        return 0, existing_count
    
    if dry_run:
        total_shifts = len(days_pattern) * weeks
        print(f"[DRY-RUN] would create {total_shifts} shifts for series {series_id}")
        return total_shifts, 0
    
    # Generate shifts for the specified weeks
    for week_offset in range(weeks):
        week_start = start_date + dt.timedelta(weeks=week_offset)
        
        for day_offset in days_pattern:
            shift_date = week_start + dt.timedelta(days=day_offset)
            shift_start = format_shift_datetime(shift_date, start_time[0], start_time[1])
            shift_end = format_shift_datetime(shift_date, end_time[0], end_time[1])
            
            # Double-check individual shift doesn't exist
            cur = conn.execute(
                "SELECT 1 FROM shifts WHERE employee_id = ? AND shift_time = ? LIMIT 1",
                (employee_id, shift_start)
            )
            if cur.fetchone():
                skipped += 1
                continue
            
            conn.execute(
                "INSERT INTO shifts (employee_id, shift_time, end_time, series_id) VALUES (?, ?, ?, ?)",
                (employee_id, shift_start, shift_end, series_id)
            )
            created += 1
    
    if created > 0:
        print(f"[CREATE] {created} shifts for series {series_id}")
    if skipped > 0 and verbose:
        print(f"[SKIP]   {skipped} individual shifts in series {series_id}")
    
    return created, skipped

def ensure_single_shift(conn, employee_id, shift_date, start_time, end_time, 
                       verbose=False, dry_run=False):
    """Ensure a single (non-series) shift exists. Returns (created, skipped)."""
    shift_start = format_shift_datetime(shift_date, start_time[0], start_time[1])
    shift_end = format_shift_datetime(shift_date, end_time[0], end_time[1])
    
    # Check if shift exists
    cur = conn.execute(
        "SELECT id FROM shifts WHERE employee_id = ? AND shift_time = ? AND end_time = ?",
        (employee_id, shift_start, shift_end)
    )
    existing = cur.fetchone()
    
    if existing:
        if verbose:
            print(f"[SKIP]   single shift {shift_start} - {shift_end} (exists)")
        return 0, 1
    
    if dry_run:
        print(f"[DRY-RUN] would create single shift {shift_start} - {shift_end}")
        return 1, 0
    
    # Create single shift (no series_id)
    conn.execute(
        "INSERT INTO shifts (employee_id, shift_time, end_time, series_id) VALUES (?, ?, ?, ?)",
        (employee_id, shift_start, shift_end, None)
    )
    print(f"[CREATE] single shift {shift_start} - {shift_end}")
    return 1, 0

def ensure_time_off(conn, employee_id, start_date, end_date, reason, 
                   verbose=False, dry_run=False):
    """Ensure time off entry exists. Returns (created, skipped)."""
    start_str = start_date.strftime('%Y-%m-%d')
    end_str = end_date.strftime('%Y-%m-%d')
    
    # Check if time off exists
    cur = conn.execute(
        "SELECT id FROM time_off WHERE employee_id = ? AND start_date = ? AND end_date = ?",
        (employee_id, start_str, end_str)
    )
    existing = cur.fetchone()
    
    if existing:
        if verbose:
            print(f"[SKIP]   time off {start_str} to {end_str} (exists)")
        return 0, 1
    
    if dry_run:
        print(f"[DRY-RUN] would create time off {start_str} to {end_str}")
        return 1, 0
    
    # Create time off entry
    conn.execute(
        "INSERT INTO time_off (employee_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)",
        (employee_id, start_str, end_str, reason)
    )
    print(f"[CREATE] time off {start_str} to {end_str} ({reason})")
    return 1, 0

def log_schema_info(conn, verbose=False):
    """Log detected database schema if verbose mode is enabled."""
    if not verbose:
        return
    
    tables = ['users', 'employees', 'shifts', 'time_off']
    for table in tables:
        try:
            columns = detect_schema(conn, table)
            print(f"[schema] {table}: {','.join(columns)}")
        except sqlite3.OperationalError:
            print(f"[schema] {table}: table not found")

def seed_database(reset=False, verbose=False, dry_run=False, yes=False):
    """Main seeding function."""
    # Handle database reset
    if reset:
        # Respect CARE_DB_PATH environment variable
        db_path = os.environ.get('CARE_DB_PATH')
        if not db_path:
            db_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'database.db')
        
        db_path = os.path.abspath(db_path)
        
        if os.path.exists(db_path):
            if not yes:
                response = input(f"Delete existing database at {db_path}? (y/N): ")
                if response.lower() != 'y':
                    print("Reset cancelled.")
                    return False
            
            os.remove(db_path)
            print(f"[RESET] Deleted existing database: {db_path}")
    
    # Initialize database
    print("Initializing database...")
    init_db()
    
    # Connect to database
    conn = connect_db()
    
    try:
        # Log schema information if verbose
        log_schema_info(conn, verbose)
        
        # Get anchor Monday for date calculations
        anchor_monday = get_anchor_monday()
        print(f"Using anchor Monday: {anchor_monday}")
        
        # Tracking variables
        stats = {
            'users': {'created': 0, 'skipped': 0},
            'employees': {'created': 0, 'skipped': 0},
            'shifts': {'created': 0, 'skipped': 0},
            'time_off': {'created': 0, 'skipped': 0}
        }
        
        if not dry_run:
            # Begin transaction
            conn.execute("BEGIN")
        
        # 1. Ensure admin user
        created, skipped = ensure_admin_user(conn, verbose, dry_run)
        stats['users']['created'] += created
        stats['users']['skipped'] += skipped
        
        # 2. Ensure employees and track their IDs
        employee_ids = {}
        for name, position in EMPLOYEES:
            created, skipped, emp_id = ensure_employee(conn, name, position, verbose, dry_run)
            stats['employees']['created'] += created
            stats['employees']['skipped'] += skipped
            if emp_id:
                employee_ids[name] = emp_id
        
        # If dry run, we can't create shifts/time_off without real employee IDs
        if dry_run:
            print("\n[DRY-RUN] Shifts and time_off would be created based on employee IDs")
        else:
            # 3. Create shift series
            # Alice Day: Mon-Fri 09:00-17:00
            if "Alice Day" in employee_ids:
                created, skipped = ensure_shift_series(
                    conn, employee_ids["Alice Day"], SERIES_ID_ALICE_DAY,
                    anchor_monday, [0, 1, 2, 3, 4],  # Mon-Fri
                    (9, 0), (17, 0), weeks=2, verbose=verbose, dry_run=dry_run
                )
                stats['shifts']['created'] += created
                stats['shifts']['skipped'] += skipped
            elif verbose:
                print("[SKIP]   Alice Day shifts (employee not found)")
            
            # Bob Evening: Mon-Fri 13:00-21:00  
            if "Bob Evening" in employee_ids:
                created, skipped = ensure_shift_series(
                    conn, employee_ids["Bob Evening"], SERIES_ID_BOB_EVENING,
                    anchor_monday, [0, 1, 2, 3, 4],  # Mon-Fri
                    (13, 0), (21, 0), weeks=2, verbose=verbose, dry_run=dry_run
                )
                stats['shifts']['created'] += created
                stats['shifts']['skipped'] += skipped
            elif verbose:
                print("[SKIP]   Bob Evening shifts (employee not found)")
            
            # Carol Float: Single Saturday shift 09:00-15:00
            if "Carol Float" in employee_ids:
                saturday = anchor_monday + dt.timedelta(days=5)  # Saturday of first week
                created, skipped = ensure_single_shift(
                    conn, employee_ids["Carol Float"], saturday,
                    (9, 0), (15, 0), verbose=verbose, dry_run=dry_run
                )
                stats['shifts']['created'] += created
                stats['shifts']['skipped'] += skipped
            elif verbose:
                print("[SKIP]   Carol Float shifts (employee not found)")
            
            # 4. Create time off entries
            # Alice Day: Next week Wed-Fri (3 days)
            if "Alice Day" in employee_ids:
                next_wednesday = anchor_monday + dt.timedelta(days=9)  # Wed of next week
                next_friday = anchor_monday + dt.timedelta(days=11)    # Fri of next week
                created, skipped = ensure_time_off(
                    conn, employee_ids["Alice Day"], next_wednesday, next_friday,
                    "Personal time off", verbose=verbose, dry_run=dry_run
                )
                stats['time_off']['created'] += created
                stats['time_off']['skipped'] += skipped
            elif verbose:
                print("[SKIP]   Alice Day time off (employee not found)")
            
            # Dave Nights: Upcoming Monday (single day)
            if "Dave Nights" in employee_ids:
                next_monday = anchor_monday + dt.timedelta(days=7)  # Monday of next week
                created, skipped = ensure_time_off(
                    conn, employee_ids["Dave Nights"], next_monday, next_monday,
                    "Medical appointment", verbose=verbose, dry_run=dry_run
                )
                stats['time_off']['created'] += created
                stats['time_off']['skipped'] += skipped
            elif verbose:
                print("[SKIP]   Dave Nights time off (employee not found)")
        
        if not dry_run:
            # Commit transaction
            conn.commit()
            print("\nTransaction committed successfully.")
        
        # Print summary
        print(f"\nSummary: users=created={stats['users']['created']} skipped={stats['users']['skipped']} " +
              f"employees=created={stats['employees']['created']} skipped={stats['employees']['skipped']} " +
              f"shifts=created={stats['shifts']['created']} skipped={stats['shifts']['skipped']} " +
              f"time_off=created={stats['time_off']['created']} skipped={stats['time_off']['skipped']}")
        
        # Post-run verification hints
        if not dry_run and (stats['users']['created'] > 0 or stats['employees']['created'] > 0):
            print(f"\nPost-run verification:")
            print(f"- Login with {ADMIN_EMAIL} / {ADMIN_PASSWORD}")
            print(f"- Navigate to /shifts to see seeded series")
            print(f"- View time off (conflict highlights if overlapping shifts exist)")
        
        return True
        
    except Exception as e:
        if not dry_run:
            conn.rollback()
        print(f"Error during seeding: {e}")
        return False
    finally:
        conn.close()

def main():
    """Main entry point with argument parsing."""
    parser = argparse.ArgumentParser(
        description="Seed Care Calendar database with deterministic test data"
    )
    parser.add_argument(
        '--reset', action='store_true',
        help='Delete existing database file and recreate (prompts for confirmation unless --yes)'
    )
    parser.add_argument(
        '--verbose', action='store_true',
        help='Show extra schema and decision details'
    )
    parser.add_argument(
        '--dry-run', action='store_true', 
        help='Show what would be created without modifying database'
    )
    parser.add_argument(
        '--yes', action='store_true',
        help='Auto-confirm database reset without prompting'
    )
    
    args = parser.parse_args()
    
    success = seed_database(
        reset=args.reset,
        verbose=args.verbose, 
        dry_run=args.dry_run,
        yes=args.yes
    )
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main()
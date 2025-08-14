from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, Response
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from database import init_db, insert_employee, get_employees, insert_shift, get_shifts_with_names
from database import insert_attendance, get_attendance_with_names, insert_task, get_tasks_with_names
from database import delete_employee, delete_shift, delete_attendance, delete_task
from database import insert_user, get_user_by_email
from database import delete_shifts_by_series, update_shift_employee
from database import connect_db
import sqlite3
from datetime import datetime, timedelta, date, time as dtime
import os
import uuid

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-change-me')
# Kiosk-friendly: keep sessions alive longer unless explicitly logged out
app.permanent_session_lifetime = timedelta(days=30)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_statistics():
    # DB lives next to this file
    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    conn = sqlite3.connect(db_path)
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
@login_required
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
            session.permanent = True
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
@login_required
def employees():
    if request.method == 'POST':
        name = request.form['name']
        position = request.form['position']
        insert_employee(name, position)
        return redirect(url_for('employees'))

    employees = get_employees()
    return render_template('employees.html', employees=employees)

@app.route('/delete_employee/<int:employee_id>')
@login_required
def delete_employee_route(employee_id):
    delete_employee(employee_id)
    return redirect(url_for('employees'))

@app.route('/shifts', methods=['GET', 'POST'])
@login_required
def shifts():
    if request.method == 'POST':
        employee_id = request.form['employee_id']
        shift_time_raw = request.form['shift_time']  # format: YYYY-MM-DDTHH:MM
        end_time_raw = request.form.get('end_time')  # optional HH:MM
        repeat_weekly = request.form.get('repeat_weekly')  # 'on' if checked
        repeat_until_raw = request.form.get('repeat_until')  # optional YYYY-MM-DD
        selected_days = request.form.getlist('selected_days')  # list of weekday indices as strings (0=Mon)

        # Parse the initial shift datetime
        try:
            base_dt = datetime.strptime(shift_time_raw, '%Y-%m-%dT%H:%M')
        except ValueError:
            flash('Invalid shift time format', 'error')
            return redirect(url_for('shifts'))

        # Parse optional end time (same day as base)
        end_dt_template = None
        if end_time_raw:
            try:
                et = datetime.strptime(end_time_raw, '%H:%M').time()
                end_dt_template = et
                if dtime(hour=et.hour, minute=et.minute) <= dtime(hour=base_dt.hour, minute=base_dt.minute):
                    flash('End time must be after start time', 'error')
                    return redirect(url_for('shifts'))
            except ValueError:
                flash('Invalid end time format', 'error')
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
            series_id = str(uuid.uuid4())
            while current_week_start <= end_date:
                for dow in weekday_indices:
                    shift_date = current_week_start + timedelta(days=dow)
                    if shift_date < start_date or shift_date > end_date:
                        continue
                    shift_dt = datetime.combine(shift_date, time_part)
                    end_dt = None
                    if end_dt_template:
                        end_dt = datetime.combine(shift_date, end_dt_template)
                    insert_shift(employee_id, shift_dt.isoformat(), end_dt.isoformat() if end_dt else None, series_id)
                    occurrences += 1
                current_week_start += timedelta(days=7)
            flash(f'Recurring weekly pattern created ({occurrences} shifts).', 'success')
        else:
            end_dt = None
            if end_dt_template:
                end_dt = datetime.combine(base_dt.date(), end_dt_template)
            insert_shift(employee_id, base_dt.isoformat(), end_dt.isoformat() if end_dt else None, None)
            flash('Shift added.', 'success')
        return redirect(url_for('shifts'))

    shifts_data = get_shifts_with_names()
    employees = get_employees()
    # Convert Row objects to plain dicts for JSON serialization
    shifts_serializable = [
        {
            'id': s['id'],
            'name': s['name'],
            'employee_id': s['employee_id'],
            'shift_time': s['shift_time'],
            'end_time': s['end_time'],
            'series_id': s['series_id'],
        }
        for s in shifts_data
    ]
    employees_serializable = [ { 'id': e['id'], 'name': e['name'] } for e in employees ]
    return render_template('shifts.html', shifts=shifts_serializable, employees=employees_serializable)

@app.route('/delete_shift/<int:shift_id>')
@login_required
def delete_shift_route(shift_id):
    delete_shift(shift_id)
    flash('Shift deleted.', 'success')
    return redirect(url_for('shifts'))

@app.route('/attendance', methods=['GET', 'POST'])
@login_required
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
@login_required
def delete_attendance_route(attendance_id):
    delete_attendance(attendance_id)
    return redirect(url_for('attendance'))

@app.route('/tasks', methods=['GET', 'POST'])
@login_required
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
@login_required
def delete_task_route(task_id):
    delete_task(task_id)
    return redirect(url_for('tasks'))

@app.route('/api/delete_shift', methods=['POST'])
@login_required
def api_delete_shift():
    sid = request.form.get('shift_id') or (request.json and request.json.get('shift_id'))
    if not sid:
        return jsonify({'ok': False, 'error': 'shift_id required'}), 400
    try:
        delete_shift(int(sid))
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/delete_series', methods=['POST'])
@login_required
def api_delete_series():
    series_id = request.form.get('series_id') or (request.json and request.json.get('series_id'))
    if not series_id:
        return jsonify({'ok': False, 'error': 'series_id required'}), 400
    try:
        delete_shifts_by_series(series_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/swap_shift', methods=['POST'])
@login_required
def api_swap_shift():
    shift_id = request.form.get('shift_id') or (request.json and request.json.get('shift_id'))
    new_employee_id = request.form.get('new_employee_id') or (request.json and request.json.get('new_employee_id'))
    if not shift_id or not new_employee_id:
        return jsonify({'ok': False, 'error': 'shift_id and new_employee_id required'}), 400
    try:
        update_shift_employee(int(shift_id), int(new_employee_id))
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'error': str(e)}), 500

@app.route('/api/update_series', methods=['POST'])
@login_required
def api_update_series():
    """
    Update an existing weekly recurring series by replacing occurrences from a given start date (inclusive).
    Payload JSON fields:
      - series_id (str) REQUIRED
      - start_date (YYYY-MM-DD) optional; default today
      - time (HH:MM) REQUIRED new start time for occurrences
      - end_time (HH:MM) optional new end time
      - weekdays (list[int 0..6]) REQUIRED which weekdays to occur
      - repeat_until (YYYY-MM-DD) optional; defaults end of current year
      - employee_id optional; if provided, reassign occurrences to this employee
    Behavior: deletes existing series occurrences on/after start_date; regenerates new ones per rules.
    """
    data = request.get_json(silent=True) or {}
    series_id = data.get('series_id')
    if not series_id:
        return jsonify({ 'ok': False, 'error': 'series_id required' }), 400
    start_raw = data.get('start_date')
    time_raw = data.get('time')
    weekdays = data.get('weekdays') or []
    if time_raw is None or not isinstance(weekdays, list) or not weekdays:
        return jsonify({ 'ok': False, 'error': 'time and weekdays required' }), 400
    try:
        t_parts = datetime.strptime(time_raw, '%H:%M').time()
    except ValueError:
        return jsonify({ 'ok': False, 'error': 'time must be HH:MM' }), 400
    end_time_raw = data.get('end_time')
    end_t = None
    if end_time_raw:
        try:
            end_t = datetime.strptime(end_time_raw, '%H:%M').time()
        except ValueError:
            return jsonify({ 'ok': False, 'error': 'end_time must be HH:MM' }), 400
        if dtime(hour=end_t.hour, minute=end_t.minute) <= dtime(hour=t_parts.hour, minute=t_parts.minute):
            return jsonify({ 'ok': False, 'error': 'end_time must be after start time' }), 400

    # parse start_date default to today
    start_date = None
    if start_raw:
        try:
            start_date = datetime.strptime(start_raw, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({ 'ok': False, 'error': 'start_date must be YYYY-MM-DD' }), 400
    else:
        start_date = date.today()

    # repeat_until
    until_raw = data.get('repeat_until')
    if until_raw:
        try:
            end_date = datetime.strptime(until_raw, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({ 'ok': False, 'error': 'repeat_until must be YYYY-MM-DD' }), 400
    else:
        end_date = date(start_date.year, 12, 31)

    try:
        # Determine employee to use: explicit, else infer from existing series BEFORE deletion
        employee_id_to_use = data.get('employee_id')
        if employee_id_to_use is not None:
            try:
                employee_id_to_use = int(employee_id_to_use)
            except Exception:
                return jsonify({ 'ok': False, 'error': 'employee_id must be integer' }), 400
        else:
            # Use same DB path/connection helper as rest of app to avoid CWD issues
            conn0 = connect_db()
            cur0 = conn0.cursor()
            # Prefer any occurrence on/after start_date (about to be replaced)
            cur0.execute(
                """
                SELECT employee_id FROM shifts
                WHERE series_id = ? AND date(shift_time) >= date(?)
                ORDER BY shift_time ASC LIMIT 1
                """,
                (series_id, start_date.isoformat())
            )
            row = cur0.fetchone()
            if not row:
                # Fall back to the most recent occurrence before start_date
                cur0.execute(
                    """
                    SELECT employee_id FROM shifts
                    WHERE series_id = ? AND date(shift_time) < date(?)
                    ORDER BY shift_time DESC LIMIT 1
                    """,
                    (series_id, start_date.isoformat())
                )
                row = cur0.fetchone()
            conn0.close()
            if row:
                employee_id_to_use = int(row[0])
            else:
                return jsonify({ 'ok': False, 'error': 'Could not infer employee for this series. Please choose a caregiver.' }), 400

        # delete occurrences on/after start_date in this series
        # Delete using the canonical DB connection
        conn = connect_db()
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM shifts WHERE series_id = ? AND date(shift_time) >= date(?)",
            (series_id, start_date.isoformat()),
        )
        conn.commit()
        conn.close()

        # regenerate weekly occurrences from the Monday of start week up to end_date
        weekday_indices = sorted({int(x) for x in weekdays if isinstance(x, int) and 0 <= int(x) <= 6})
        week_start = start_date - timedelta(days=start_date.weekday())
        occ = 0
        while week_start <= end_date:
            for wd in weekday_indices:
                day = week_start + timedelta(days=wd)
                if day < start_date or day > end_date:
                    continue
                st_dt = datetime.combine(day, t_parts)
                et_dt = datetime.combine(day, end_t) if end_t else None
                insert_shift(employee_id_to_use, st_dt.isoformat(), et_dt and et_dt.isoformat(), series_id)
                occ += 1
            week_start += timedelta(days=7)
        return jsonify({ 'ok': True, 'updated': occ })
    except Exception as e:
        return jsonify({ 'ok': False, 'error': str(e) }), 500


@app.route('/api/edit_day', methods=['POST'])
@login_required
def api_edit_day():
    """
    Edit a single day occurrence of a shift, creating an override/exception for that date.
    This allows editing just one occurrence of a recurring shift without affecting the series.
    
    Payload JSON fields:
      - shift_id (int) REQUIRED - ID of the shift occurrence to edit
      - shift_date (YYYY-MM-DD) REQUIRED - Date of the specific occurrence
      - time (HH:MM) REQUIRED - New start time for this occurrence
      - end_time (HH:MM) optional - New end time for this occurrence
      - employee_id (int) optional - If provided, reassign this occurrence to this employee
    
    Behavior: Creates or updates a single-day shift record for the specified date.
    If the original shift was part of a series, this creates an exception/override.
    """
    data = request.get_json(silent=True) or {}
    shift_id = data.get('shift_id')
    shift_date = data.get('shift_date')
    time_raw = data.get('time')
    
    if not shift_id or not shift_date or not time_raw:
        return jsonify({ 'ok': False, 'error': 'shift_id, shift_date, and time are required' }), 400
    
    try:
        shift_id = int(shift_id)
        shift_datetime = datetime.strptime(shift_date, '%Y-%m-%d').date()
        shift_time_obj = datetime.strptime(time_raw, '%H:%M').time()
    except (ValueError, TypeError):
        return jsonify({ 'ok': False, 'error': 'Invalid shift_id, shift_date format (YYYY-MM-DD), or time format (HH:MM)' }), 400
    
    end_time_raw = data.get('end_time')
    end_time_obj = None
    if end_time_raw:
        try:
            end_time_obj = datetime.strptime(end_time_raw, '%H:%M').time()
        except ValueError:
            return jsonify({ 'ok': False, 'error': 'Invalid end_time format (HH:MM)' }), 400
    
    employee_id = data.get('employee_id')
    if employee_id is not None:
        try:
            employee_id = int(employee_id)
        except (ValueError, TypeError):
            return jsonify({ 'ok': False, 'error': 'employee_id must be integer' }), 400
    
    try:
        conn = connect_db()
        cursor = conn.cursor()
        
        # Get the original shift to determine employee_id and series_id if not provided
        cursor.execute("SELECT employee_id, series_id FROM shifts WHERE id = ?", (shift_id,))
        original_shift = cursor.fetchone()
        if not original_shift:
            conn.close()
            return jsonify({ 'ok': False, 'error': 'Original shift not found' }), 404
        
        # Use original employee if not reassigning
        if employee_id is None:
            employee_id = original_shift[0]
        
        original_series_id = original_shift[1]
        
        # Create the new shift datetime
        new_shift_datetime = datetime.combine(shift_datetime, shift_time_obj)
        new_end_datetime = None
        if end_time_obj:
            new_end_datetime = datetime.combine(shift_datetime, end_time_obj)
        
        # Check if there's already an existing shift for this date
        cursor.execute(
            "SELECT id FROM shifts WHERE date(shift_time) = date(?) AND employee_id = ?",
            (shift_datetime.isoformat(), employee_id)
        )
        existing_shift = cursor.fetchone()
        
        if existing_shift:
            # Update the existing shift
            cursor.execute(
                "UPDATE shifts SET shift_time = ?, end_time = ?, employee_id = ? WHERE id = ?",
                (new_shift_datetime.isoformat(), 
                 new_end_datetime.isoformat() if new_end_datetime else None,
                 employee_id,
                 existing_shift[0])
            )
        else:
            # Create a new single-day shift (this creates an override for that date)
            # Set series_id to None to indicate this is a single-day override
            cursor.execute(
                "INSERT INTO shifts (employee_id, shift_time, end_time, series_id) VALUES (?, ?, ?, ?)",
                (employee_id, 
                 new_shift_datetime.isoformat(), 
                 new_end_datetime.isoformat() if new_end_datetime else None,
                 None)  # No series_id for single-day overrides
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({ 'ok': True, 'message': 'Day updated successfully' })
    except Exception as e:
        return jsonify({ 'ok': False, 'error': str(e) }), 500


# --- Weekly hours report ---
@app.route('/hours')
@login_required
def hours_report():
    # Optional query params: ?start=YYYY-MM-DD&end=YYYY-MM-DD
    # If end missing, default to start + 6 days. If neither provided, default to current week (Mon..Sun).
    start_raw = request.args.get('start')
    end_raw = request.args.get('end')
    today_d = date.today()
    if start_raw:
        try:
            start_date = datetime.strptime(start_raw, '%Y-%m-%d').date()
        except ValueError:
            start_date = today_d - timedelta(days=today_d.weekday())
    else:
        start_date = today_d - timedelta(days=today_d.weekday())
    if end_raw:
        try:
            end_date = datetime.strptime(end_raw, '%Y-%m-%d').date()
        except ValueError:
            end_date = start_date + timedelta(days=6)
    else:
        end_date = start_date + timedelta(days=6)
    if end_date < start_date:
        start_date, end_date = end_date, start_date

    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT shifts.shift_time, shifts.end_time, employees.name AS employee_name
        FROM shifts
        JOIN employees ON shifts.employee_id = employees.id
        WHERE date(shifts.shift_time) BETWEEN date(?) AND date(?)
        """,
        (start_date.isoformat(), end_date.isoformat())
    )
    rows = cur.fetchall()
    conn.close()

    totals_min = {}
    for r in rows:
        name = r['employee_name']
        try:
            st = datetime.fromisoformat(r['shift_time'])
        except Exception:
            continue
        # Default duration 60 minutes if invalid/missing end
        try:
            et = datetime.fromisoformat(r['end_time']) if r['end_time'] else (st + timedelta(hours=1))
        except Exception:
            et = st + timedelta(hours=1)
        if et <= st:
            et = st + timedelta(hours=1)
        minutes = int((et - st).total_seconds() // 60)
        totals_min[name] = totals_min.get(name, 0) + minutes

    report = [
        { 'name': n, 'hours': round(m/60.0, 2) }
        for n, m in sorted(totals_min.items(), key=lambda x: x[0].lower())
    ]

    return render_template('hours.html', report=report, start=start_date.isoformat(), end=end_date.isoformat())

# --- Weekly hours CSV export ---
@app.route('/hours.csv')
@login_required
def hours_csv():
    # Reuse logic from hours_report with optional end date support
    start_raw = request.args.get('start')
    end_raw = request.args.get('end')
    today_d = date.today()
    if start_raw:
        try:
            start_date = datetime.strptime(start_raw, '%Y-%m-%d').date()
        except ValueError:
            start_date = today_d - timedelta(days=today_d.weekday())
    else:
        start_date = today_d - timedelta(days=today_d.weekday())
    if end_raw:
        try:
            end_date = datetime.strptime(end_raw, '%Y-%m-%d').date()
        except ValueError:
            end_date = start_date + timedelta(days=6)
    else:
        end_date = start_date + timedelta(days=6)
    if end_date < start_date:
        start_date, end_date = end_date, start_date

    db_path = os.path.join(os.path.dirname(__file__), 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT shifts.shift_time, shifts.end_time, employees.name AS employee_name
        FROM shifts
        JOIN employees ON shifts.employee_id = employees.id
        WHERE date(shifts.shift_time) BETWEEN date(?) AND date(?)
        """,
        (start_date.isoformat(), end_date.isoformat())
    )
    rows = cur.fetchall()
    conn.close()

    totals_min = {}
    for r in rows:
        name = r['employee_name']
        try:
            st = datetime.fromisoformat(r['shift_time'])
        except Exception:
            continue
        try:
            et = datetime.fromisoformat(r['end_time']) if r['end_time'] else (st + timedelta(hours=1))
        except Exception:
            et = st + timedelta(hours=1)
        if et <= st:
            et = st + timedelta(hours=1)
        minutes = int((et - st).total_seconds() // 60)
        totals_min[name] = totals_min.get(name, 0) + minutes

    # build CSV
    lines = ["Employee,Hours"]
    for name, mins in sorted(totals_min.items(), key=lambda x: x[0].lower()):
        lines.append(f"{name},{round(mins/60.0, 2)}")
    csv_data = "\n".join(lines)
    return Response(csv_data, mimetype='text/csv', headers={'Content-Disposition': f'attachment; filename="hours_{start_date.isoformat()}_{end_date.isoformat()}.csv"'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
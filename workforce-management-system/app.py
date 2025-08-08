from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, Response
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from database import init_db, insert_employee, get_employees, insert_shift, get_shifts_with_names
from database import insert_attendance, get_attendance_with_names, insert_task, get_tasks_with_names
from database import delete_employee, delete_shift, delete_attendance, delete_task
from database import insert_user, get_user_by_email
from database import delete_shifts_by_series, update_shift_employee
import sqlite3
from datetime import datetime, timedelta, date, time as dtime
import uuid

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
        # delete occurrences on/after start_date in this series
        conn = sqlite3.connect('database.db')
        cur = conn.cursor()
        cur.execute("DELETE FROM shifts WHERE series_id = ? AND date(shift_time) >= date(?)", (series_id, start_date.isoformat()))
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
                # reassign if provided else keep same employee by selecting one existing row in series before deletion
                employee_id = data.get('employee_id')
                if employee_id is None:
                    # try to fetch previous employee from past occurrence (before start_date)
                    conn2 = sqlite3.connect('database.db')
                    cur2 = conn2.cursor()
                    cur2.execute("SELECT employee_id FROM shifts WHERE series_id = ? AND date(shift_time) < date(?) ORDER BY shift_time DESC LIMIT 1", (series_id, start_date.isoformat()))
                    row = cur2.fetchone()
                    conn2.close()
                    if row:
                        employee_id = row[0]
                insert_shift(employee_id, st_dt.isoformat(), et_dt.isoformat() if et_dt else None, series_id)
                occ += 1
            week_start += timedelta(days=7)
        return jsonify({ 'ok': True, 'updated': occ })
    except Exception as e:
        return jsonify({ 'ok': False, 'error': str(e) }), 500


# --- Weekly hours report ---
@app.route('/hours')
@login_required
def hours_report():
    # Optional query param ?start=YYYY-MM-DD; defaults to today, aligned to Monday
    start_raw = request.args.get('start')
    try:
        start_date = datetime.strptime(start_raw, '%Y-%m-%d').date() if start_raw else date.today()
    except ValueError:
        start_date = date.today()
    start_monday = start_date - timedelta(days=start_date.weekday())
    end_sunday = start_monday + timedelta(days=6)

    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT shifts.shift_time, shifts.end_time, employees.name AS employee_name
        FROM shifts
        JOIN employees ON shifts.employee_id = employees.id
        WHERE date(shifts.shift_time) BETWEEN date(?) AND date(?)
        """,
        (start_monday.isoformat(), end_sunday.isoformat())
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

    return render_template('hours.html', report=report, start=start_monday.isoformat(), end=end_sunday.isoformat())

# --- Weekly hours CSV export ---
@app.route('/hours.csv')
@login_required
def hours_csv():
    # reuse logic from hours_report
    start_raw = request.args.get('start')
    try:
        start_date = datetime.strptime(start_raw, '%Y-%m-%d').date() if start_raw else date.today()
    except ValueError:
        start_date = date.today()
    start_monday = start_date - timedelta(days=start_date.weekday())
    end_sunday = start_monday + timedelta(days=6)

    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(
        """
        SELECT shifts.shift_time, shifts.end_time, employees.name AS employee_name
        FROM shifts
        JOIN employees ON shifts.employee_id = employees.id
        WHERE date(shifts.shift_time) BETWEEN date(?) AND date(?)
        """,
        (start_monday.isoformat(), end_sunday.isoformat())
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
    return Response(csv_data, mimetype='text/csv', headers={'Content-Disposition': f'attachment; filename="hours_{start_monday.isoformat()}_{end_sunday.isoformat()}.csv"'})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
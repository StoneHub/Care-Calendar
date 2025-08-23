from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify, Response, g
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from database import (
    init_db, insert_employee, get_employees, insert_shift, get_shifts_with_names,
    insert_attendance, get_attendance_with_names, insert_task, get_tasks_with_names,
    delete_employee, delete_shift, delete_attendance, delete_task,
    insert_user, get_user_by_email, delete_shifts_by_series, update_shift_employee,
    connect_db, insert_time_off, get_time_off_overlapping, delete_time_off,
    employee_exists, get_time_off_by_id, update_time_off, update_user_password,
    update_employee_rate, insert_adjustment
)
import sqlite3
from datetime import datetime, timedelta, date, time as dtime
import os
import uuid
import time
import logging

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-change-me')
# Kiosk-friendly: keep sessions alive longer unless explicitly logged out
app.permanent_session_lifetime = timedelta(days=30)

# Force a low-cost hash suitable for Pi 2 unless overridden
os.environ.setdefault('CARE_PWHASH_METHOD', 'pbkdf2:sha256:15000')

# Simple auto-login controls (can be disabled via env)
AUTOLOGIN = os.environ.get('CARE_AUTOLOGIN', '1') == '1'
AUTOLOGIN_EMAIL = os.environ.get('CARE_AUTOLOGIN_EMAIL', 'monroesawesome@gmail.com')
AUTOLOGIN_PASSWORD = os.environ.get('CARE_AUTOLOGIN_PASSWORD', 'linux')
RATES_PIN = os.environ.get('CARE_RATES_PIN', '4125')

# -------- Lightweight performance instrumentation --------
# Always enabled (overhead is tiny); can be disabled by setting CARE_DISABLE_TIMING=1
if os.environ.get('CARE_DISABLE_TIMING') != '1':
    # Configure root logging only if not already configured by parent app
    _lvl = os.environ.get('CARE_LOG_LEVEL', 'INFO').upper()
    logging.basicConfig(level=_lvl, format='[%(asctime)s] %(levelname)s %(message)s')

    @app.before_request
    def _care_timer_start():  # type: ignore
        # High-resolution start time stored on flask.g
        g._care_t0 = time.perf_counter()

    @app.after_request
    def _care_timer_end(resp):  # type: ignore
        t0 = getattr(g, '_care_t0', None)
        if t0 is not None:
            dt_ms = (time.perf_counter() - t0) * 1000.0
            if not request.path.startswith('/static/'):
                app.logger.info(
                    "REQ method=%s path=%s status=%s dur=%.1fms",
                    request.method, request.path, resp.status_code, dt_ms
                )
        return resp

    # Opportunistic auto-login to streamline kiosk use
    @app.before_request
    def _care_autologin():  # type: ignore
        # Skip for static/auth endpoints and if already logged in
        if not AUTOLOGIN:
            return None
        if 'user_id' in session:
            return None
        if request.path.startswith('/static/'):
            return None
        if request.endpoint in ('logout', 'login', 'signup'):
            return None
        try:
            user = get_user_by_email(AUTOLOGIN_EMAIL)
        except Exception:
            user = None
        if not user:
            # Create the user with current hash method
            method = os.environ.get('CARE_PWHASH_METHOD')
            try:
                hpw = generate_password_hash(AUTOLOGIN_PASSWORD, method=method) if method else generate_password_hash(AUTOLOGIN_PASSWORD)
                insert_user('Monroe', AUTOLOGIN_EMAIL, hpw)
                user = get_user_by_email(AUTOLOGIN_EMAIL)
            except Exception as e:
                app.logger.warning("Auto-login user create failed: %s", e)
                return None
        if user:
            session['user_id'] = user[0]
            session.permanent = True
        return None


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to access this page', 'error')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def get_statistics():
    """Return basic counts using the canonical DB connection.
    Uses connect_db() so CARE_DB_PATH and migrations are respected.
    """
    conn = connect_db()
    cur = conn.cursor()
    try:
        # Employees
        cur.execute("SELECT COUNT(*) FROM employees")
        no_of_employees = cur.fetchone()[0]
        # Tasks
        cur.execute("SELECT COUNT(*) FROM tasks")
        no_of_tasks = cur.fetchone()[0]
        # Shifts
        cur.execute("SELECT COUNT(*) FROM shifts")
        no_of_shifts = cur.fetchone()[0]
        # Attendance Present/Absent
        cur.execute("SELECT COUNT(*) FROM attendance WHERE status = 'Present'")
        no_of_present = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM attendance WHERE status = 'Absent'")
        no_of_absent = cur.fetchone()[0]
    finally:
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
        # Granular timing to diagnose slow login
        lt0 = time.perf_counter()
        user = get_user_by_email(email)
        lt1 = time.perf_counter()
        hash_ok = False
        upgraded = False
        if user:
            stored_hash = user[3]
            try:
                hash_ok = check_password_hash(stored_hash, password)
            except Exception as e:
                app.logger.warning("Password hash check failed: %s", e)
            else:
                target_method = os.environ.get('CARE_PWHASH_METHOD')
                if hash_ok and target_method and not stored_hash.startswith(target_method + ':'):
                    try:
                        new_hash = generate_password_hash(password, method=target_method)
                        update_user_password(user[0], new_hash)
                        upgraded = True
                    except Exception as e:
                        app.logger.warning("Password hash upgrade failed: %s", e)
        lt2 = time.perf_counter()
        app.logger.info(
            "LOGIN diag email=%s user_lookup=%.1fms hash=%.1fms total=%.1fms found=%s ok=%s upgraded=%s",
            email,
            (lt1-lt0)*1000.0,
            (lt2-lt1)*1000.0,
            (lt2-lt0)*1000.0,
            bool(user),
            hash_ok,
            upgraded
        )
        if user and hash_ok:
            session['user_id'] = user[0]  # Assuming id is the 1st column
            session.permanent = True
            flash('Logged in successfully', 'success')
            return redirect(url_for('index'))
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
        
        method_override = os.environ.get('CARE_PWHASH_METHOD')
        if method_override:
            hashed_password = generate_password_hash(password, method=method_override)
        else:
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


# --- Time Off (Caregiver Unavailability) Endpoints ---

MAX_TIME_OFF_SPAN_DAYS = int(os.environ.get('CARE_TIME_OFF_MAX_DAYS', '30'))

def _parse_iso_date(val, field):
    try:
        return datetime.strptime(val, '%Y-%m-%d').date()
    except Exception:
        raise ValueError(f"{field} must be YYYY-MM-DD")

@app.route('/api/time_off', methods=['GET'])
@login_required
def api_time_off_list():
    """Return time off records overlapping the provided window (?start=YYYY-MM-DD&end=YYYY-MM-DD).
    If omitted, defaults to current month window (month start .. month end)."""
    start_raw = request.args.get('start')
    end_raw = request.args.get('end')
    today = date.today()
    if start_raw:
        try:
            start_d = _parse_iso_date(start_raw, 'start')
        except ValueError as ve:
            return jsonify({ 'ok': False, 'error': str(ve) }), 400
    else:
        start_d = date(today.year, today.month, 1)
    if end_raw:
        try:
            end_d = _parse_iso_date(end_raw, 'end')
        except ValueError as ve:
            return jsonify({ 'ok': False, 'error': str(ve) }), 400
    else:
        # End of month
        next_month = date(start_d.year + (1 if start_d.month == 12 else 0), 1 if start_d.month == 12 else start_d.month + 1, 1)
        end_d = next_month - timedelta(days=1)
    if end_d < start_d:
        start_d, end_d = end_d, start_d
    rows = get_time_off_overlapping(start_d.isoformat(), end_d.isoformat())
    data = [
        {
            'id': r['id'],
            'employee_id': r['employee_id'],
            'start_date': r['start_date'],
            'end_date': r['end_date'],
            'reason': r['reason']
        } for r in rows
    ]
    return jsonify({ 'ok': True, 'items': data })

@app.route('/api/time_off', methods=['POST'])
@login_required
def api_time_off_create():
    data = request.get_json(silent=True) or {}
    emp_id = data.get('employee_id')
    start_raw = data.get('start_date')
    end_raw = data.get('end_date')
    reason = data.get('reason')
    if emp_id is None or start_raw is None or end_raw is None:
        return jsonify({ 'ok': False, 'error': 'employee_id, start_date, end_date required' }), 400
    try:
        emp_id = int(emp_id)
    except Exception:
        return jsonify({ 'ok': False, 'error': 'employee_id must be integer' }), 400
    try:
        start_d = _parse_iso_date(start_raw, 'start_date')
        end_d = _parse_iso_date(end_raw, 'end_date')
    except ValueError as ve:
        return jsonify({ 'ok': False, 'error': str(ve) }), 400
    if end_d < start_d:
        return jsonify({ 'ok': False, 'error': 'end_date must be >= start_date' }), 400
    span_days = (end_d - start_d).days + 1
    if span_days > MAX_TIME_OFF_SPAN_DAYS:
        return jsonify({ 'ok': False, 'error': f'span exceeds {MAX_TIME_OFF_SPAN_DAYS} day limit' }), 400
    if reason and len(reason) > 120:
        return jsonify({ 'ok': False, 'error': 'reason too long (max 120 chars)' }), 400
    # Employee existence
    if not employee_exists(emp_id):
        return jsonify({ 'ok': False, 'error': 'employee not found' }), 404
    # Overlap check
    conn = connect_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT 1 FROM time_off
        WHERE employee_id = ? AND NOT(end_date < ? OR start_date > ?)
        LIMIT 1
        """,
        (emp_id, start_d.isoformat(), end_d.isoformat())
    )
    overlap = cur.fetchone() is not None
    conn.close()
    if overlap:
        return jsonify({ 'ok': False, 'error': 'overlapping time off exists' }), 409
    try:
        new_id = insert_time_off(emp_id, start_d.isoformat(), end_d.isoformat(), reason)
        return jsonify({ 'ok': True, 'item': {
            'id': new_id,
            'employee_id': emp_id,
            'start_date': start_d.isoformat(),
            'end_date': end_d.isoformat(),
            'reason': reason
        } }), 201
    except Exception as e:
        return jsonify({ 'ok': False, 'error': str(e) }), 500

@app.route('/api/time_off/<int:time_off_id>', methods=['DELETE'])
@login_required
def api_time_off_delete(time_off_id):
    try:
        deleted = delete_time_off(time_off_id)
        if not deleted:
            return jsonify({ 'ok': False, 'error': 'not found' }), 404
        return ('', 204)
    except Exception as e:
        return jsonify({ 'ok': False, 'error': str(e) }), 500

@app.route('/api/time_off/<int:time_off_id>', methods=['PATCH'])
@login_required
def api_time_off_patch(time_off_id):
    data = request.get_json(silent=True) or {}
    # Allow partial updates but we validate final set
    existing = get_time_off_by_id(time_off_id)
    if not existing:
        return jsonify({ 'ok': False, 'error': 'not found' }), 404
    emp_id = data.get('employee_id', existing['employee_id'])
    start_raw = data.get('start_date', existing['start_date'])
    end_raw = data.get('end_date', existing['end_date'])
    reason = data.get('reason', existing['reason'])
    try:
        emp_id = int(emp_id)
    except Exception:
        return jsonify({ 'ok': False, 'error': 'employee_id must be integer' }), 400
    try:
        start_d = _parse_iso_date(start_raw, 'start_date')
        end_d = _parse_iso_date(end_raw, 'end_date')
    except ValueError as ve:
        return jsonify({ 'ok': False, 'error': str(ve) }), 400
    if end_d < start_d:
        return jsonify({ 'ok': False, 'error': 'end_date must be >= start_date' }), 400
    span_days = (end_d - start_d).days + 2  # allow same span limit as create (inclusive)
    if span_days > MAX_TIME_OFF_SPAN_DAYS + 1:
        return jsonify({ 'ok': False, 'error': f'span exceeds {MAX_TIME_OFF_SPAN_DAYS} day limit' }), 400
    if reason and len(reason) > 120:
        return jsonify({ 'ok': False, 'error': 'reason too long (max 120 chars)' }), 400
    if not employee_exists(emp_id):
        return jsonify({ 'ok': False, 'error': 'employee not found' }), 404
    # Overlap (exclude self)
    conn = connect_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT 1 FROM time_off
        WHERE employee_id = ? AND id != ? AND NOT(end_date < ? OR start_date > ?)
        LIMIT 1
        """,
        (emp_id, time_off_id, start_d.isoformat(), end_d.isoformat())
    )
    overlap = cur.fetchone() is not None
    conn.close()
    if overlap:
        return jsonify({ 'ok': False, 'error': 'overlapping time off exists' }), 409
    try:
        updated = update_time_off(time_off_id, emp_id, start_d.isoformat(), end_d.isoformat(), reason)
        if not updated:
            return jsonify({ 'ok': False, 'error': 'not found (race)' }), 404
        return jsonify({ 'ok': True, 'item': {
            'id': time_off_id,
            'employee_id': emp_id,
            'start_date': start_d.isoformat(),
            'end_date': end_d.isoformat(),
            'reason': reason
        } })
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

        # Fetch the original shift; we will update THIS row only
        cursor.execute("SELECT employee_id, series_id, shift_time FROM shifts WHERE id = ?", (shift_id,))
        original_shift = cursor.fetchone()
        if not original_shift:
            conn.close()
            return jsonify({ 'ok': False, 'error': 'Original shift not found' }), 404

        # Default to original employee if not provided
        if employee_id is None:
            employee_id = int(original_shift[0])

        # Compute new datetimes on the provided date
        new_shift_datetime = datetime.combine(shift_datetime, shift_time_obj)
        new_end_datetime = None
        if end_time_obj:
            new_end_datetime = datetime.combine(shift_datetime, end_time_obj)

        # Validate end after start when provided
        if new_end_datetime and new_end_datetime <= new_shift_datetime:
            conn.close()
            return jsonify({ 'ok': False, 'error': 'end_time must be after start time' }), 400

        # Update this occurrence only
        cursor.execute(
            "UPDATE shifts SET shift_time = ?, end_time = ?, employee_id = ? WHERE id = ?",
            (
                new_shift_datetime.isoformat(),
                new_end_datetime.isoformat() if new_end_datetime else None,
                employee_id,
                shift_id
            )
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

    # Use canonical DB connection (respects CARE_DB_PATH, has schema migrations)
    conn = connect_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT employees.id AS employee_id, employees.name AS employee_name, employees.hourly_rate AS hourly_rate,
               shifts.shift_time, shifts.end_time
        FROM shifts
        JOIN employees ON shifts.employee_id = employees.id
        WHERE date(shifts.shift_time) BETWEEN date(?) AND date(?)
        """,
        (start_date.isoformat(), end_date.isoformat())
    )
    rows = cur.fetchall()

    # Aggregate minutes per employee
    totals_min = {}
    names = {}
    rates = {}
    for r in rows:
        emp_id = r['employee_id']
        names[emp_id] = r['employee_name']
        # hourly_rate may be NULL for legacy rows; treat as 16 default
        rates[emp_id] = r['hourly_rate'] if r['hourly_rate'] is not None else 16
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
        totals_min[emp_id] = totals_min.get(emp_id, 0) + minutes

    # Adjustments within range
    cur.execute(
        """
        SELECT employee_id, COALESCE(SUM(amount), 0) AS total
        FROM pay_adjustments
        WHERE date(date) BETWEEN date(?) AND date(?)
        GROUP BY employee_id
        """,
        (start_date.isoformat(), end_date.isoformat())
    )
    adj_rows = cur.fetchall()
    conn.close()
    adj_by_emp = { r['employee_id']: (r['total'] or 0.0) for r in adj_rows }
    rates_unlocked = bool(session.get('rates_unlocked'))
    # Build report
    report = []
    for emp_id, mins in sorted(totals_min.items(), key=lambda x: names.get(x[0], '').lower()):
        hours = round(mins / 60.0, 2)
        row = { 'employee_id': emp_id, 'name': names.get(emp_id, str(emp_id)), 'hours': hours }
        if rates_unlocked:
            rate = float(rates.get(emp_id, 16))
            adjustments = float(adj_by_emp.get(emp_id, 0.0))
            total = round(hours * rate + adjustments, 2)
            row.update({ 'rate': rate, 'adjustments': round(adjustments, 2), 'total': total })
        report.append(row)

    # Also need employees list for adjustment form
    employees = get_employees()
    return render_template('hours.html', report=report, start=start_date.isoformat(), end=end_date.isoformat(), rates_unlocked=rates_unlocked, employees=employees)

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

    conn = connect_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT employees.name AS employee_name,
               shifts.shift_time, shifts.end_time
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


# --- Rates PIN unlock and management ---

@app.route('/admin/unlock_rates', methods=['POST'])
@login_required
def admin_unlock_rates():
    pin = (request.form.get('pin') or (request.json and request.json.get('pin')) or '').strip()
    if pin == RATES_PIN:
        session['rates_unlocked'] = True
        # For form posts, redirect back if referer exists
        ref = request.headers.get('Referer') or url_for('employees')
        if request.content_type and 'application/json' in request.content_type:
            return jsonify({ 'ok': True })
        return redirect(ref)
    if request.content_type and 'application/json' in request.content_type:
        return jsonify({ 'ok': False, 'error': 'Invalid PIN' }), 403
    flash('Invalid PIN', 'error')
    ref = request.headers.get('Referer') or url_for('employees')
    return redirect(ref)


@app.route('/api/employee_rate', methods=['POST'])
@login_required
def api_employee_rate():
    if not session.get('rates_unlocked'):
        return jsonify({ 'ok': False, 'error': 'Rates locked' }), 403
    data = request.get_json(silent=True) or {}
    employee_id_val = data.get('employee_id') or request.form.get('employee_id')
    rate_val = data.get('rate') or request.form.get('rate')
    if employee_id_val is None or rate_val is None:
        return jsonify({ 'ok': False, 'error': 'employee_id and rate required' }), 400
    try:
        employee_id = int(employee_id_val)
        rate = float(rate_val)
    except Exception:
        return jsonify({ 'ok': False, 'error': 'invalid employee_id or rate' }), 400
    ok = update_employee_rate(employee_id, rate)
    if not ok:
        return jsonify({ 'ok': False, 'error': 'not found' }), 404
    # Redirect if it was a form post
    if request.content_type and 'application/json' in request.content_type:
        return jsonify({ 'ok': True })
    flash('Rate updated', 'success')
    return redirect(url_for('employees'))


@app.route('/api/pay_adjustment', methods=['POST'])
@login_required
def api_pay_adjustment():
    data = request.get_json(silent=True) or {}
    employee_id = data.get('employee_id') or request.form.get('employee_id')
    adj_date = data.get('date') or request.form.get('date')
    amount = data.get('amount') or request.form.get('amount')
    note = (data.get('note') or request.form.get('note') or '').strip()
    if not employee_id or not adj_date or amount is None:
        return jsonify({ 'ok': False, 'error': 'employee_id, date, amount required' }), 400
    try:
        employee_id = int(employee_id)
        amount = float(amount)
        datetime.strptime(adj_date, '%Y-%m-%d')
    except Exception:
        return jsonify({ 'ok': False, 'error': 'invalid inputs' }), 400
    from database import insert_adjustment, employee_exists
    if not employee_exists(employee_id):
        return jsonify({ 'ok': False, 'error': 'employee not found' }), 404
    try:
        insert_adjustment(employee_id, adj_date, amount, note)
    except Exception as e:
        return jsonify({ 'ok': False, 'error': str(e) }), 500
    if request.content_type and 'application/json' in request.content_type:
        return jsonify({ 'ok': True })
    flash('Adjustment added', 'success')
    # Redirect back to hours with same range if present
    start = request.args.get('start') or request.form.get('start')
    end = request.args.get('end') or request.form.get('end')
    return redirect(url_for('hours_report', start=start, end=end))

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
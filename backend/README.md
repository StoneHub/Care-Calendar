# Care Calendar Backend

This is the Express.js backend service for the Care Calendar application, providing API endpoints and real-time communication via Socket.io.

## Tech Stack

- **Express.js**: Web server framework
- **LowDB**: Lightweight JSON file database for local storage
- **Socket.io**: Real-time updates
- **Morgan**: HTTP request logger

## Features

- RESTful API for managing schedules, team members, and notifications
- JSON file-based database for persistent local storage
- Real-time updates using Socket.io
- Payroll calculation functionality

## Setup

1. Install dependencies:

```bash
npm install
```

2. Initialize the database:

```bash
npm run setup-db
```

3. Seed the database with initial data:

```bash
npm run seed-db
```

4. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Team Management

- `GET /api/team` - Get all team members
- `GET /api/team/:id` - Get a specific team member
- `POST /api/team` - Create a new team member
- `PUT /api/team/:id` - Update a team member
- `DELETE /api/team/:id` - Delete a team member

### Schedule Management

- `GET /api/schedule/weeks` - Get all weeks
- `GET /api/schedule/weeks/:id` - Get a specific week
- `GET /api/schedule/weeks/current` - Get the current week
- `POST /api/schedule/weeks` - Create a new week
- `PUT /api/schedule/weeks/:id` - Update a week
- `GET /api/schedule/weeks/:weekId/shifts` - Get all shifts for a week
- `GET /api/schedule/shifts/:id` - Get a specific shift
- `POST /api/schedule/shifts` - Create a new shift
- `PUT /api/schedule/shifts/:id` - Update a shift
- `DELETE /api/schedule/shifts/:id` - Delete a shift
- `POST /api/schedule/shifts/:id/drop` - Drop a shift
- `POST /api/schedule/shifts/:id/swap` - Swap shifts
- `POST /api/schedule/shifts/:id/adjust` - Adjust shift hours

### Notifications

- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/status/:status` - Get notifications by status
- `GET /api/notifications/:id` - Get a specific notification
- `POST /api/notifications` - Create a new notification
- `PUT /api/notifications/:id` - Update a notification
- `PUT /api/notifications/:id/approve` - Approve a notification

### Payroll

- `GET /api/payroll` - Get all payroll records
- `GET /api/payroll/week/:weekId` - Get payroll records by week
- `GET /api/payroll/caregiver/:caregiverId` - Get payroll records by caregiver
- `POST /api/payroll/calculate/:weekId` - Calculate payroll for a week
- `GET /api/payroll/:id` - Get a specific payroll record

## Directory Structure

```
backend/
├── config/ - Configuration files
├── db/ - JSON database files
├── src/
│   ├── routes/ - API route definitions
│   ├── controllers/ - Request handlers and business logic
│   ├── utils/ - Helper functions
│   │   ├── lowdbUtil.js - Database utilities for LowDB
│   │   ├── initializeDb.js - Initialize database directories
│   │   ├── setupDb.js - Create initial database structure
│   │   ├── seedDb.js - Seed database with initial data
│   │   └── socket.js - Socket.io utilities
│   └── server.js - Express server setup
```

## Database Schema

The database uses JSON files in the `db/` directory for the following collections:

- `team_members.json` - Information about caregivers
  - id, name, role, availability, hours_per_week

- `weeks.json` - Weekly schedule periods
  - id, start_date, end_date, is_published, notes

- `shifts.json` - Individual caregiver shifts
  - id, week_id, day_of_week, caregiver_id, start_time, end_time, status

- `notifications.json` - System notifications and history
  - id, type, from_caregiver_id, affected_shift_id, week_id, message, date, time, status

- `payroll_records.json` - Calculated hours for payroll
  - id, caregiver_id, week_id, total_hours, date_calculated, notes
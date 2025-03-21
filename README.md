# Care-Calendar

A locally hosted weekly calendar scheduler for my dear dad's required full time care. This application helps coordinate caregivers, track shifts, and manage schedule changes.

## Current Implementation

The project now has a structured approach with clear separation of concerns:

- **components/**: UI components organized by feature
- **hooks/**: Business logic and state management
- **services/**: Data handling (mock data for now, SQLite later)
- **types/**: TypeScript type definitions
- **utils/**: Helper functions
- **pages/**: Page components that compose other components

## Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Lint code
npm run lint
```

# Care Team Scheduler - Development Plan

## Project Overview

**GitHub Repository**: [https://github.com/StoneHub/Care-Calendar.git](https://github.com/StoneHub/Care-Calendar.git)

The Care Team Scheduler is a shared, trust-based digital tool for managing a care team's weekly schedule. It allows caregivers to dynamically update shifts, swap responsibilities, and keep everyone informed of changes in real-time. The application will be hosted locally on a dedicated home server (possibly displayed on a fridge or common area device) for easy access by all care team members.

## Technical Approach

### Architecture

Since we're keeping everything local and avoiding cloud services:

1. **Frontend**: React-based web application 
2. **Backend**: Node.js with Express
3. **Database**: SQLite (lightweight, file-based database)
4. **Local Networking**: Application accessible via local IP address

### Core Components

1. **Web Server**: Serves the application and handles API requests
2. **Database**: Stores schedule, team member, and change history data
3. **Notification System**: Local notification management (without Firebase)
4. **Responsive UI**: Works on any device accessing the local network
5. **Week Navigation**: View and manage past, current, and future weeks
6. **Historical Data Access**: Archive of past schedules for payroll and reference

## Technology Stack

### Frontend
- **React**: For component-based UI development
- **Tailwind CSS**: For styling (already used in prototype)
- **Lucide React**: For icons
- **React Router**: For navigation between views
- **Axios**: For API communication with backend

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web server framework
- **SQLite3**: Lightweight database
- **Knex.js**: SQL query builder for database operations
- **Socket.io**: For real-time updates across devices

### Development Tools
- **Vite**: Modern build tool and development server
- **ESLint**: Code quality assurance
- **Git**: Version control

## Database Schema

```sql
-- Team Members
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  availability TEXT NOT NULL,
  hours_per_week INTEGER NOT NULL
);

-- Weeks
CREATE TABLE weeks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  start_date TEXT NOT NULL UNIQUE,
  end_date TEXT NOT NULL,
  is_published BOOLEAN DEFAULT 0,
  notes TEXT
);

-- Shifts
CREATE TABLE shifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL,
  caregiver_id INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  FOREIGN KEY(caregiver_id) REFERENCES team_members(id),
  FOREIGN KEY(week_id) REFERENCES weeks(id)
);

-- Notifications/History
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  from_caregiver_id INTEGER NOT NULL,
  affected_shift_id INTEGER,
  week_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY(from_caregiver_id) REFERENCES team_members(id),
  FOREIGN KEY(affected_shift_id) REFERENCES shifts(id),
  FOREIGN KEY(week_id) REFERENCES weeks(id)
);

-- Payroll Records (for historical reference)
CREATE TABLE payroll_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caregiver_id INTEGER NOT NULL,
  week_id INTEGER NOT NULL,
  total_hours REAL NOT NULL,
  date_calculated TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY(caregiver_id) REFERENCES team_members(id),
  FOREIGN KEY(week_id) REFERENCES weeks(id)
);
```

## Development Phases

### Phase 1: Setup (Week 1) - COMPLETED
1. ✅ Clone the GitHub repository
2. ✅ Create project structure
3. ✅ Initialize React frontend with Vite
4. ✅ Implement component structure and separation of concerns

### Phase 2: Core Functionality (Weeks 2-3)
1. Set up Node.js/Express backend
2. Configure SQLite database
3. Create the schedule view component with week navigation
4. Develop shift management functionality
5. Create team member management

### Phase 3: Historical Data & Future Planning (Week 4)
1. Implement week creation and management
2. Develop payroll report generation
3. Create future week planning tools

### Phase 4: Notifications & History (Week 5)
1. Implement local notification system
2. Create notification display
3. Develop history tracking
4. Build timeline view of changes

### Phase 5: Integration & Polish (Week 6)
1. Connect all components
2. Implement real-time updates with Socket.io
3. Optimize for responsive display
4. Add application settings

### Phase 6: Testing & Deployment (Week 7)
1. Test on various devices on local network
2. Fix bugs and performance issues
3. Set up the dedicated computer as a server
4. Create startup scripts and documentation
5. Deploy to the local server

## Initial Data Setup

The application will be initialized with the current care team structure:

- **Weekdays (Mon – Fri):**
  - **Robin:** 9 AM – 4 PM
  - **Scarlet:** 4 PM – 9 PM
- **Weekends (Sat – Sun):**
  - **Kelly:** 9 AM – 3 PM
  - **Joanne:** 3 PM – 9 PM

This will be part of the database seeding process during setup.
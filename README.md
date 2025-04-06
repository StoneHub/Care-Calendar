# Care Calendar

A locally hosted weekly calendar scheduler for coordinating full-time care. This application helps coordinate caregivers, track shifts, and manage schedule changes.

## Project Overview

The Care Team Scheduler is a shared, trust-based digital tool for managing a care team's weekly schedule. It allows caregivers to dynamically update shifts, swap responsibilities, and keep everyone informed of changes in real-time. The application will be hosted locally on a dedicated home server (possibly displayed on a fridge or common area device) for easy access by all care team members.

## Architecture

The application has a well-structured architecture with clear separation of concerns:

- **Frontend:** React with TypeScript and Vite
  - **Context-based State Management:** Uses ScheduleContext for centralized state
  - **Service Layer:** DateService and APIService provide core functionality
  - **Component Structure:** Organized by feature (schedule, team, notifications)

- **Backend:** Express.js with SQLite
  - **RESTful API:** Endpoints for schedule, team, and notifications
  - **Real-time Updates:** Socket.io for real-time communication
  - **Database:** SQLite with Knex.js query builder

## Project Structure

```
Care-Calendar/
├── backend/                   # Express.js backend
│   ├── config/                # Configuration files
│   ├── db/                    # SQLite database files
│   │   └── care_calendar.sqlite3
│   ├── knexfile.js            # Knex.js database configuration
│   ├── src/
│   │   ├── config/            # Application configuration
│   │   │   └── database.js    # Database connection settings
│   │   ├── controllers/       # API route controllers
│   │   │   ├── notificationController.js
│   │   │   ├── payrollController.js
│   │   │   ├── scheduleController.js
│   │   │   └── teamController.js
│   │   ├── models/            # Data models
│   │   ├── routes/            # API route definitions
│   │   │   ├── index.js       # Route aggregation
│   │   │   ├── notifications.js
│   │   │   ├── payroll.js
│   │   │   ├── schedule.js
│   │   │   └── team.js 
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   │   ├── db.js          # Database connection
│   │   │   ├── generateCalendarWeeks.js
│   │   │   ├── initializeDb.js
│   │   │   ├── logger.js
│   │   │   ├── seedDb.js
│   │   │   ├── setupDb.js
│   │   │   └── socket.js
│   │   └── server.js          # Main Express server entry point
│   ├── package.json
│   └── README.md
├── src/                       # Frontend React application
│   ├── App.tsx                # Main React component
│   ├── components/            # UI components
│   │   ├── layout/            # Page layout components
│   │   ├── notifications/     # Notification components
│   │   │   ├── NotificationList.tsx
│   │   │   └── NotificationsView.tsx
│   │   ├── schedule/          # Schedule-related components
│   │   │   ├── CreateWeekModal.tsx
│   │   │   ├── DayHeader.tsx
│   │   │   ├── EnhancedAddShiftModal.tsx
│   │   │   ├── EnhancedScheduleGrid.tsx
│   │   │   ├── EnhancedWeekSelector.tsx
│   │   │   └── ShiftOptionsModal.tsx
│   │   ├── shared/            # Reusable UI components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LogViewer.tsx
│   │   │   └── ShiftCard.tsx
│   │   └── team/              # Team management components
│   │       ├── CaregiverCard.tsx
│   │       ├── CaregiverModal.tsx
│   │       └── TeamView.tsx
│   ├── context/               # React Context providers
│   │   └── ScheduleContext.tsx
│   ├── hooks/                 # Custom React hooks
│   │   └── index.ts
│   ├── pages/                 # Page components
│   │   └── EnhancedCareSchedulerPage.tsx
│   ├── services/              # API services
│   │   ├── core/
│   │   │   ├── APIService.ts  # API communication
│   │   │   ├── DateService.ts # Date manipulation utilities
│   │   │   └── index.ts
│   │   ├── index.ts
│   │   ├── mockData.ts        # Testing data
│   │   └── socket.ts          # Socket.io client
│   ├── types/                 # TypeScript type definitions
│   │   ├── global.d.ts
│   │   ├── index.ts
│   │   └── lucide-react.d.ts
│   └── utils/                 # Utility functions
│       ├── logger.ts
│       └── mappers.ts
├── CLAUDE.md                  # Development guidelines
├── ROADMAP.md                 # Future development plans
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite bundler configuration
├── package.json
└── README.md
```

## Recent Fixes & Changes

The latest updates address several critical issues:

### 1. Week Navigation Fixes
- Improved date-based navigation instead of array indices
- More reliable week detection based on date calculations
   
### 2. Add Shift Modal Fixes
- Fixed issue with adding shifts to weeks other than the selected week
- Improved validation and error handling
   
### 3. Current Day Highlighting
- Fixed to only highlight today when viewing the current week
- Proper date comparison to determine today

### 4. SQLite Windows Compatibility
- Fixed SQLite compatibility issues on Windows systems
- Simplified database connection logic to detect platform
- Added dedicated Windows compatibility mode

## Setup and Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm run backend:install

# Set up the database
npm run backend:setup-db

# Seed database with initial data
npm run backend:seed-db
```

### Development

#### On Linux/macOS

```bash
# Start both frontend and backend
npm run dev:all

# Start only frontend
npm run dev

# Start only backend
npm run backend:dev
```

#### On Windows

```bash
# Recommended: Start everything with one command (simplest option)
npm run start:windows

# Start only frontend
npm run dev
```

### Building

```bash
# Build for production
npm run build
```

### Testing

```bash
# Type checking
npm run typecheck

# Lint code
npm run lint
```

## Database Schema

The application uses the following database schema:

- **team_members:** Stores caregiver information
- **weeks:** Stores calendar weeks
- **shifts:** Stores shifts for each week
- **notifications:** Stores system notifications and requests
- **payroll_records:** Stores historical payroll data

## Known Issues

- When adding shifts, make sure to wait for the operation to complete before making another change
- The application is designed for local use only and doesn't have authentication 
- SQLite binary compatibility issues on Windows: SQLite binaries are platform-specific and the native modules may not work correctly on Windows systems. We've implemented several solutions:
  - Use `npm run dev:all` for Linux/macOS systems
  - Use `npm run dev:all:windows` or `npm run start:windows` for Windows systems
  - If you still encounter SQLite errors, try reinstalling with `npm uninstall sqlite3 && npm install sqlite3`

## Deployment

The application is intended to be deployed on a local Raspberry Pi 2B for home use:

1. Build the frontend (`npm run build`)
2. Copy the backend and frontend build to the Raspberry Pi
3. Set up a process manager (e.g., PM2) to keep the application running
4. Configure local networking to access the application from other devices

## Contributing

To contribute to the project:

1. Familiarize yourself with the architecture and code style
2. Follow the development guidelines in the CLAUDE.md file
3. Test your changes locally before committing
4. Make sure to run linting and type checking before submitting changes
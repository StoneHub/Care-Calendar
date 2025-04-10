# Care Calendar

A locally hosted weekly calendar scheduler for coordinating full-time care. This application helps coordinate caregivers, track shifts, and manage schedule changes.

## Coming Soon

We're working on several exciting enhancements:

1. ✅ **Local Network Access** - View the calendar on your smart fridge and other devices
2. ✅ **Dark Mode** - Automatic switching based on time of day (6am-7pm)
3. ✅ **Team Member Unavailability** - Mark days out directly on the calendar
4. **Enhanced Reporting** - Detailed HTML reports for payroll management
5. **Google Calendar Integration** - Sync schedules to team members' phones

See `ROADMAP.md` for the complete development plan.

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

## Recent Fixes and Improvements

The latest updates address several critical issues and implement new features:

**Dark Mode & Theme Consistency:**
- Implemented simple 6am-7pm fixed times for Greenville, SC auto-switching
- Added consistent theming across all components using standardized utility classes
- Enhanced accessibility with proper ARIA attributes
- Fixed component inconsistencies reported by Greenville users
- Fixed modal components with stark white backgrounds in dark mode (CaregiverModal, CreateWeekModal, ShiftOptionsModal)
- Updated main interface components (calendar grid, week selector, shift cards) with proper dark mode styling to reduce eye strain
- Fixed Team and History components for proper dark mode display
- Ensured "Team Management" title and "Team Unavailability" component properly adapt to dark mode

**Team Member Unavailability:**
- Added ability to mark days team members are unavailable
- Implemented weekly recurring unavailability patterns
- Added visual indicators on the calendar for unavailable team members
- Created dedicated UI for managing time off in Team Management

**Local Network Access:**
- Added ability to access Calendar from any device on local network
- Implemented mDNS discovery service for easy access via "care-calendar.local"
- Optimized display for smart fridges and tablets
- Added documentation for network access in docs/local-network-access.md

1. **History System:**
   - Added comprehensive history tracking of all changes
   - Replaced Notifications tab with History view
   - Implemented filtering by action type, entity type, and week

2. **Data Preservation:**
   - Added transaction support for all database operations
   - Enhanced error handling and recovery
   - Improved data integrity across system restarts

3. **UI Improvements:**
   - Removed unused Settings button
   - Added version information in header

4. **Team Management:**
   - Implemented full team management functionality
   - Added ability to add, edit, and delete team members
   - Implemented force delete option to remove caregivers and their assigned shifts
   - Enhanced error handling for dependent records
   - Improved UI with real-time updates without page refreshes

5. **Previous Updates:**
   - **Week Navigation Fixes:** 
     - Improved date-based navigation instead of array indices
     - More reliable week detection based on date calculations
   
   - **Add Shift Modal Fixes:**
     - Fixed issue with adding shifts to weeks other than the selected week
     - Corrected backend data format for shift organization
     - Improved validation and error handling
   
   - **Delete Shift Fixes:**
     - Added cascading deletion of related notifications to prevent errors
     - Fixed issue with deleting dropped shifts
     - Improved error handling and logging
   
   - **Current Day Highlighting:**
     - Fixed to only highlight today when viewing the current week
     - Proper date comparison to determine today

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

```bash
# Start both frontend and backend
npm run dev:all

# Start only frontend
npm run dev

# Start only backend
npm run backend:dev
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
- **unavailability:** Stores team member time off records
- **history_records:** Tracks all changes to the system
- **notifications:** Stores system notifications and requests
- **payroll_records:** Stores historical payroll data

## Known Issues and Troubleshooting

- When adding shifts, make sure to wait for the operation to complete before making another change
- The application is designed for local use only and doesn't have authentication

### Database Issues

If you experience database connection problems:

1. Check the debug logs: `http://localhost:3001/api/debug/logs`
2. Verify database status: `http://localhost:3001/api/debug/db`
3. Reset the database (this will erase all data and restart with fresh data):
   ```bash
   cd backend
   npm run reset-db
   ```

### Debug Tools

Available endpoints for troubleshooting:
- `/api/debug/logs` - View application logs
- `/api/debug/db` - Check database connection and table status

### Backend Commands

- `npm run setup-db`: Set up database schema
- `npm run seed-db`: Seed the database with test data  
- `npm run reset-db`: Reset and rebuild the database
- `npm run debug-db`: Manual database reset utility
- `npm run setup-history`: Initialize history tracking table

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
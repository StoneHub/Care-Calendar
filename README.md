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

## Recent Fixes and Improvements

The latest updates address several critical issues:

1. **Week Navigation Fixes:** 
   - Improved date-based navigation instead of array indices
   - More reliable week detection based on date calculations
   
2. **Add Shift Modal Fixes:**
   - Fixed issue with adding shifts to weeks other than the selected week
   - Corrected backend data format for shift organization
   - Improved validation and error handling
   
3. **Delete Shift Fixes:**
   - Added cascading deletion of related notifications to prevent errors
   - Fixed issue with deleting dropped shifts
   - Improved error handling and logging
   
4. **Current Day Highlighting:**
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
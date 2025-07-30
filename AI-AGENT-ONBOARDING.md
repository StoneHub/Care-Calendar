# AI Agent Onboarding Guide: Care Calendar Project

Welcome to the Care Calendar project! This comprehensive guide will help you understand the project, its current status, and how to contribute effectively.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technical Architecture](#technical-architecture)
3. [Current Project Status](#current-project-status)
4. [Development Setup](#development-setup)
5. [Key Files and Structure](#key-files-and-structure)
6. [Development Workflow](#development-workflow)
7. [Current Issues and Known Problems](#current-issues-and-known-problems)
8. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
9. [Contribution Guidelines](#contribution-guidelines)
10. [Useful Resources](#useful-resources)

## Project Overview

### What is Care Calendar?
Care Calendar is a locally hosted weekly calendar scheduler designed for coordinating full-time care teams. It provides a shared, trust-based digital tool for managing caregiver schedules, shift swapping, and real-time communication.

### Key Characteristics
- **Local deployment**: Runs on local network (designed for Raspberry Pi 2B)
- **Trust-based**: No authentication system - relies on team cooperation
- **Real-time**: Uses Socket.io for instant updates across devices
- **Mobile-friendly**: Optimized for smart fridges, tablets, and mobile devices
- **Team-focused**: Designed for small care teams with dynamic scheduling needs

### Target Users
- Family caregivers coordinating care for elderly or disabled family members
- Small professional care teams
- Home healthcare coordinators

### Deployment Target
- Primary: Raspberry Pi 2B with Node.js 10.24.1
- Secondary: Local development machines
- Network access via mDNS (care-calendar.local)

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context (ScheduleContext)
- **Real-time**: Socket.io-client
- **HTTP Client**: Axios

### Backend Stack
- **Framework**: Express.js
- **Database**: SQLite (migrating to LowDB for Pi 2B compatibility)
- **Query Builder**: Knex.js (being replaced with LowDB utilities)
- **Real-time**: Socket.io
- **Logging**: Morgan

### Database Schema
```
team_members: id, name, role, availability, is_active
weeks: id, start_date, end_date, is_published, notes
shifts: id, week_id, day_of_week, caregiver_id, start_time, end_time, status, is_recurring, recurring_end_date, parent_shift_id
unavailability: id, team_member_id, start_date, end_date, is_recurring, notes
history_records: id, action_type, entity_type, entity_id, details, timestamp
notifications: id, type, from_caregiver_id, affected_shift_id, week_id, message, date, time, status
payroll_records: id, caregiver_id, week_id, total_hours, date_calculated, notes
```

### Service Layer Architecture
- **DateService**: Handles date calculations and week management
- **APIService**: Centralizes HTTP requests and data mapping
- **ScheduleContext**: Manages global state for schedule data
- **Socket utilities**: Real-time communication helpers

## Current Project Status

### ✅ Completed Features
1. **Local Network Access** - Access from any device on local network via mDNS
2. **Dark Mode** - Automatic switching based on time (6am-7pm for Greenville, SC)
3. **Team Member Unavailability** - Mark and track team member time off
4. **Enhanced Team Management** - Add, edit, delete team members with force delete option
5. **History System** - Comprehensive tracking of all changes
6. **Core Scheduling** - Create, edit, delete shifts with real-time updates

### 🔄 In Progress Features
1. **Repeating Weekly Shifts** - PARTIALLY WORKING (main current issue)
   - ✅ UI implementation complete
   - ✅ Backend logic implemented
   - ❌ Shifts not appearing on subsequent weeks
2. **Backend Migration to LowDB** - IN PROGRESS
   - ✅ Team and schedule controllers migrated
   - ❌ History, notification, payroll, unavailability controllers pending
3. **Enhanced Reporting** - Planned HTML reports for payroll

### 🔄 Planned Features
1. **Google Calendar Integration** - Sync to team members' personal calendars
2. **Advanced Reporting** - Detailed payroll and scheduling reports

### Version Information
- Current Version: 0.1.0
- Node.js Target: 10.24.1+ (for Pi 2B compatibility)
- Database Migration: SQLite → LowDB (JSON file storage)

## Development Setup

### Prerequisites
- Node.js 16+ (development) / 10.24.1+ (production on Pi)
- npm or yarn
- Git

### Quick Setup
```bash
# Clone and navigate to project
git clone <repository-url>
cd Care-Calendar

# Install dependencies
npm install
npm run backend:install

# Set up database
npm run backend:setup-db
npm run backend:seed-db

# Start development servers
npm run dev:all
```

### Access Points
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api
- Network access: http://care-calendar.local (when deployed)

### Available Commands
```bash
# Development
npm run dev              # Frontend only
npm run backend:dev      # Backend only
npm run dev:all         # Both frontend and backend

# Build and Production
npm run build           # Build for production
npm start              # Production mode

# Code Quality
npm run lint           # ESLint
npm run typecheck      # TypeScript checking

# Database Management
npm run backend:setup-db    # Initialize database
npm run backend:seed-db     # Add sample data
npm run backend:reset       # Reset database (destructive)

# Platform-specific
npm run start:windows      # Windows compatibility mode
```

## Key Files and Structure

### Critical Configuration Files
- `package.json` - Main project configuration and scripts
- `vite.config.ts` - Frontend build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Styling configuration
- `backend/package.json` - Backend dependencies and scripts

### Frontend Architecture
```
src/
├── components/           # React components
│   ├── schedule/        # Schedule-related components
│   ├── team/           # Team management components
│   └── ui/             # Reusable UI components
├── context/            # React Context providers
├── services/           # API and business logic services
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── utils/              # Utility functions
```

### Backend Architecture
```
backend/
├── src/
│   ├── controllers/    # API endpoint logic
│   ├── routes/         # Express route definitions
│   ├── utils/          # Database and utility functions
│   └── server.js       # Express server setup
├── db/                 # Database files (SQLite/LowDB)
└── config/             # Configuration files
```

### Key Documentation Files
- `README.md` - Main project documentation
- `FEATURE-SUMMARY.md` - Detailed feature status and implementation notes
- `IMPLEMENTATION-NOTES.md` - Technical implementation details and migration info
- `ROADMAP.md` - Development plan and progress tracking
- `DEBUGGING-GUIDE.md` - Troubleshooting steps for common issues
- `CLAUDE.md` - Development guidelines and coding standards
- `WSL-SETUP.md` - Windows Subsystem for Linux setup instructions

## Development Workflow

### Making Changes
1. **Understand the Issue**: Read relevant documentation files
2. **Plan Changes**: Use minimal modifications approach
3. **Test Early**: Run linting, building, and testing frequently
4. **Commit Often**: Use descriptive commit messages
5. **Document Changes**: Update relevant documentation

### Code Style Guidelines
- **Formatting**: Use Prettier (2 spaces indentation)
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Group React, external libraries, then internal modules
- **State Management**: Prefer local state, use Context for global state
- **Error Handling**: Use try/catch blocks and user-friendly error messages

### Testing Approach
- **Type Safety**: Run `npm run typecheck` regularly
- **Code Quality**: Use `npm run lint` for style checking
- **Manual Testing**: Test in browser for UI changes
- **Database Testing**: Use debug endpoints `/api/debug/logs` and `/api/debug/db`

## Current Issues and Known Problems

### 🔥 Priority Issue: Repeating Weekly Shifts Not Working
**Problem**: When creating a shift with "Repeats Weekly" checked, the shift appears on the current week but not on subsequent weeks.

**Status**: UI and backend logic implemented, but recurring logic failing

**Files Involved**:
- `src/components/schedule/EnhancedAddShiftModal.tsx` (UI)
- `backend/src/controllers/scheduleController.js` (Backend logic)
- `src/types/index.ts` (Type definitions)
- `src/services/core/APIService.ts` (API integration)

**Potential Causes**:
- Date calculation errors in recurring shift creation
- Transaction rollback issues
- Week creation problems for future dates
- UI filtering excluding recurring shifts

### 🔄 Backend Migration Issues
**Problem**: Migration from Knex/SQLite to LowDB for Pi 2B compatibility

**Status**: Team and schedule controllers completed, others pending

**Remaining Controllers**:
- history
- notification  
- payroll
- unavailability

### 🐛 Other Known Issues
- **Build Failure**: TypeScript errors prevent building (17 errors in 9 files)
- **Code Quality**: 64 ESLint errors and 17 TypeScript errors (pre-existing, blocking)
- **Database schema updates** require full reset (no migrations)
- **Port conflicts** in development environment
- **SQLite compatibility issues** on Windows
- **Memory leaks** in Socket.io connections (monitor)
- **Unused variables** and imports throughout codebase
- **Missing type definitions** (extensive use of `any` type)
- **Type safety**: `hours` property removed from Caregiver interface but still referenced in UI

## Debugging and Troubleshooting

### Database Issues
```bash
# Check database status
curl http://localhost:3001/api/debug/db

# View application logs
curl http://localhost:3001/api/debug/logs

# Reset database (destructive)
cd backend && bash reset-db.sh
```

### Common Troubleshooting Steps
1. **Port Conflicts**: Check `lsof -i :3001` and `lsof -i :5173`
2. **Database Lock**: Stop all processes and restart
3. **Node Modules**: Delete `node_modules` and reinstall
4. **Database Corruption**: Use reset script and reseed

### Debug Endpoints
- `/api/debug/logs` - View application logs
- `/api/debug/db` - Check database connection and tables
- All API endpoints return JSON with error details

### Platform-Specific Issues
- **Windows**: Use `npm run start:windows` for compatibility
- **WSL**: Follow `WSL-SETUP.md` for configuration
- **Raspberry Pi**: Use LowDB branch for compatibility

## Contribution Guidelines

### Before Making Changes
1. **Read Documentation**: Understand the feature/issue completely
2. **Check Current Status**: Review `ROADMAP.md` and `FEATURE-SUMMARY.md`
3. **Plan Minimal Changes**: Prefer surgical modifications over rewrites
4. **Test Environment**: Ensure clean database and running services

### Code Modification Rules
- **Minimal Changes**: Change as few lines as possible
- **Preserve Working Code**: Don't modify functioning features
- **Test Changes**: Verify changes don't break existing functionality
- **Document Updates**: Update relevant documentation files

### Pull Request Process
1. Create descriptive commit messages
2. Update documentation if needed
3. Test thoroughly in development environment
4. Include screenshots for UI changes
5. Reference issue numbers in commits

### Emergency Procedures
- **Database Corruption**: Use `backend/reset-db.sh`
- **Service Failures**: Check logs and restart services
- **Migration Issues**: Revert to SQLite branch if needed

## Useful Resources

### External Documentation
- [React Documentation](https://react.dev/) - Frontend framework
- [Express.js Guide](https://expressjs.com/) - Backend framework
- [Socket.io Documentation](https://socket.io/docs/) - Real-time communication
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type system

### Project-Specific Resources
- **API Testing**: Use Postman or curl for endpoint testing
- **Database Queries**: SQLite CLI for direct database access
- **Real-time Testing**: Browser developer tools for Socket.io debugging
- **Mobile Testing**: Browser device emulation for responsive design

### Development Tools
- **VS Code Extensions**: ES7+ React snippets, Tailwind IntelliSense
- **Browser Extensions**: React Developer Tools, Vue.js devtools
- **Command Line**: `jq` for JSON parsing, `curl` for API testing

---

## Quick Reference

### Essential Commands
```bash
npm run dev:all          # Start development
npm run backend:reset    # Reset database
npm run lint            # Check code style
npm run typecheck       # Check TypeScript
```

### Key URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Base: http://localhost:3001/api
- Debug Logs: http://localhost:3001/api/debug/logs

### Critical Files for Current Issues
- `backend/src/controllers/scheduleController.js` - Recurring shifts logic
- `src/components/schedule/EnhancedAddShiftModal.tsx` - Recurring shifts UI
- `backend/src/utils/lowdbUtil.js` - LowDB migration utilities

Remember: This is a care coordination tool that real families depend on. Test changes thoroughly and prioritize stability over new features.
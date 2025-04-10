# Running Care-Calendar in WSL Environment

This guide provides instructions for setting up and running the Care-Calendar application in a Windows Subsystem for Linux (WSL) environment.

## Prerequisites

1. WSL installed on your Windows machine
   - If not installed, follow [Microsoft's official guide](https://learn.microsoft.com/en-us/windows/wsl/install)
   - Recommended: Ubuntu 20.04 LTS or newer

2. Node.js and npm installed in your WSL environment
   - Recommended: Node.js v16+ and npm v8+
   - Install in WSL: `sudo apt update && sudo apt install nodejs npm`
   - Or use nvm (recommended): [NVM Installation Guide](https://github.com/nvm-sh/nvm#installing-and-updating)

## Setup Instructions

1. Open PowerShell and navigate to your project directory
   ```powershell
   cd C:\Users\monro\Projects\Care-Calendar
   ```

2. Start WSL in the current directory
   ```powershell
   wsl
   ```

3. Make the start script executable (first time only)
   ```bash
   chmod +x ./start-wsl.sh
   ```

4. Run the start script
   ```bash
   ./start-wsl.sh
   ```

The script will:
- Check for Node.js and npm
- Install dependencies if needed
- Set up and seed the database if it doesn't exist
- Start both the frontend and backend services

## Manual Setup (Alternative)

If you prefer to run commands manually:

1. Install frontend dependencies
   ```bash
   npm install
   ```

2. Install backend dependencies
   ```bash
   cd backend && npm install && cd ..
   ```

3. Set up the database (first time only)
   ```bash
   cd backend && npm run setup-db && cd ..
   cd backend && npm run seed-db && cd ..
   cd backend && npm run setup-history && cd ..
   cd backend && npm run setup-unavailability && cd ..
   ```

4. Start the application
   ```bash
   npm run dev:all
   ```

## Troubleshooting

### Database Issues

If you encounter database-related errors:

1. Delete the existing database file
   ```bash
   rm backend/db/care_calendar.sqlite3
   ```

2. Re-run the setup commands
   ```bash
   cd backend && npm run setup-db && cd ..
   cd backend && npm run seed-db && cd ..
   cd backend && npm run setup-history && cd ..
   cd backend && npm run setup-unavailability && cd ..
   ```

### Port Conflicts

If you see "address already in use" errors:

1. Find the process using the port (e.g., for port 3001)
   ```bash
   lsof -i :3001
   ```

2. Kill the process
   ```bash
   kill -9 <PID>
   ```

3. Restart the application
   ```bash
   npm run dev:all
   ```

## Accessing the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api

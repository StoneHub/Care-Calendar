/**
 * Windows Compatibility Script for Care-Calendar
 * 
 * This script provides a simple way to run the Care-Calendar application
 * on Windows with SQLite compatibility issues resolved.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Starting Care-Calendar in Windows compatibility mode...');

// Start frontend
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

console.log('Frontend started...');

// Start backend with Windows compatibility mode
const backend = spawn('node', ['backend/run-windows.js'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    USE_BETTER_SQLITE3: 'true'
  }
});

console.log('Backend started with Windows compatibility mode...');

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down Care-Calendar...');
  frontend.kill();
  backend.kill();
  process.exit(0);
});

// Handle child process errors
frontend.on('error', (error) => {
  console.error('Frontend error:', error);
});

backend.on('error', (error) => {
  console.error('Backend error:', error);
});

// Log completion
console.log('\nCare-Calendar is running! Press Ctrl+C to stop.');
console.log('Frontend: http://localhost:5173');
console.log('Backend API: http://localhost:3000\n');
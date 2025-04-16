/**
 * Simple start script for Care Calendar that works with Node.js 10
 * This replaces concurrently which requires Node.js 12+
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get command line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--production');

// Colors for terminal output
const colors = {
  frontend: '\x1b[36m', // cyan
  backend: '\x1b[32m',  // green
  error: '\x1b[31m',    // red
  reset: '\x1b[0m'      // reset
};

// Function to print with timestamp and colors
function logWithTimestamp(prefix, message, isError = false) {
  const timestamp = new Date().toLocaleTimeString();
  const color = isError ? colors.error : (prefix === 'frontend' ? colors.frontend : colors.backend);
  console.log(`${color}[${timestamp}] [${prefix}]${colors.reset} ${message}`);
}

// Check if we need to update the IP in index.html
try {
  const publicDir = path.join(__dirname, 'public');
  const indexHtmlPath = path.join(publicDir, 'index.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // If index.html contains the placeholder IP
    if (indexHtml.includes('YOUR_IP_ADDRESS')) {
      logWithTimestamp('setup', 'Replacing placeholder IP with actual IP address...');
      
      // Get the local IP address (simple implementation)
      const { networkInterfaces } = require('os');
      const nets = networkInterfaces();
      let localIp = 'localhost';
      
      // Find the first non-internal IPv4 address
      Object.keys(nets).forEach((name) => {
        nets[name].forEach((net) => {
          if (net.family === 'IPv4' && !net.internal) {
            localIp = net.address;
          }
        });
      });
      
      // Replace the placeholder with the actual IP
      indexHtml = indexHtml.replace('YOUR_IP_ADDRESS', localIp);
      fs.writeFileSync(indexHtmlPath, indexHtml);
      logWithTimestamp('setup', `Updated index.html with IP: ${localIp}`);
    }
  }
} catch (error) {
  logWithTimestamp('setup', `Error updating IP address: ${error.message}`, true);
}

// Start the backend server
logWithTimestamp('backend', 'Starting backend server...');
const backend = spawn('npm', ['run', 'backend:dev'], {
  cwd: path.join(__dirname),
  shell: true,
  stdio: 'pipe'
});

// Handle backend output
backend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) logWithTimestamp('backend', line);
  });
});

backend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) logWithTimestamp('backend', line, true);
  });
});

// Handle backend process exit
backend.on('close', (code) => {
  if (code !== 0) {
    logWithTimestamp('backend', `Process exited with code ${code}`, true);
  } else {
    logWithTimestamp('backend', 'Process exited normally');
  }
});

// Setup frontend command based on mode
const frontendCommand = isProduction ? 'preview' : 'dev';

// Start the frontend development server
logWithTimestamp('frontend', `Starting frontend in ${isProduction ? 'production preview' : 'development'} mode...`);
const frontend = spawn('npm', ['run', frontendCommand], {
  cwd: path.join(__dirname),
  shell: true,
  stdio: 'pipe'
});

// Handle frontend output
frontend.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) logWithTimestamp('frontend', line);
  });
});

frontend.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) logWithTimestamp('frontend', line, true);
  });
});

// Handle frontend process exit
frontend.on('close', (code) => {
  if (code !== 0) {
    logWithTimestamp('frontend', `Process exited with code ${code}`, true);
  } else {
    logWithTimestamp('frontend', 'Process exited normally');
  }
  
  // Kill the backend when frontend exits
  backend.kill();
});

// Handle script termination
process.on('SIGINT', () => {
  logWithTimestamp('setup', 'Shutting down...');
  frontend.kill();
  backend.kill();
  process.exit();
});

logWithTimestamp('setup', 'Both frontend and backend servers are starting...');
logWithTimestamp('setup', 'Press Ctrl+C to stop both servers');

/**
 * Simple starter script for Care-Calendar that works with Node.js 10.x
 * This replaces the need for Vite which requires Node.js 14+
 */
const { spawn } = require('child_process');
const { networkInterfaces } = require('os');
const fs = require('fs');
const path = require('path');

// Get the device's IP address
function getIPAddress() {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return 'localhost'; // Fallback
}

// Start frontend and backend servers
function startServers() {
  console.log(`[${new Date().toLocaleTimeString()}] [setup] Starting Care Calendar...`);
  
  // Replace placeholder IP with actual IP address
  const ipAddress = getIPAddress();
  console.log(`[${new Date().toLocaleTimeString()}] [setup] Replacing placeholder IP with actual IP address...`);
  
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    indexContent = indexContent.replace('YOUR_IP_ADDRESS', ipAddress);
    fs.writeFileSync(indexPath, indexContent);
    console.log(`[${new Date().toLocaleTimeString()}] [setup] Updated index.html with IP: ${ipAddress}`);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] [setup] Error updating index.html:`, err);
  }
  
  // Start backend server
  console.log(`[${new Date().toLocaleTimeString()}] [backend] Starting backend server...`);
  const backend = spawn('npm', ['run', 'backend:dev'], {
    stdio: 'pipe',
    shell: true
  });
  
  // Start frontend server with static file server instead of Vite for Pi compatibility
  console.log(`[${new Date().toLocaleTimeString()}] [frontend] Starting frontend in development mode...`);
  const frontend = spawn('node', ['serve-static.js'], {
    stdio: 'pipe',
    shell: true
  });
  
  console.log(`[${new Date().toLocaleTimeString()}] [setup] Both frontend and backend servers are starting...`);
  console.log(`[${new Date().toLocaleTimeString()}] [setup] Press Ctrl+C to stop both servers`);
  
  // Handle backend output
  backend.stdout.on('data', (data) => {
    console.log(`[${new Date().toLocaleTimeString()}] [backend] ${data.toString().trim()}`);
  });
  
  backend.stderr.on('data', (data) => {
    console.log(`[${new Date().toLocaleTimeString()}] [backend] ${data.toString().trim()}`);
  });
  
  // Handle frontend output
  frontend.stdout.on('data', (data) => {
    console.log(`[${new Date().toLocaleTimeString()}] [frontend] ${data.toString().trim()}`);
  });
  
  frontend.stderr.on('data', (data) => {
    console.log(`[${new Date().toLocaleTimeString()}] [frontend] ${data.toString().trim()}`);
  });
  
  // Handle process exit
  process.on('SIGINT', () => {
    console.log(`[${new Date().toLocaleTimeString()}] [setup] Shutting down servers...`);
    backend.kill();
    frontend.kill();
    process.exit();
  });
  
  // Handle child process exit
  backend.on('close', (code) => {
    console.log(`[${new Date().toLocaleTimeString()}] [backend] Process exited with code ${code}`);
  });
  
  frontend.on('close', (code) => {
    console.log(`[${new Date().toLocaleTimeString()}] [frontend] Process exited with code ${code}`);
  });
}

// Start the servers
startServers();
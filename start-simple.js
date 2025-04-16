/**
 * Simple starter script for Care-Calendar that works with Node.js 10.x
 * This script starts both the frontend and backend servers
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
  
  // Update configuration
  try {
    const ipAddress = getIPAddress();
    const configPath = path.join(__dirname, 'config.json');
    
    // Create or update config.json
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    // Update API URL with current IP
    config.api = config.api || {};
    config.api.baseUrl = `http://${ipAddress}:3001/api`;
    
    // Set ports
    config.frontend = config.frontend || {};
    config.frontend.port = 8080;
    config.backend = config.backend || {};
    config.backend.port = 3001;
    
    // Write updated config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`[${new Date().toLocaleTimeString()}] [setup] Updated config with IP: ${ipAddress}`);
    
    // Update index.html
    const indexPath = path.join(__dirname, 'public', 'index.html');
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // If index.html contains window.__CONFIG__
      if (indexContent.includes('__CONFIG__')) {
        indexContent = indexContent.replace(
          /window\.__CONFIG__\s*=\s*{[^}]*}/,
          `window.__CONFIG__ = { API_BASE_URL: "${config.api.baseUrl}" }`
        );
        fs.writeFileSync(indexPath, indexContent);
        console.log(`[${new Date().toLocaleTimeString()}] [setup] Updated index.html with API URL: ${config.api.baseUrl}`);
      }
    }
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] [setup] Error updating configuration:`, err);
  }
  
  // Kill any existing node processes that might be using the ports
  try {
    console.log(`[${new Date().toLocaleTimeString()}] [setup] Checking for existing processes...`);
    const checkPorts = spawn('sh', ['-c', 'pgrep -f "node"'], { stdio: 'pipe', shell: true });
    
    checkPorts.stdout.on('data', (data) => {
      const pids = data.toString().trim().split('\n');
      const currentPid = process.pid.toString();
      
      pids.forEach(pid => {
        // Don't kill ourselves!
        if (pid && pid !== currentPid) {
          try {
            process.kill(parseInt(pid), 'SIGTERM');
            console.log(`[${new Date().toLocaleTimeString()}] [setup] Terminated process ${pid}`);
          } catch (err) {
            // Ignore errors (likely process doesn't exist or we don't have permission)
          }
        }
      });
    });
  } catch (err) {
    console.log(`[${new Date().toLocaleTimeString()}] [setup] Error checking for existing processes:`, err);
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
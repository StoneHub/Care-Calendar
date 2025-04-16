/**
 * Simple HTTP server for serving the frontend on Node.js 10
 * This replaces Vite which requires Node.js 14+
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { networkInterfaces } = require('os');

// Get local IP address
function getLocalIpAddress() {
  const nets = networkInterfaces();
  let localIp = 'localhost';
  
  Object.keys(nets).forEach((name) => {
    nets[name].forEach((net) => {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
      }
    });
  });
  
  return localIp;
}

// Simple MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Parse URL
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './public/index.html';
  } else if (!filePath.includes('.')) {
    // For any path without a file extension, serve the index.html (for SPA routing)
    filePath = './public/index.html';
  } else {
    // Prepend 'public' to the path for static files
    filePath = path.join('./public', req.url);
  }
  
  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Read file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found - serve index.html for SPA routing
        fs.readFile('./public/index.html', (err, content) => {
          if (err) {
            res.writeHead(500);
            res.end('Error loading index.html');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      // Success - serve the file
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Set port and start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  const localIp = getLocalIpAddress();
  console.log(`Server running at http://${localIp}:${PORT}/`);
  console.log(`For local access: http://localhost:${PORT}/`);
  console.log(`For network access: http://${localIp}:${PORT}/`);
  
  // Update index.html with the IP address
  try {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('YOUR_IP_ADDRESS')) {
      indexContent = indexContent.replace('YOUR_IP_ADDRESS', localIp);
      fs.writeFileSync(indexPath, indexContent);
      console.log(`Updated index.html with IP address: ${localIp}`);
    } else {
      console.log('index.html already configured with IP address');
    }
  } catch (err) {
    console.error('Error updating index.html:', err);
  }
});
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../../db');

// Create db directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  console.log('Creating db directory...');
  fs.mkdirSync(dbDir);
  console.log('db directory created');
}

console.log('Database directories initialized');
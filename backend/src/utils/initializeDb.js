const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const dbDir = path.join(__dirname, '../../db');

// Create db directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  logger.info('Creating db directory...');
  fs.mkdirSync(dbDir);
  logger.info('db directory created');
}

logger.info('Database directories initialized');
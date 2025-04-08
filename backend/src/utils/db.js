const knex = require('knex');
const config = require('../config/database');
const logger = require('./logger');
const path = require('path');
const fs = require('fs');

// Initialize knex connection
const environment = process.env.NODE_ENV || 'development';

// On Windows, we'll always use sqlite3 as better-sqlite3 has compatibility issues
const isWindows = process.platform === 'win32' || 
                  (process.env.OS && process.env.OS.includes('Windows'));

// Configure database based on environment
let dbConfig = {
  ...config[environment],
  client: isWindows ? 'sqlite3' : config[environment].client,
  useNullAsDefault: true // This is important for SQLite
};

// Ensure db directory exists
const dbDir = path.resolve(__dirname, '../../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  logger.info(`Created database directory: ${dbDir}`);
}

logger.info(`Database initialization`, {
  platform: process.platform,
  client: dbConfig.client,
  connection: typeof dbConfig.connection === 'object' ? dbConfig.connection.filename : dbConfig.connection
});

// Connect to the database
let knexInstance;
try {
  // Connect with configured client
  knexInstance = knex(dbConfig);
  
  // Create a simple connection test that logs but doesn't reject
  knexInstance.raw('SELECT 1')
    .then(() => {
      logger.info('Database connection test succeeded');
    })
    .catch(err => {
      logger.warn('Database connection test failed, will attempt to continue', { error: err.message });
      // We'll still attempt to continue
    });
} catch (error) {
  logger.error('Failed to initialize database', { error: error.message, stack: error.stack });
  
  // Last resort fallback - use in-memory SQLite
  try {
    logger.info('Attempting emergency fallback to in-memory SQLite');
    knexInstance = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true
    });
    logger.warn('Using in-memory SQLite database - data will NOT be persisted!');
  } catch (fallbackError) {
    logger.error('All database connection attempts failed', { error: fallbackError.message, stack: fallbackError.stack });
    throw new Error('Could not establish database connection: ' + error.message);
  }
}

// Add a watch function to create a log entry for all database queries
if (process.env.NODE_ENV !== 'production') {
  knexInstance.on('query', (query) => {
    logger.debug('Database query', { 
      sql: query.sql,
      bindings: query.bindings 
    });
  });
}

module.exports = knexInstance;
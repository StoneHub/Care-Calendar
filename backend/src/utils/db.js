const knex = require('knex');
const config = require('../config/database');

// Initialize knex connection
const environment = process.env.NODE_ENV || 'development';

// On Windows, we'll always use sqlite3 as better-sqlite3 has compatibility issues
const isWindows = process.platform === 'win32' || 
                  (process.env.OS && process.env.OS.includes('Windows'));

// Configure database based on environment
let dbConfig = {
  ...config[environment],
  client: isWindows ? 'sqlite3' : config[environment].client
};

console.log(`Running on platform: ${process.platform}`);
console.log(`Using database client: ${dbConfig.client}`);

// Connect to the database
let db;
try {
  // Connect with configured client
  db = knex(dbConfig);
  
  // Create a simple connection test that logs but doesn't reject
  db.raw('SELECT 1')
    .then(() => {
      console.log('Database connection test succeeded');
    })
    .catch(err => {
      console.warn('Database connection test failed, will attempt to continue:', err.message);
      // We'll still attempt to continue
    });
} catch (error) {
  console.error('Failed to initialize database:', error.message);
  
  // Last resort fallback - use in-memory SQLite
  try {
    console.log('Attempting emergency fallback to in-memory SQLite...');
    db = knex({
      client: 'sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true
    });
    console.warn('Using in-memory SQLite database - data will NOT be persisted!');
  } catch (fallbackError) {
    console.error('All database connection attempts failed');
    // Create a dummy db object that will throw descriptive errors when used
    db = {
      query: () => { throw new Error('Database connection failed') },
      select: () => { throw new Error('Database connection failed') },
      insert: () => { throw new Error('Database connection failed') },
      update: () => { throw new Error('Database connection failed') },
      delete: () => { throw new Error('Database connection failed') },
    };
  }
}

module.exports = db;
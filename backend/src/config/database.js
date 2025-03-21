const path = require('path');

// Database configuration
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, '../../db/care_calendar.sqlite3')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, '../../db/migrations')
    },
    seeds: {
      directory: path.resolve(__dirname, '../../db/seeds')
    },
    // Enable foreign key constraints
    pool: {
      afterCreate: (conn, cb) => {
        conn.run('PRAGMA foreign_keys = ON', cb);
      }
    }
  },
  // Add production and test configs as needed
};
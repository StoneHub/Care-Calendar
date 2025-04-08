/**
 * Database Reset and Initialization Utility
 * 
 * This script provides a way to reset the database, recreate schema, and seed with data.
 * Usage: node resolveDb.js --reset
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Import database setup utilities but don't run them yet
const db = require('./db');
const setupDb = require('./setupDb');
const seedDb = require('./seedDb');

// Get the DB file path
const dbConfig = require('../config/database');
const environment = process.env.NODE_ENV || 'development';
const dbFilePath = dbConfig[environment].connection.filename;

// Process command-line arguments
const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

async function main() {
  if (shouldReset) {
    logger.info('Database reset requested');
    
    // Check if database file exists
    if (fs.existsSync(dbFilePath)) {
      try {
        // Close any existing connections
        await db.destroy();
        
        // Delete the database file
        fs.unlinkSync(dbFilePath);
        logger.info(`Deleted database file: ${dbFilePath}`);
      } catch (error) {
        logger.error('Error deleting database file', { error: error.message });
        process.exit(1);
      }
    } else {
      logger.info('No database file to delete');
    }
  }
  
  // Run database setup
  try {
    logger.info('Starting database setup...');
    
    // Manually run the setup and seed processes
    await setupDb.setupDatabase();
    
    // Only seed if reset was requested or no data exists
    const hasSomeData = await db('team_members').count('* as count').first()
      .then(result => result.count > 0)
      .catch(() => false);
    
    if (shouldReset || !hasSomeData) {
      logger.info('Seeding database with initial data...');
      await seedDb.seedDatabase();
    } else {
      logger.info('Database already has data, skipping seed');
    }
    
    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Error initializing database', { error: error.message, stack: error.stack });
  } finally {
    // Close the database connection
    await db.destroy();
  }
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error in database resolution', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = { main };
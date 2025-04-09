/**
 * Setup script for history table
 * Run this script to create the history_records table
 */
const db = require('../src/utils/db');
const logger = require('../src/utils/logger');

async function setupHistoryTable() {
  try {
    logger.info('Checking if history_records table exists');
    
    // Check if table exists
    const tableExists = await db.schema.hasTable('history_records');
    
    if (tableExists) {
      logger.info('history_records table already exists');
      return;
    }
    
    logger.info('Creating history_records table');
    
    // Create the table
    await db.schema.createTable('history_records', table => {
      table.increments('id').primary();
      table.timestamp('timestamp').defaultTo(db.fn.now());
      table.string('action_type').notNullable();
      table.string('entity_type').notNullable();
      table.integer('entity_id').notNullable();
      table.integer('caregiver_id').nullable();
      table.text('description').notNullable();
      table.integer('week_id').nullable();
      table.json('details').nullable();
    });
    
    logger.info('history_records table created successfully');
  } catch (error) {
    logger.error('Failed to setup history_records table', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupHistoryTable()
    .then(() => {
      console.log('History table setup complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('History table setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupHistoryTable;
/**
 * Setup script for the history_records table
 */
const db = require('../src/utils/db');
const logger = require('../src/utils/logger');

async function setupHistoryTable() {
  try {
    logger.info('Setting up history_records table...');
    
    // Check if table already exists
    const tableExists = await db.schema.hasTable('history_records');
    
    if (tableExists) {
      logger.info('history_records table already exists');
      return;
    }
    
    // Create the history_records table
    await db.schema.createTable('history_records', (table) => {
      table.increments('id').primary();
      table.string('action_type').notNullable();
      table.string('entity_type').notNullable();
      table.integer('entity_id').notNullable();
      table.string('description').notNullable();
      table.integer('week_id').nullable();
      table.integer('caregiver_id').nullable();
      table.text('details').nullable();
      table.timestamp('timestamp').defaultTo(db.fn.now());
    });
    
    logger.info('history_records table created successfully');
  } catch (error) {
    logger.error('Failed to set up history_records table', {
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
      logger.info('History table setup completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('History table setup failed', { error: error.message });
      process.exit(1);
    });
}

// Export for use in other modules
module.exports = { setupHistoryTable };

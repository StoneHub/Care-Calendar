/**
 * Setup script for the unavailability table
 */

const knex = require('knex');
const config = require('../knexfile');
const logger = require('../src/utils/logger');

async function setupUnavailabilityTable() {
  const db = knex(config.development);

  try {
    logger.info('Checking if unavailability table exists');
    
    // Check if the table exists
    const exists = await db.schema.hasTable('unavailability');
    
    if (exists) {
      logger.info('Unavailability table already exists');
    } else {
      logger.info('Creating unavailability table');
      
      // Create the table
      await db.schema.createTable('unavailability', table => {
        table.increments('id');
        table.integer('caregiver_id').notNullable();
        table.date('start_date').notNullable();
        table.date('end_date').notNullable();
        table.text('reason');
        table.boolean('is_recurring').defaultTo(false);
        table.date('recurring_end_date');
        table.timestamps(true, true);
      });
      
      logger.info('Unavailability table created successfully');
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to setup unavailability table', { 
      error: error.message,
      stack: error.stack 
    });
    throw error;
  } finally {
    await db.destroy();
  }
}

// Allow this to be run directly or imported
if (require.main === module) {
  setupUnavailabilityTable()
    .then(() => {
      console.log('Unavailability table setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Unavailability table setup failed:', error);
      process.exit(1);
    });
} else {
  module.exports = setupUnavailabilityTable;
}

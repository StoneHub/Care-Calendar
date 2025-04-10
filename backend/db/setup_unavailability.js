/**
 * Setup script for the unavailability table
 */
const db = require('../src/utils/db');
const logger = require('../src/utils/logger');

async function setupUnavailabilityTable() {
  try {
    logger.info('Setting up unavailability table...');
    
    // Check if table already exists
    const tableExists = await db.schema.hasTable('unavailability');
    
    if (tableExists) {
      logger.info('unavailability table already exists');
      return;
    }
    
    // Create the unavailability table
    await db.schema.createTable('unavailability', (table) => {
      table.increments('id').primary();
      table.integer('caregiver_id').notNullable().references('id').inTable('team_members');
      table.dateTime('start_date').notNullable();
      table.dateTime('end_date').notNullable();
      table.string('reason').nullable();
      table.boolean('is_recurring').defaultTo(false);
      table.dateTime('recurring_end_date').nullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
      table.timestamp('updated_at').defaultTo(db.fn.now());
    });
    
    logger.info('unavailability table created successfully');
  } catch (error) {
    logger.error('Failed to set up unavailability table', {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupUnavailabilityTable()
    .then(() => {
      logger.info('Unavailability table setup completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Unavailability table setup failed', { error: error.message });
      process.exit(1);
    });
}

// Export for use in other modules
module.exports = { setupUnavailabilityTable };

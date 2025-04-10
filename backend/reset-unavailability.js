/**
 * Simple script to force creation of the unavailability table
 */
const knex = require('knex');
const config = require('./knexfile');
const db = knex(config.development);

async function resetUnavailabilityTable() {
  console.log('Starting unavailability table reset...');
  
  try {
    // Check if table exists
    const exists = await db.schema.hasTable('unavailability');
    console.log(`Unavailability table exists: ${exists}`);
    
    // Drop table if it exists
    if (exists) {
      console.log('Dropping existing unavailability table...');
      await db.schema.dropTable('unavailability');
      console.log('Table dropped successfully');
    }
    
    // Create the table
    console.log('Creating unavailability table...');
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
    
    console.log('Table created successfully');
    
    // Insert a test record
    console.log('Adding test record...');
    await db('unavailability').insert({
      caregiver_id: 1,
      start_date: '2025-04-15',
      end_date: '2025-04-17',
      reason: 'Test unavailability',
      is_recurring: false
    });
    
    console.log('Test record added');
    console.log('Reset completed successfully');
  } catch (error) {
    console.error('Error during reset:', error);
  } finally {
    // Close database connection
    await db.destroy();
  }
}

resetUnavailabilityTable();

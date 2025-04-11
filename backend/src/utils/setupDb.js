const db = require('./db');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Run the initializer first
require('./initializeDb');

async function setupDatabase() {
  logger.info('Setting up database...');

  try {
    // Create team_members table if it doesn't exist
    const hasTeamMembers = await db.schema.hasTable('team_members');
    if (!hasTeamMembers) {
      await db.schema.createTable('team_members', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('role').notNullable();
        table.string('availability').notNullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      }).then(() => logger.info('Created team_members table'));
    } else {
      logger.info('team_members table already exists');
    }

    // Create weeks table if it doesn't exist
    const hasWeeks = await db.schema.hasTable('weeks');
    if (!hasWeeks) {
      await db.schema.createTable('weeks', table => {
        table.increments('id').primary();
        table.string('start_date').notNullable().unique();
        table.string('end_date').notNullable();
        table.boolean('is_published').defaultTo(false);
        table.text('notes');
        table.timestamps(true, true);
      }).then(() => logger.info('Created weeks table'));
    } else {
      logger.info('weeks table already exists');
    }

    // Create shifts table if it doesn't exist
    const hasShifts = await db.schema.hasTable('shifts');
    if (!hasShifts) {
      await db.schema.createTable('shifts', table => {
        table.increments('id').primary();
        table.integer('week_id').notNullable().references('id').inTable('weeks').onDelete('CASCADE');
        table.string('day_of_week').notNullable();
        table.integer('caregiver_id').notNullable().references('id').inTable('team_members');
        table.string('start_time').notNullable();
        table.string('end_time').notNullable();
        table.string('status').defaultTo('confirmed');
        // Add recurring columns
        table.boolean('is_recurring').defaultTo(false);
        table.date('recurring_end_date').nullable();
        table.integer('parent_shift_id').nullable().references('id').inTable('shifts');
        table.timestamps(true, true);
      }).then(() => logger.info('Created shifts table with recurring columns'));
    } else {
      logger.info('shifts table already exists');
    }

    // Create notifications table if it doesn't exist
    const hasNotifications = await db.schema.hasTable('notifications');
    if (!hasNotifications) {
      await db.schema.createTable('notifications', table => {
        table.increments('id').primary();
        table.string('type').notNullable();
        table.integer('from_caregiver_id').notNullable().references('id').inTable('team_members');
        table.integer('affected_shift_id').references('id').inTable('shifts');
        table.integer('week_id').notNullable().references('id').inTable('weeks');
        table.text('message').notNullable();
        table.string('date').notNullable();
        table.string('time').notNullable();
        table.string('status').defaultTo('pending');
        table.timestamps(true, true);
      }).then(() => logger.info('Created notifications table'));
    } else {
      logger.info('notifications table already exists');
    }

    // Create payroll_records table if it doesn't exist
    const hasPayrollRecords = await db.schema.hasTable('payroll_records');
    if (!hasPayrollRecords) {
      await db.schema.createTable('payroll_records', table => {
        table.increments('id').primary();
        table.integer('caregiver_id').notNullable().references('id').inTable('team_members');
        table.integer('week_id').notNullable().references('id').inTable('weeks');
        table.float('total_hours').notNullable();
        table.string('date_calculated').notNullable();
        table.text('notes');
        table.timestamps(true, true);
      }).then(() => logger.info('Created payroll_records table'));
    } else {
      logger.info('payroll_records table already exists');
    }

    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Error setting up database', { error: error.message, stack: error.stack });
    process.exit(1);
  } finally {
    // Close the database connection
    db.destroy();
  }
}

// Only run setup if this file is executed directly
if (require.main === module) {
  setupDatabase().catch(error => {
    logger.error('Unhandled error in database setup', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

// Export the function to be used in other modules
module.exports = { setupDatabase };

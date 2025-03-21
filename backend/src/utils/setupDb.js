const db = require('./db');
const fs = require('fs');
const path = require('path');

// Run the initializer first
require('./initializeDb');

async function setupDatabase() {
  console.log('Setting up database...');

  try {
    // Create team_members table if it doesn't exist
    const hasTeamMembers = await db.schema.hasTable('team_members');
    if (!hasTeamMembers) {
      await db.schema.createTable('team_members', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('role').notNullable();
        table.string('availability').notNullable();
        table.integer('hours_per_week').notNullable();
        table.timestamps(true, true);
      }).then(() => console.log('Created team_members table'));
    } else {
      console.log('team_members table already exists');
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
      }).then(() => console.log('Created weeks table'));
    } else {
      console.log('weeks table already exists');
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
        table.timestamps(true, true);
      }).then(() => console.log('Created shifts table'));
    } else {
      console.log('shifts table already exists');
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
      }).then(() => console.log('Created notifications table'));
    } else {
      console.log('notifications table already exists');
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
      }).then(() => console.log('Created payroll_records table'));
    } else {
      console.log('payroll_records table already exists');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    db.destroy();
  }
}

// Run the setup
setupDatabase();
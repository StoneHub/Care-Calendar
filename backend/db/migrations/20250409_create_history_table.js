/**
 * Migration to create history_records table
 */
exports.up = function(knex) {
  return knex.schema.createTable('history_records', table => {
    table.increments('id').primary();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.string('action_type').notNullable();
    table.string('entity_type').notNullable();
    table.integer('entity_id').notNullable();
    table.integer('caregiver_id').nullable();
    table.text('description').notNullable();
    table.integer('week_id').nullable();
    table.json('details').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('history_records');
};
exports.up = function(knex) {
  return knex.schema.hasTable('unavailability').then(exists => {
    if (!exists) {
      return knex.schema.createTable('unavailability', table => {
        table.increments('id');
        table.integer('caregiver_id').notNullable().references('id').inTable('team_members');
        table.date('start_date').notNullable();
        table.date('end_date').notNullable();
        table.text('reason');
        table.boolean('is_recurring').defaultTo(false);
        table.date('recurring_end_date');
        table.timestamps(true, true);
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('unavailability');
};

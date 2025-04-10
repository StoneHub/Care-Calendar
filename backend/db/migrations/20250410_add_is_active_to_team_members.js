/**
 * Migration to add is_active column to team_members table
 * This supports the soft-delete pattern for team members
 */
exports.up = function(knex) {
  return knex.schema.table('team_members', table => {
    table.boolean('is_active').notNullable().defaultTo(true);
  });
};

exports.down = function(knex) {
  return knex.schema.table('team_members', table => {
    table.dropColumn('is_active');
  });
};
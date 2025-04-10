/**
 * Migration to add recurring fields to shifts table
 */
exports.up = function(knex) {
  return knex.schema.hasTable('shifts').then(exists => {
    if (!exists) {
      return Promise.resolve();
    }
    
    return knex.schema.alterTable('shifts', table => {
      // Check if columns already exist before adding them
      return knex.schema.hasColumn('shifts', 'is_recurring').then(hasIsRecurring => {
        if (!hasIsRecurring) {
          table.boolean('is_recurring').defaultTo(false);
        }
        
        return knex.schema.hasColumn('shifts', 'recurring_end_date').then(hasEndDate => {
          if (!hasEndDate) {
            table.date('recurring_end_date').nullable();
          }
          
          return knex.schema.hasColumn('shifts', 'parent_shift_id').then(hasParentId => {
            if (!hasParentId) {
              table.integer('parent_shift_id').nullable().references('id').inTable('shifts');
            }
          });
        });
      });
    });
  });
};

exports.down = function(knex) {
  return knex.schema.hasTable('shifts').then(exists => {
    if (!exists) {
      return Promise.resolve();
    }
    
    return knex.schema.alterTable('shifts', table => {
      table.dropColumn('is_recurring');
      table.dropColumn('recurring_end_date');
      table.dropColumn('parent_shift_id');
    });
  });
};

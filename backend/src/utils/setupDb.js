const lowdbUtil = require('./lowdbUtil');
const logger = require('./logger');

// Run the initializer first (still ensures db directory exists)
require('./initializeDb');

function setupDatabase() {
  logger.info('Setting up LowDB JSON database...');

  // Seed default admin user if team_members is empty
  const members = lowdbUtil.getAll('team_members');
  if (!members || members.length === 0) {
    logger.info('Seeding default admin user...');
    lowdbUtil.insert('team_members', {
      name: 'Admin User',
      role: 'Admin',
      availability: 'All days',
      is_active: true
    });
  }

  // Optionally seed other tables here if needed
  logger.info('LowDB setup/check complete.');
}

// Only run setup if this file is executed directly
if (require.main === module) {
  try {
    setupDatabase();
  } catch (error) {
    logger.error('Unhandled error in LowDB setup', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Export the function to be used in other modules
module.exports = { setupDatabase };

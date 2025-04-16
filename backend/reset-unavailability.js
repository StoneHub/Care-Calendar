/**
 * Script to reset the unavailability table in LowDB
 */
const lowdbUtil = require('./src/utils/lowdbUtil');
const logger = require('./src/utils/logger');

// Empty the unavailability collection
logger.info('Resetting unavailability data in LowDB...');
lowdbUtil.resetCollection('unavailability');
logger.info('Unavailability data reset complete');

/**
 * Transaction utility for ensuring data integrity
 */
const db = require('./db');
const logger = require('./logger');

/**
 * Execute database operations within a transaction
 * If any operation fails, all changes are rolled back
 *
 * @param {Function} operations - Function that receives transaction object and performs operations
 * @returns {Promise<any>} - Result from the operations
 */
async function withTransaction(operations) {
  // Start transaction
  const trx = await db.transaction();
  
  try {
    // Execute operations with transaction object
    const result = await operations(trx);
    
    // If we got here, all operations succeeded, so commit the transaction
    await trx.commit();
    
    return result;
  } catch (error) {
    // If any operation failed, roll back all changes
    await trx.rollback();
    
    logger.error('Transaction failed, rolled back changes', {
      error: error.message,
      stack: error.stack
    });
    
    // Re-throw the error for the caller to handle
    throw error;
  }
}

module.exports = { withTransaction };
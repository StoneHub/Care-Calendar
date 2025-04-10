/**
 * History utility for recording user actions and system events
 */
const db = require('./db');
const logger = require('./logger');

/**
 * Record an action in the history table
 *
 * @param {string} actionType - Type of action (create, update, delete, etc.)
 * @param {string} entityType - Type of entity (shift, week, team_member, etc.)
 * @param {number} entityId - ID of the affected entity
 * @param {string} description - Human-readable description of the action
 * @param {Object} options - Additional options
 * @param {number} [options.weekId] - Related week ID if applicable
 * @param {number} [options.caregiverId] - ID of the caregiver who performed the action
 * @param {Object} [options.details] - Additional details to store as JSON
 * @returns {Promise<number|null>} - ID of the created history record or null on failure
 */
async function recordHistory(actionType, entityType, entityId, description, options = {}, trx = null) {
  try {
    logger.debug('Recording history', {
      actionType,
      entityType,
      entityId,
      description
    });
    
    const { weekId, caregiverId, details } = options;
    
    // Use the passed transaction if available, otherwise use the default db connection
    const dbConnection = trx || db;
    
    const [id] = await dbConnection('history_records').insert({
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      description,
      week_id: weekId || null,
      caregiver_id: caregiverId || null,
      details: details ? JSON.stringify(details) : null
    }).returning('id');
    
    return id;
  } catch (error) {
    logger.error('Failed to record history', {
      error: error.message,
      stack: error.stack,
      actionType,
      entityType,
      entityId
    });
    
    // Don't throw - history recording should not break core functionality
    return null;
  }
}

/**
 * Get formatted history records with sorting and filtering
 *
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.actionType] - Filter by action type
 * @param {string} [filters.entityType] - Filter by entity type
 * @param {number} [filters.weekId] - Filter by week ID
 * @param {number} [filters.limit=50] - Maximum number of records to return
 * @param {number} [filters.offset=0] - Offset for pagination
 * @returns {Promise<Array>} - Formatted history records
 */
async function getHistoryRecords(filters = {}) {
  try {
    const { 
      actionType, 
      entityType, 
      weekId, 
      limit = 50, 
      offset = 0 
    } = filters;
    
    // Build base query
    let query = db('history_records')
      .leftJoin('team_members', 'history_records.caregiver_id', 'team_members.id')
      .select(
        'history_records.*',
        'team_members.name as caregiver_name'
      )
      .orderBy('history_records.timestamp', 'desc')
      .limit(limit)
      .offset(offset);
    
    // Apply filters
    if (actionType) query = query.where('action_type', actionType);
    if (entityType) query = query.where('entity_type', entityType);
    if (weekId) query = query.where('week_id', weekId);
    
    return query;
  } catch (error) {
    logger.error('Failed to get history records', {
      error: error.message,
      stack: error.stack,
      filters
    });
    throw error;
  }
}

module.exports = {
  recordHistory,
  getHistoryRecords
};
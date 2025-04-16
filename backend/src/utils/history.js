/**
 * History utility for recording user actions and system events
 */
const lowdbUtil = require('./lowdbUtil');
const logger = require('./logger');

/**
 * Record an action in the history table (LowDB version)
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
async function recordHistory(actionType, entityType, entityId, description, options = {}) {
  try {
    logger.debug('Recording history', {
      actionType,
      entityType,
      entityId,
      description
    });
    const { weekId, caregiverId, details } = options;
    const timestamp = new Date().toISOString();
    const record = lowdbUtil.insert('history', {
      timestamp,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      description,
      week_id: weekId || null,
      caregiver_id: caregiverId || null,
      details: details ? JSON.stringify(details) : null
    });
    return record.id;
  } catch (error) {
    logger.error('Failed to record history', {
      error: error.message,
      stack: error.stack,
      actionType,
      entityType,
      entityId
    });
    return null;
  }
}

/**
 * Get formatted history records with sorting and filtering (LowDB version)
 *
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.actionType] - Filter by action type
 * @param {string} [filters.entityType] - Filter by entity type
 * @param {number} [filters.weekId] - Filter by week ID
 * @param {number} [filters.entityId] - Filter by entity ID
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
      entityId,
      limit = 50,
      offset = 0
    } = filters;
    // Get all history records
    let records = lowdbUtil.getAll('history');
    // Apply filters
    if (actionType) records = records.filter(r => r.action_type === actionType);
    if (entityType) records = records.filter(r => r.entity_type === entityType);
    if (weekId) records = records.filter(r => r.week_id == weekId);
    if (entityId) records = records.filter(r => r.entity_id == entityId);
    // Sort by timestamp descending
    records = records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    // Pagination
    records = records.slice(offset, offset + limit);
    // Attach caregiver_name
    const caregivers = lowdbUtil.getAll('team_members');
    records = records.map(r => {
      const caregiver = caregivers.find(c => c.id === r.caregiver_id);
      return {
        ...r,
        caregiver_name: caregiver ? caregiver.name : undefined
      };
    });
    return records;
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
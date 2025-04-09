/**
 * History Controller
 * Manages retrieval of history records
 */
const { getHistoryRecords } = require('../utils/history');
const logger = require('../utils/logger');

/**
 * Get all history records with filtering options
 */
exports.getAllHistory = async (req, res) => {
  try {
    const { 
      action_type,
      entity_type,
      week_id,
      limit,
      offset
    } = req.query;
    
    logger.debug('Getting history records', { 
      filters: req.query
    });
    
    // Convert string parameters to appropriate types
    const filters = {
      actionType: action_type,
      entityType: entity_type,
      weekId: week_id ? parseInt(week_id, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    };
    
    const records = await getHistoryRecords(filters);
    
    res.status(200).json(records);
  } catch (error) {
    logger.error('Error fetching history records', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ error: 'Failed to fetch history records' });
  }
};

/**
 * Get history records for a specific entity
 */
exports.getEntityHistory = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit, offset } = req.query;
    
    logger.debug('Getting entity history', { 
      entityType,
      entityId,
      limit,
      offset
    });
    
    const filters = {
      entityType,
      entityId: parseInt(entityId, 10),
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    };
    
    const records = await getHistoryRecords(filters);
    
    res.status(200).json(records);
  } catch (error) {
    logger.error('Error fetching entity history', {
      error: error.message,
      stack: error.stack,
      params: req.params
    });
    
    res.status(500).json({ error: 'Failed to fetch entity history' });
  }
};

/**
 * Get history records for a specific week
 */
exports.getWeekHistory = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { limit, offset } = req.query;
    
    logger.debug('Getting week history', { 
      weekId,
      limit,
      offset 
    });
    
    const filters = {
      weekId: parseInt(weekId, 10),
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    };
    
    const records = await getHistoryRecords(filters);
    
    res.status(200).json(records);
  } catch (error) {
    logger.error('Error fetching week history', {
      error: error.message,
      stack: error.stack,
      weekId: req.params.weekId
    });
    
    res.status(500).json({ error: 'Failed to fetch week history' });
  }
};
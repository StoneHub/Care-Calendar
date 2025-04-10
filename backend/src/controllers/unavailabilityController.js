const db = require('../utils/db');
const logger = require('../utils/logger');

// Get all unavailability records
exports.getAllUnavailability = async (req, res) => {
  try {
    // First check if the table exists
    const tableExists = await db.schema.hasTable('unavailability');
    
    if (!tableExists) {
      logger.error('Unavailability table does not exist');
      return res.status(500).json({ error: 'Unavailability feature not initialized' });
    }
    
    const records = await db('unavailability')
      .join('team_members', 'team_members.id', 'unavailability.caregiver_id')
      .select('unavailability.*', 'team_members.name as caregiver_name');
    
    res.json(records);
  } catch (error) {
    logger.error('Failed to get unavailability records', { error });
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

// Get unavailability for a specific caregiver
exports.getCaregiverUnavailability = async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if the table exists
    const tableExists = await db.schema.hasTable('unavailability');
    
    if (!tableExists) {
      logger.error('Unavailability table does not exist');
      return res.status(500).json({ error: 'Unavailability feature not initialized' });
    }
    
    const records = await db('unavailability')
      .join('team_members', 'team_members.id', 'unavailability.caregiver_id')
      .select('unavailability.*', 'team_members.name as caregiver_name')
      .where('caregiver_id', id);
    
    res.json(records);
  } catch (error) {
    logger.error(`Failed to get unavailability for caregiver ${id}`, { error });
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

// Create a new unavailability record
exports.createUnavailability = async (req, res) => {
  try {
    // First check if the table exists
    const tableExists = await db.schema.hasTable('unavailability');
    
    if (!tableExists) {
      logger.error('Unavailability table does not exist');
      return res.status(500).json({ error: 'Unavailability feature not initialized' });
    }
    
    const { caregiver_id, start_date, end_date, reason, is_recurring, recurring_end_date } = req.body;
    
    // Validate required fields
    if (!caregiver_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create new record
    const [id] = await db('unavailability').insert({
      caregiver_id,
      start_date,
      end_date,
      reason,
      is_recurring: is_recurring || false,
      recurring_end_date: recurring_end_date || null
    });
    
    // Return the newly created record
    const newRecord = await db('unavailability')
      .join('team_members', 'team_members.id', 'unavailability.caregiver_id')
      .select('unavailability.*', 'team_members.name as caregiver_name')
      .where('unavailability.id', id)
      .first();
    
    res.status(201).json(newRecord);
  } catch (error) {
    logger.error('Failed to create unavailability record', { error });
    res.status(500).json({ error: 'Failed to create record' });
  }
};

// Update an existing unavailability record
exports.updateUnavailability = async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if the table exists
    const tableExists = await db.schema.hasTable('unavailability');
    
    if (!tableExists) {
      logger.error('Unavailability table does not exist');
      return res.status(500).json({ error: 'Unavailability feature not initialized' });
    }
    
    const { caregiver_id, start_date, end_date, reason, is_recurring, recurring_end_date } = req.body;
    
    // Validate required fields
    if (!caregiver_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update the record
    await db('unavailability')
      .where('id', id)
      .update({
        caregiver_id,
        start_date,
        end_date,
        reason,
        is_recurring: is_recurring || false,
        recurring_end_date: recurring_end_date || null
      });
    
    // Return the updated record
    const updatedRecord = await db('unavailability')
      .join('team_members', 'team_members.id', 'unavailability.caregiver_id')
      .select('unavailability.*', 'team_members.name as caregiver_name')
      .where('unavailability.id', id)
      .first();
    
    if (!updatedRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    res.json(updatedRecord);
  } catch (error) {
    logger.error(`Failed to update unavailability record ${id}`, { error });
    res.status(500).json({ error: 'Failed to update record' });
  }
};

// Delete an unavailability record
exports.deleteUnavailability = async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if the table exists
    const tableExists = await db.schema.hasTable('unavailability');
    
    if (!tableExists) {
      logger.error('Unavailability table does not exist');
      return res.status(500).json({ error: 'Unavailability feature not initialized' });
    }
    
    // Check if record exists
    const record = await db('unavailability').where('id', id).first();
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Delete the record
    await db('unavailability').where('id', id).del();
    
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    logger.error(`Failed to delete unavailability record ${id}`, { error });
    res.status(500).json({ error: 'Failed to delete record' });
  }
};

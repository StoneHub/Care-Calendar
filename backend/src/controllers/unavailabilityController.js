const lowdbUtil = require('../utils/lowdbUtil');
const logger = require('../utils/logger');

// Helper to enrich unavailability record with caregiver name
function enrichUnavailability(record) {
  const caregiver = lowdbUtil.findById('team_members', record.caregiver_id);
  return {
    ...record,
    caregiver_name: caregiver ? caregiver.name : undefined
  };
}

// Get all unavailability records
exports.getAllUnavailability = async (req, res) => {
  try {
    let records = lowdbUtil.getAll('unavailability');
    records = records.map(enrichUnavailability);
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
    let records = lowdbUtil.find('unavailability', { caregiver_id: Number(id) });
    records = records.map(enrichUnavailability);
    res.json(records);
  } catch (error) {
    logger.error(`Failed to get unavailability for caregiver ${id}`, { error });
    res.status(500).json({ error: 'Failed to fetch records' });
  }
};

// Create a new unavailability record
exports.createUnavailability = async (req, res) => {
  try {
    const { caregiver_id, start_date, end_date, reason, is_recurring, recurring_end_date } = req.body;
    if (!caregiver_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newRecord = lowdbUtil.insert('unavailability', {
      caregiver_id,
      start_date,
      end_date,
      reason,
      is_recurring: !!is_recurring,
      recurring_end_date: recurring_end_date || null
    });
    res.status(201).json(enrichUnavailability(newRecord));
  } catch (error) {
    logger.error('Failed to create unavailability record', { error });
    res.status(500).json({ error: 'Failed to create record' });
  }
};

// Update an existing unavailability record
exports.updateUnavailability = async (req, res) => {
  const { id } = req.params;
  try {
    const { caregiver_id, start_date, end_date, reason, is_recurring, recurring_end_date } = req.body;
    if (!caregiver_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const updatedRecord = lowdbUtil.update('unavailability', id, {
      caregiver_id,
      start_date,
      end_date,
      reason,
      is_recurring: !!is_recurring,
      recurring_end_date: recurring_end_date || null
    });
    if (!updatedRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json(enrichUnavailability(updatedRecord));
  } catch (error) {
    logger.error(`Failed to update unavailability record ${id}`, { error });
    res.status(500).json({ error: 'Failed to update record' });
  }
};

// Delete an unavailability record
exports.deleteUnavailability = async (req, res) => {
  const { id } = req.params;
  try {
    const record = lowdbUtil.findById('unavailability', id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }
    lowdbUtil.remove('unavailability', id);
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    logger.error(`Failed to delete unavailability record ${id}`, { error });
    res.status(500).json({ error: 'Failed to delete record' });
  }
};

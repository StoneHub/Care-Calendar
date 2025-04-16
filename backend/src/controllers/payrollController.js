const lowdbUtil = require('../utils/lowdbUtil');

// Helper to enrich payroll record with caregiver and week info
function enrichPayrollRecord(record) {
  const caregiver = lowdbUtil.findById('team_members', record.caregiver_id);
  const week = lowdbUtil.findById('weeks', record.week_id);
  return {
    ...record,
    caregiver_name: caregiver ? caregiver.name : undefined,
    caregiver_role: caregiver ? caregiver.role : undefined,
    week_id: week ? week.id : record.week_id,
    start_date: week ? week.start_date : undefined,
    end_date: week ? week.end_date : undefined
  };
}

// GET all payroll records
exports.getAllPayrollRecords = async (req, res) => {
  try {
    let payrollRecords = lowdbUtil.getAll('payroll_records');
    payrollRecords = payrollRecords.map(enrichPayrollRecord);
    // Sort by week start_date and caregiver_name
    payrollRecords = payrollRecords.sort((a, b) => {
      if (a.start_date !== b.start_date) return (a.start_date || '').localeCompare(b.start_date || '');
      return (a.caregiver_name || '').localeCompare(b.caregiver_name || '');
    });
    res.status(200).json(payrollRecords);
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
};

// GET payroll records by week
exports.getPayrollRecordsByWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const week = lowdbUtil.findById('weeks', weekId);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    let payrollRecords = lowdbUtil.find('payroll_records', { week_id: Number(weekId) });
    payrollRecords = payrollRecords.map(enrichPayrollRecord);
    payrollRecords = payrollRecords.sort((a, b) => (a.caregiver_name || '').localeCompare(b.caregiver_name || ''));
    res.status(200).json(payrollRecords);
  } catch (error) {
    console.error(`Error fetching payroll records for week ${req.params.weekId}:`, error);
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
};

// GET payroll records by caregiver
exports.getPayrollRecordsByCaregiver = async (req, res) => {
  try {
    const { caregiverId } = req.params;
    const caregiver = lowdbUtil.findById('team_members', caregiverId);
    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }
    let payrollRecords = lowdbUtil.find('payroll_records', { caregiver_id: Number(caregiverId) });
    payrollRecords = payrollRecords.map(enrichPayrollRecord);
    payrollRecords = payrollRecords.sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
    res.status(200).json(payrollRecords);
  } catch (error) {
    console.error(`Error fetching payroll records for caregiver ${req.params.caregiverId}:`, error);
    res.status(500).json({ error: 'Failed to fetch payroll records' });
  }
};

// POST calculate payroll for a week
exports.calculatePayrollForWeek = async (req, res) => {
  try {
    const { weekId } = req.params;
    const { notes } = req.body;
    const week = lowdbUtil.findById('weeks', weekId);
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    // Get all shifts for the week (exclude dropped)
    const shifts = lowdbUtil.find('shifts', { week_id: Number(weekId) }).filter(s => s.status !== 'dropped');
    // Calculate hours for each caregiver
    const caregiverHours = {};
    for (const shift of shifts) {
      const caregiverId = shift.caregiver_id;
      // Parse start and end times to calculate hours
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        return hours + (minutes / 60);
      };
      const startHours = parseTime(shift.start_time);
      const endHours = parseTime(shift.end_time);
      let shiftHours = endHours - startHours;
      if (shiftHours < 0) {
        shiftHours += 24;
      }
      if (!caregiverHours[caregiverId]) {
        caregiverHours[caregiverId] = 0;
      }
      caregiverHours[caregiverId] += shiftHours;
    }
    // Insert or update payroll records for each caregiver
    const dateCalculated = new Date().toISOString().split('T')[0];
    for (const [caregiverId, totalHours] of Object.entries(caregiverHours)) {
      const existingRecord = lowdbUtil.find('payroll_records', { caregiver_id: Number(caregiverId), week_id: Number(weekId) })[0];
      if (existingRecord) {
        lowdbUtil.update('payroll_records', existingRecord.id, {
          total_hours: totalHours,
          date_calculated: dateCalculated,
          notes: notes || ''
        });
      } else {
        lowdbUtil.insert('payroll_records', {
          caregiver_id: Number(caregiverId),
          week_id: Number(weekId),
          total_hours: totalHours,
          date_calculated: dateCalculated,
          notes: notes || ''
        });
      }
    }
    // Get the complete payroll records for this week
    let payrollRecords = lowdbUtil.find('payroll_records', { week_id: Number(weekId) });
    payrollRecords = payrollRecords.map(enrichPayrollRecord);
    payrollRecords = payrollRecords.sort((a, b) => (a.caregiver_name || '').localeCompare(b.caregiver_name || ''));
    res.status(200).json(payrollRecords);
  } catch (error) {
    console.error(`Error calculating payroll for week ${req.params.weekId}:`, error);
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
};

// GET a specific payroll record
exports.getPayrollRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = lowdbUtil.findById('payroll_records', id);
    if (!record) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    res.status(200).json(enrichPayrollRecord(record));
  } catch (error) {
    console.error(`Error fetching payroll record with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch payroll record' });
  }
};
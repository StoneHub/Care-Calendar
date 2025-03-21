const db = require('../utils/db');

// GET all payroll records
exports.getAllPayrollRecords = async (req, res) => {
  try {
    const payrollRecords = await db('payroll_records')
      .join('team_members', 'payroll_records.caregiver_id', 'team_members.id')
      .join('weeks', 'payroll_records.week_id', 'weeks.id')
      .select(
        'payroll_records.id',
        'payroll_records.total_hours',
        'payroll_records.date_calculated',
        'payroll_records.notes',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'weeks.id as week_id',
        'weeks.start_date',
        'weeks.end_date'
      )
      .orderBy(['weeks.start_date', 'team_members.name']);
    
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
    
    // Verify the week exists
    const week = await db('weeks')
      .where({ id: weekId })
      .first();
    
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    
    const payrollRecords = await db('payroll_records')
      .join('team_members', 'payroll_records.caregiver_id', 'team_members.id')
      .select(
        'payroll_records.id',
        'payroll_records.total_hours',
        'payroll_records.date_calculated',
        'payroll_records.notes',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role'
      )
      .where('payroll_records.week_id', weekId)
      .orderBy('team_members.name');
    
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
    
    // Verify the caregiver exists
    const caregiver = await db('team_members')
      .where({ id: caregiverId })
      .first();
    
    if (!caregiver) {
      return res.status(404).json({ error: 'Caregiver not found' });
    }
    
    const payrollRecords = await db('payroll_records')
      .join('weeks', 'payroll_records.week_id', 'weeks.id')
      .select(
        'payroll_records.id',
        'payroll_records.total_hours',
        'payroll_records.date_calculated',
        'payroll_records.notes',
        'weeks.id as week_id',
        'weeks.start_date',
        'weeks.end_date'
      )
      .where('payroll_records.caregiver_id', caregiverId)
      .orderBy('weeks.start_date', 'desc');
    
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
    
    // Verify the week exists
    const week = await db('weeks')
      .where({ id: weekId })
      .first();
    
    if (!week) {
      return res.status(404).json({ error: 'Week not found' });
    }
    
    // Get all shifts for the week
    const shifts = await db('shifts')
      .where('week_id', weekId)
      .where('status', '!=', 'dropped') // Exclude dropped shifts
      .select('*');
    
    // Calculate hours for each caregiver
    const caregiverHours = {};
    
    for (const shift of shifts) {
      const caregiverId = shift.caregiver_id;
      
      // Parse start and end times to calculate hours
      // Note: In a real app, we'd use a library like moment.js for more robust time calculations
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
      
      // Calculate shift duration
      let shiftHours = endHours - startHours;
      if (shiftHours < 0) {
        shiftHours += 24; // Handle overnight shifts
      }
      
      // Add to caregiver's total
      if (!caregiverHours[caregiverId]) {
        caregiverHours[caregiverId] = 0;
      }
      caregiverHours[caregiverId] += shiftHours;
    }
    
    // Insert payroll records for each caregiver
    const payrollRecords = [];
    const dateCalculated = new Date().toISOString().split('T')[0];
    
    for (const [caregiverId, totalHours] of Object.entries(caregiverHours)) {
      // Check if a record already exists for this caregiver and week
      const existingRecord = await db('payroll_records')
        .where({
          caregiver_id: caregiverId,
          week_id: weekId
        })
        .first();
      
      if (existingRecord) {
        // Update existing record
        await db('payroll_records')
          .where({ id: existingRecord.id })
          .update({
            total_hours: totalHours,
            date_calculated: dateCalculated,
            notes: notes || ''
          });
          
        payrollRecords.push({
          ...existingRecord,
          total_hours: totalHours,
          date_calculated: dateCalculated,
          notes: notes || ''
        });
      } else {
        // Insert new record
        const [id] = await db('payroll_records')
          .insert({
            caregiver_id: caregiverId,
            week_id: weekId,
            total_hours: totalHours,
            date_calculated: dateCalculated,
            notes: notes || ''
          })
          .returning('id');
          
        payrollRecords.push({
          id,
          caregiver_id: caregiverId,
          week_id: weekId,
          total_hours: totalHours,
          date_calculated: dateCalculated,
          notes: notes || ''
        });
      }
    }
    
    // Get the complete payroll records with names
    const completePayrollRecords = await db('payroll_records')
      .join('team_members', 'payroll_records.caregiver_id', 'team_members.id')
      .select(
        'payroll_records.id',
        'payroll_records.total_hours',
        'payroll_records.date_calculated',
        'payroll_records.notes',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role'
      )
      .where('payroll_records.week_id', weekId)
      .orderBy('team_members.name');
    
    res.status(200).json(completePayrollRecords);
  } catch (error) {
    console.error(`Error calculating payroll for week ${req.params.weekId}:`, error);
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
};

// GET a specific payroll record
exports.getPayrollRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payrollRecord = await db('payroll_records')
      .join('team_members', 'payroll_records.caregiver_id', 'team_members.id')
      .join('weeks', 'payroll_records.week_id', 'weeks.id')
      .select(
        'payroll_records.id',
        'payroll_records.total_hours',
        'payroll_records.date_calculated',
        'payroll_records.notes',
        'team_members.id as caregiver_id',
        'team_members.name as caregiver_name',
        'team_members.role as caregiver_role',
        'weeks.id as week_id',
        'weeks.start_date',
        'weeks.end_date'
      )
      .where('payroll_records.id', id)
      .first();
    
    if (!payrollRecord) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }
    
    res.status(200).json(payrollRecord);
  } catch (error) {
    console.error(`Error fetching payroll record with ID ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch payroll record' });
  }
};
const lowdbUtil = require('./lowdbUtil');
const logger = require('./logger');

function seedDatabase() {
  logger.info('Seeding LowDB database with initial data...');
  try {
    // Seed team_members if empty
    const teamMembers = lowdbUtil.getAll('team_members');
    if (!teamMembers || teamMembers.length === 0) {
      lowdbUtil.insert('team_members', { name: 'Robin', role: 'Day Shift', availability: 'Weekdays', is_active: true });
      lowdbUtil.insert('team_members', { name: 'Scarlet', role: 'Evening Shift', availability: 'Weekdays', is_active: true });
      lowdbUtil.insert('team_members', { name: 'Kellie', role: 'Day Shift', availability: 'Weekends', is_active: true });
      lowdbUtil.insert('team_members', { name: 'Joanne', role: 'Evening Shift', availability: 'Weekends', is_active: true });
      logger.info('Seeded team_members');
    } else {
      logger.info('team_members already contains data, skipping seed');
    }
    // Seed current week if not present
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    const startDateStr = startOfWeek.toISOString().split('T')[0];
    const endDateStr = endOfWeek.toISOString().split('T')[0];
    let week = lowdbUtil.find('weeks', { start_date: startDateStr })[0];
    if (!week) {
      week = lowdbUtil.insert('weeks', {
        start_date: startDateStr,
        end_date: endDateStr,
        is_published: true,
        notes: 'Initial week'
      });
      logger.info('Created new week');
    } else {
      logger.info('Week already exists');
    }
    const weekId = week.id;
    logger.info(`Seeded weeks with id: ${weekId}`);
    // Get caregiver IDs
    const caregivers = lowdbUtil.getAll('team_members');
    const robin = caregivers.find(c => c.name.trim() === 'Robin');
    const scarlet = caregivers.find(c => c.name.trim() === 'Scarlet');
    const kelly = caregivers.find(c => c.name.trim() === 'Kellie');
    const joanne = caregivers.find(c => c.name.trim() === 'Joanne');
    if (!robin || !scarlet || !kelly || !joanne) {
      logger.error('One or more required caregivers are missing. Cannot seed shifts or notifications.', {
        robin: !!robin, scarlet: !!scarlet, kelly: !!kelly, joanne: !!joanne
      });
      return;
    }
    const robinId = robin.id;
    const scarletId = scarlet.id;
    const kellyId = kelly.id;
    const joanneId = joanne.id;
    // Seed shifts for the week if not present
    const existingShifts = lowdbUtil.find('shifts', { week_id: weekId });
    if (!existingShifts || existingShifts.length === 0) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      // Weekday shifts (Monday-Friday)
      for (let i = 0; i < 5; i++) {
        lowdbUtil.insert('shifts', {
          week_id: weekId,
          day_of_week: days[i],
          caregiver_id: robinId,
          start_time: '9:00 AM',
          end_time: '4:00 PM',
          status: i === 2 ? 'requested-off' : 'confirmed'
        });
        lowdbUtil.insert('shifts', {
          week_id: weekId,
          day_of_week: days[i],
          caregiver_id: scarletId,
          start_time: '4:00 PM',
          end_time: '9:00 PM',
          status: 'confirmed'
        });
      }
      // Weekend shifts (Saturday-Sunday)
      for (let i = 5; i < 7; i++) {
        lowdbUtil.insert('shifts', {
          week_id: weekId,
          day_of_week: days[i],
          caregiver_id: kellyId,
          start_time: '9:00 AM',
          end_time: '3:00 PM',
          status: i === 5 ? 'swap-proposed' : 'confirmed'
        });
        lowdbUtil.insert('shifts', {
          week_id: weekId,
          day_of_week: days[i],
          caregiver_id: joanneId,
          start_time: '3:00 PM',
          end_time: '9:00 PM',
          status: i === 5 ? 'swap-proposed' : 'confirmed'
        });
      }
      logger.info('Seeded shifts');
    } else {
      logger.info('Shifts already exist for this week, skipping seed');
    }
    // Seed notifications for the week if not present
    const existingNotifications = lowdbUtil.find('notifications', { week_id: weekId });
    if (!existingNotifications || existingNotifications.length === 0) {
      const wednesdayDate = new Date(startOfWeek);
      wednesdayDate.setDate(startOfWeek.getDate() + 2); // Wednesday
      const wednesdayDateStr = wednesdayDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      const saturdayDate = new Date(startOfWeek);
      saturdayDate.setDate(startOfWeek.getDate() + 5); // Saturday
      const saturdayDateStr = saturdayDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      lowdbUtil.insert('notifications', {
        type: 'adjust',
        from_caregiver_id: robinId,
        week_id: weekId,
        message: 'Changed shift from 9AM-4PM to 10AM-5PM',
        date: `Wed, ${wednesdayDateStr}`,
        time: '14:35',
        status: 'completed'
      });
      lowdbUtil.insert('notifications', {
        type: 'swap',
        from_caregiver_id: kellyId,
        week_id: weekId,
        message: 'Swapped shift with Joanne',
        date: `Sat, ${saturdayDateStr}`,
        time: '09:15',
        status: 'pending'
      });
      lowdbUtil.insert('notifications', {
        type: 'drop',
        from_caregiver_id: scarletId,
        week_id: weekId,
        message: 'Dropped shift, needs coverage',
        date: `Wed, ${wednesdayDateStr}`,
        time: '17:22',
        status: 'pending'
      });
      logger.info('Seeded notifications');
    } else {
      logger.info('Notifications already exist, skipping seed');
    }
    logger.info('LowDB database seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding LowDB database', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
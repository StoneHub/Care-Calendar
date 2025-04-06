const db = require('./db');

// Run the initializer first
require('./initializeDb');

async function seedDatabase() {
  console.log('Seeding database with initial data...');

  try {
    // Check if team_members already has data
    const teamMembersCount = await db('team_members').count('id as count').first();
    
    // Only seed team_members if it's empty
    if (teamMembersCount.count === 0) {
      await db('team_members').insert([
        { name: 'Robin', role: 'Day Shift', availability: 'Weekdays', hours_per_week: 35 },
        { name: 'Scarlet', role: 'Evening Shift', availability: 'Weekdays', hours_per_week: 25 },
        { name: 'Kelly', role: 'Day Shift', availability: 'Weekends', hours_per_week: 12 },
        { name: 'Joanne', role: 'Evening Shift', availability: 'Weekends', hours_per_week: 12 }
      ]).then(() => console.log('Seeded team_members'));
    } else {
      console.log('team_members already contains data, skipping seed');
    }

    // Create a current week if it doesn't exist
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Start with Monday
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End with Sunday
    
    const startDateStr = startOfWeek.toISOString().split('T')[0];
    const endDateStr = endOfWeek.toISOString().split('T')[0];
    
    // Check if this week already exists
    let week = await db('weeks').where('start_date', startDateStr).first();
    
    if (!week) {
      // Insert week if it doesn't exist
      await db('weeks').insert({
        start_date: startDateStr,
        end_date: endDateStr,
        is_published: true,
        notes: 'Initial week'
      });
      
      // Get the inserted week
      week = await db('weeks').where('start_date', startDateStr).first();
      console.log('Created new week');
    } else {
      console.log('Week already exists');
    }
    
    // Get the week ID
    const weekId = week.id;
    
    console.log(`Seeded weeks with id: ${weekId}`);

    // Get caregiver IDs
    const caregivers = await db('team_members').select('id', 'name');
    const robinId = caregivers.find(c => c.name.trim() === 'Robin').id;
    const scarletId = caregivers.find(c => c.name.trim() === 'Scarlet').id;
    const kellyId = caregivers.find(c => c.name.trim() === 'Kellie').id;  // Fixed name from Kelly to Kellie
    const joanneId = caregivers.find(c => c.name.trim() === 'Joanne').id; // Added trim to handle spaces

    // Check if shifts already exist for this week
    const existingShifts = await db('shifts').where('week_id', weekId).count('id as count').first();
    
    if (existingShifts.count === 0) {
      // Insert shifts for the week
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const shifts = [];
      
      // Weekday shifts (Monday-Friday)
      for (let i = 0; i < 5; i++) {
        shifts.push(
          {
            week_id: weekId,
            day_of_week: days[i],
            caregiver_id: robinId,
            start_time: '9:00 AM',
            end_time: '4:00 PM',
            status: i === 2 ? 'requested-off' : 'confirmed' // Wednesday is requested off
          },
          {
            week_id: weekId,
            day_of_week: days[i],
            caregiver_id: scarletId,
            start_time: '4:00 PM',
            end_time: '9:00 PM',
            status: 'confirmed'
          }
        );
      }
      
      // Weekend shifts (Saturday-Sunday)
      for (let i = 5; i < 7; i++) {
        shifts.push(
          {
            week_id: weekId,
            day_of_week: days[i],
            caregiver_id: kellyId,
            start_time: '9:00 AM', // Saturday/Sunday morning
            end_time: '3:00 PM',
            status: i === 5 ? 'swap-proposed' : 'confirmed' // Saturday is swap proposed
          },
          {
            week_id: weekId,
            day_of_week: days[i],
            caregiver_id: joanneId,
            start_time: '3:00 PM', // Saturday/Sunday evening
            end_time: '9:00 PM',
            status: i === 5 ? 'swap-proposed' : 'confirmed' // Saturday is swap proposed
          }
        );
      }
      
      await db('shifts').insert(shifts).then(() => console.log('Seeded shifts'));
    } else {
      console.log('Shifts already exist for this week, skipping seed');
    }

    // Check if notifications exist
    const existingNotifications = await db('notifications').where('week_id', weekId).count('id as count').first();
    
    if (existingNotifications.count === 0) {
      // Insert sample notifications
      const wednesdayDate = new Date(startOfWeek);
      wednesdayDate.setDate(startOfWeek.getDate() + 2); // Wednesday
      const wednesdayDateStr = wednesdayDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      
      const saturdayDate = new Date(startOfWeek);
      saturdayDate.setDate(startOfWeek.getDate() + 5); // Saturday
      const saturdayDateStr = saturdayDate.toLocaleString('default', { month: 'short', day: 'numeric' });
      
      await db('notifications').insert([
        {
          type: 'adjust',
          from_caregiver_id: robinId,
          week_id: weekId,
          message: 'Changed shift from 9AM-4PM to 10AM-5PM',
          date: `Wed, ${wednesdayDateStr}`,
          time: '14:35',
          status: 'completed'
        },
        {
          type: 'swap',
          from_caregiver_id: kellyId,
          week_id: weekId,
          message: 'Swapped shift with Joanne',
          date: `Sat, ${saturdayDateStr}`,
          time: '09:15',
          status: 'pending'
        },
        {
          type: 'drop',
          from_caregiver_id: scarletId,
          week_id: weekId,
          message: 'Dropped shift, needs coverage',
          date: `Wed, ${wednesdayDateStr}`,
          time: '17:22',
          status: 'pending'
        }
      ]).then(() => console.log('Seeded notifications'));
    } else {
      console.log('Notifications already exist, skipping seed');
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    db.destroy();
  }
}

// Run the seeding
seedDatabase();
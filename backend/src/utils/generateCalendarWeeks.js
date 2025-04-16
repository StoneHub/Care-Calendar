/**
 * Utility for generating calendar weeks for the application
 */
const lowdbUtil = require('./lowdbUtil');
const logger = require('./logger');

/**
 * Get the Monday of the week containing the given date
 * @param {Date} date - Date to get Monday for
 * @returns {Date} - Monday of the same week
 */
function getMonday(date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  return new Date(date.setDate(diff));
}

/**
 * Format a date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Generate weeks for a specified range
 * @param {number} weeksBack - Number of weeks back from current week to generate
 * @param {number} weeksForward - Number of weeks forward from current week to generate
 */
async function generateCalendarWeeks(weeksBack = 4, weeksForward = 12) {
  try {
    logger.info('Generating calendar weeks', { weeksBack, weeksForward });
    
    // Get today's date
    const today = new Date();
    
    // Get Monday of current week as the reference point
    const currentMonday = getMonday(new Date(today));
    logger.debug('Current Monday', { date: formatDate(currentMonday) });
    
    // Generate weeks
    const weeksToCreate = [];
    
    // Generate past weeks
    for (let i = weeksBack; i > 0; i--) {
      const startDate = new Date(currentMonday);
      startDate.setDate(currentMonday.getDate() - (7 * i));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      weeksToCreate.push({
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        is_published: true, // Past weeks are auto-published
        notes: `Auto-generated week ${formatDate(startDate)} to ${formatDate(endDate)}`
      });
    }
    
    // Generate current week
    weeksToCreate.push({
      start_date: formatDate(currentMonday),
      end_date: formatDate(new Date(currentMonday.getTime() + (6 * 24 * 60 * 60 * 1000))),
      is_published: true,
      notes: 'Current week'
    });
    
    // Generate future weeks
    for (let i = 1; i <= weeksForward; i++) {
      const startDate = new Date(currentMonday);
      startDate.setDate(currentMonday.getDate() + (7 * i));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      weeksToCreate.push({
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        is_published: i <= 2, // Only publish next 2 weeks by default
        notes: `Auto-generated week ${formatDate(startDate)} to ${formatDate(endDate)}`
      });
    }
    
    // Insert weeks - skip if they already exist
    for (const week of weeksToCreate) {
      try {
        // Check if week exists using lowdbUtil
        const existingWeek = lowdbUtil.find('weeks', { start_date: week.start_date })[0];
          
        if (!existingWeek) {
          logger.debug('Creating new week', week);
          lowdbUtil.insert('weeks', week);
        } else {
          logger.debug('Week already exists', { 
            start_date: week.start_date,
            id: existingWeek.id 
          });
        }
      } catch (error) {
        logger.error(`Error creating week (${week.start_date})`, { 
          error: error.message,
          week
        });
      }
    }
    
    logger.info('Finished generating calendar weeks', { count: weeksToCreate.length });
  } catch (error) {
    logger.error('Error generating calendar weeks', { error: error.message });
    throw error;
  }
}

module.exports = generateCalendarWeeks;
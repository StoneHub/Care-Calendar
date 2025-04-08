# Care Calendar Development Roadmap

This roadmap outlines the planned improvements and new features for the Care Calendar application.

## Phase 1: Core Stability (Completed)

### High Priority

1. ✅ **Fix Week Navigation Logic**
   - Implement robust date-based navigation
   - Ensure consistent 7-day jumps
   - Fix week selection issues

2. ✅ **Fix Current Day Highlighting**
   - Only highlight today when viewing the current week
   - Ensure proper date comparison

3. ✅ **Fix Add Shift Dialog UI**
   - Fixed the UI for the add shift dialog
   - Improved validation and error handling
   - Added loading states and double submission prevention
   
4. ✅ **Debug Add Shift Functionality**
   - Fixed issue with backend returning shifts as an object instead of array
   - Added enhanced logging for troubleshooting
   - Ensured correct data flow between frontend and backend
   
5. ✅ **Fix Delete Shift Functionality**
   - Fixed issue with deleting dropped shifts
   - Added cascading deletion of related notifications
   - Improved error handling and logging

### Medium Priority

1. ✅ **Enhanced Error Handling**
   - Implement consistent error handling across the application
   - Add better user feedback for failed operations
   - Improved error logging with separate debug log file

2. ✅ **Database Stability**
   - Fixed database connection issues ("db is not a function" error)
   - Added database reset utility for easier troubleshooting
   - Added debug endpoints to check database status
   - Improved SQLite compatibility for Windows systems

3. **Backend Validation**
   - Add express-validator for input validation
   - Ensure proper data types and formats
   - Validate foreign key relationships

4. **Database Optimization**
   - Add indices to frequently queried columns
   - Use transactions for multi-step operations
   - Improve query performance

## Phase 2: Team Management and UX (Current)

### High Priority

1. **Team Management Core**
   - Develop Team management tab UI with CRUD operations
   - Add caregiver profile pages showing assigned shifts and history
   - Implement caregiver availability settings
   - Integrate team member search/filtering

2. **Simplified Shift Actions**
   - Remove "swap" functionality as it's unnecessary complexity
   - Focus on refining "drop shift" workflow so other caregivers can claim/cover
   - Add "claim dropped shift" functionality to the UI
   - Implement notifications for dropped shifts

3. **Team Dashboard**
   - Create caregiver availability visualization
   - Show upcoming shifts per caregiver
   - Add visual workload balancing indicators
   - Implement shift coverage gaps highlighting

### Medium Priority

1. **Mobile Responsiveness**
   - Optimize for portrait view on tablets/phones
   - Implement responsive grid layout
   - Create touch-friendly controls

2. **Usability Enhancements**
   - Add shift coloring by caregiver
   - Implement drag-and-drop for easier shift management
   - Add visual indicators for real-time updates

## Phase 3: Advanced Features

1. **Payroll Reporting**
   - Implement weekly hours calculation
   - Generate CSV export options
   - Add historical data views

2. **Schedule Templates**
   - Create reusable schedule templates
   - Allow quick application of templates to new weeks
   - Implement recurring shift patterns

3. **Notifications System**
   - Enhance real-time notifications
   - Add notification preferences
   - Implement notification history

## Phase 4: Deployment & Beyond

1. **Raspberry Pi Optimization**
   - Performance tuning for RPi 2B
   - Memory usage optimization
   - Battery usage considerations

2. **Local Network Security**
   - Basic authentication
   - Local network security best practices
   - Data backup strategy

3. **Multi-device Synchronization**
   - Ensure consistent state across devices
   - Handle offline/reconnection scenarios
   - Implement conflict resolution

## Technical Debt

1. **Code Quality**
   - Add unit and integration tests
   - Improve code documentation
   - Refactor complex components

2. **Build Process**
   - Optimize build for production
   - Reduce bundle size
   - Implement code splitting

3. **Dependency Management**
   - Update dependencies regularly
   - Remove unused dependencies
   - Consider security implications
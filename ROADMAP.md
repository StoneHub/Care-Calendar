# Care Calendar Development Roadmap

This roadmap outlines the planned improvements and new features for the Care Calendar application.

## Phase 1: Core Stability (Completed)

### High Priority

1. ✅ **Fix Week Navigation Logic**
   - Implemented robust date-based navigation
   - Ensured consistent 7-day jumps
   - Fixed week selection issues

2. ✅ **Fix Current Day Highlighting**
   - Only highlight today when viewing the current week
   - Ensured proper date comparison

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
   - Implemented consistent error handling across the application
   - Added better user feedback for failed operations
   - Improved error logging with separate debug log file

2. ✅ **Database Stability**
   - Fixed database connection issues ("db is not a function" error)
   - Added database reset utility for easier troubleshooting
   - Added debug endpoints to check database status
   - Improved SQLite compatibility for Windows systems

3. **Backend Validation** (Planned)
   - Add express-validator for input validation
   - Ensure proper data types and formats
   - Validate foreign key relationships

4. **Database Optimization** (Planned)
   - Add indices to frequently queried columns
   - Use transactions for multi-step operations
   - Improve query performance

## Phase 2: History System and Data Preservation (Completed)

### High Priority

1. ✅ **History System Implementation**
   - Created history database table for tracking all changes
   - Implemented backend APIs for recording and retrieving history
   - Replaced Notifications tab with comprehensive History view
   - Removed Settings button from UI

2. ✅ **Data Preservation**
   - Implemented proper transaction handling for critical operations
   - Enhanced database validation and integrity checks
   - Improved error recovery

## Phase 3: Enhanced Experience & Accessibility (Current)

### High Priority

1. ✅ **Local Network Access**
   - Added custom hostname via mDNS for local network access
   - Made application discoverable on local network using Bonjour
   - Enabled Smart Fridge & tablet display optimization with viewport meta tags
   - Created documentation for network access in docs/local-network-access.md

2. **Dark Mode & Theming**
   - Implement dark mode theme for Greenville, SC location
   - Add automatic theme switching based on fixed sunrise/sunset times
   - Simple color scheme with dark background and light text for night viewing

3. **Days Out/Unavailability Feature**
   - Add ability for team members to mark unavailable days
   - Display unavailability as colored blocks on calendar
   - Add repeating weekly option (until end of year)

4. **Enhanced Team Management**
   - Remove hours requirements for team members
   - Add active/inactive status for team members
   - Implement HTML reporting with charts for 1099 tax preparation
   - Add report export button that emails to alexsaero56@gmail.com

5. **Google Calendar Integration**
   - Use single account (alexsaero56@gmail.com) for calendar management
   - Create shared calendar that team members can subscribe to
   - Include all shifts and unavailability in calendar
   - Daily automated updates

## Phase 4: Additional Features & Optimizations

### High Priority

1. ✅ **Team Management Core**
   - Implemented Team management tab UI with CRUD operations ✓
   - Added ability to add/edit/delete team members ✓
   - Added force delete option to remove caregivers with assigned shifts ✓
   - Implemented proper UI state persistence and error handling ✓
   - Remaining tasks moved to Phase 3: caregiver profile pages, detailed availability settings

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

## Phase 5: Advanced Features

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

## Phase 6: Deployment & Beyond

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

4. **Database Management**
   - Implement database export/import for version control
   - Create database backup and restore utilities
   - Add database maintenance scripts
# Care Calendar Development Roadmap

This roadmap outlines the planned improvements and new features for the Care Calendar application.

## Phase 1: Core Stability (Current)

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
   
4. **Debug Add Shift Functionality**
   - Investigate why shifts aren't being added when submit is clicked
   - Check for silent API errors in both frontend and backend logs
   - Verify correct data is being sent to the backend API

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

## Phase 2: UI/UX Improvements

1. **Mobile Responsiveness**
   - Optimize for portrait view on tablets/phones
   - Ensure adequate tap targets
   - Implement responsive grid layout

2. **Usability Enhancements**
   - Add click-to-add-shift functionality
   - Implement drag-and-drop for shift management
   - Add visual indicators for real-time updates

3. **Team Features**
   - Improve team display in the UI
   - Add team management page
   - Implement team availability visualization

4. **Accessibility**
   - Add ARIA attributes
   - Ensure keyboard navigation
   - Implement proper focus management

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
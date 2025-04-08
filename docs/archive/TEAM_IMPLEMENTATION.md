# Team Management Implementation Plan

This document outlines the plan for implementing the Team Management features in the Care Calendar application.

## 1. Overview

The Team Management module will allow administrators to:
- Manage caregivers (add, edit, remove)
- View caregiver schedules and availability
- Manage shift assignments
- Handle dropped shift claims

## 2. Design & Architecture

### Database Changes
- Enhance `team_members` table:
  ```sql
  ALTER TABLE team_members
  ADD COLUMN profile_image TEXT,
  ADD COLUMN contact_info TEXT,
  ADD COLUMN default_hours INTEGER,
  ADD COLUMN preferences TEXT;
  ```

- Add `shift_claims` table:
  ```sql
  CREATE TABLE IF NOT EXISTS shift_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER NOT NULL,
    caregiver_id INTEGER NOT NULL,
    claim_date TEXT NOT NULL,
    status TEXT NOT NULL, -- 'pending', 'approved', 'rejected'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
    FOREIGN KEY (caregiver_id) REFERENCES team_members(id) ON DELETE CASCADE
  );
  ```

### API Endpoints

#### Team Management
- `GET /api/team/stats` - Get team overview statistics
- `GET /api/team/:id/shifts` - Get shifts for a specific caregiver
- `PUT /api/team/:id/availability` - Update caregiver availability
- `GET /api/team/available` - Get available caregivers for a specific time

#### Shift Claims
- `GET /api/shifts/dropped` - Get all dropped shifts
- `POST /api/shifts/:id/claim` - Claim a dropped shift
- `PUT /api/shifts/claims/:id` - Approve/reject a claim
- `GET /api/shifts/claims/:caregiverId` - Get all claims for a caregiver

## 3. User Interface Components

### Team Management Tab
- Team overview section
  - Team member list with availability indicators
  - Weekly hours distribution chart
  - Coverage gaps visualization

- Team member details
  - Profile information
  - Upcoming and past shifts
  - Availability editor
  - Performance metrics

### Shift Management Enhancements
- Replace "Swap Shift" with "Drop Shift"
- Add "Claim Shift" option for dropped shifts
- Visual indicators for dropped shifts on the calendar
- Notification badges for available shifts

## 4. Implementation Plan

### Phase 1: Core Team Management (2 weeks)
1. **Database Updates (3 days)**
   - Update database schema
   - Create migration scripts
   - Update seed data

2. **Backend API Development (5 days)**
   - Implement team stats endpoints
   - Implement team availability endpoints
   - Update shift controllers for dropped shifts
   - Add tests for new endpoints

3. **Frontend Team UI (6 days)**
   - Create team list view
   - Develop caregiver detail page
   - Implement team availability editor
   - Add team search/filtering

### Phase 2: Shift Actions Simplification (2 weeks)
1. **Backend Changes (5 days)**
   - Remove swap shift functionality
   - Enhance drop shift functionality
   - Implement claim shift API
   - Update notification system

2. **Frontend Updates (5 days)**
   - Update shift options modal
   - Remove swap UI elements
   - Add claim shift UI
   - Update notifications panel

3. **Testing & Bug Fixes (4 days)**
   - End-to-end testing of new flows
   - Fix any regression issues
   - Performance optimization

### Phase 3: Team Dashboard (1 week)
1. **Backend Analytics (3 days)**
   - Implement shift analytics endpoints
   - Create caregiver workload calculations
   - Generate coverage reports

2. **Frontend Dashboard (4 days)**
   - Build visualizations for team data
   - Create workload balancing indicators
   - Implement coverage gaps highlighting

## 5. Technical Considerations

### State Management
- Expand `ScheduleContext` to include team management state
- Create new `TeamContext` with team-specific operations
- Update API service for new endpoints

### Data Flow
- Real-time updates using Socket.io for team changes
- Optimistic UI updates for better UX
- Proper error handling and rollback for failures

### Performance
- Implement pagination for team member list
- Lazy load caregiver details and history
- Optimize database queries for team operations

## 6. Testing Strategy

- Unit tests for new API endpoints
- Component tests for new UI elements
- End-to-end tests for team management flows
- Performance testing for large team datasets

## 7. Deployment Considerations

- Database migration plan
- Feature flags for gradual rollout
- Backward compatibility with existing data

## Next Steps

1. Create detailed UI mockups for team management screens
2. Develop database migration scripts
3. Start with the backend API implementation
4. Begin frontend development of the team list view
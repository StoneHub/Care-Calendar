# Care Calendar: Enhanced Experience & Accessibility Development Plan

## Overview
This development plan outlines the implementation of six key enhancements to the Care Calendar application: local network access, dark mode with automatic switching, team member unavailability tracking, improved team management, repeating weekly shifts, and Google Calendar integration.

## Implementation Status

### ✅ Feature 1: Local Network Access
**Status: COMPLETED**
- Added network access configuration to both frontend and backend
- Implemented mDNS discovery service for "care-calendar.local" hostname
- Optimized viewport settings for smart displays
- Created comprehensive documentation in `docs/local-network-access.md`

### ✅ Feature 2: Dark Mode & Theme Switching
**Status: COMPLETED**
- Implemented fixed-time sunrise/sunset settings for Greenville, SC (6am-7pm)
- Created standardized theme utility classes for consistent component styling
- Added accessibility attributes to UI controls
- Fixed component inconsistencies for dark mode across the application
- Fixed modal components with white backgrounds in dark mode (CaregiverModal, CreateWeekModal, ShiftOptionsModal)
- Improved main calendar interface with proper dark styling for calendar grid, week selector, and shift cards
- Updated Team and History components for better dark mode visuals
- Completed dark mode support for all remaining UI components

### ✅ Feature 3: Days Out/Unavailability Feature  
**Status: COMPLETED**
- Displays unavailability as shift-like blocks with different styling
- Implemented repeating weekly option until end of calendar year
- Added comprehensive UI for managing team member time off
- Integrated with schedule display

### 🔄 Feature 4: Enhanced Team Management
**Status: IN PROGRESS**
- ✅ Implemented force delete option for team members with assigned shifts
- ✅ Fixed history tracking for team member deletions 
- ✅ Removed hours requirements for team members
- ✅ Added active/inactive status for team members
- Will implement HTML reporting with tax information

### 🔄 Feature 5: Repeating Weekly Shifts
**Status: PARTIALLY COMPLETED**
- ✅ Added "Repeats Weekly" checkbox to the Add Shift modal
- ✅ Added "Repeat Until" date picker when the checkbox is selected
- ✅ Implemented backend support for recurring shifts
- ✅ Added database schema updates to support recurring shifts
- ❌ Recurring shifts not appearing on subsequent weeks (needs debugging)

### 🔄 Feature 6: Google Calendar Integration
**Status: PENDING**
- Will use single account (alexsaero56@gmail.com)
- Will create shared calendar for team members

## Implementation Sequence
1. ✅ Local Network Access (COMPLETED)
2. ✅ Days Out/Unavailability feature (COMPLETED)
3. ✅ Dark Mode theme (COMPLETED)
4. 🔄 Enhanced Team Management (CURRENT)
   * ✅ Fix history logging for team member deletions (COMPLETED)
   * ✅ Remove hours requirements for team members (COMPLETED)
   * ✅ Add active/inactive status for team members (COMPLETED)
   * Complete HTML reporting with tax information
5. 🔄 Repeating Weekly Shifts (PARTIALLY COMPLETED)
   * ✅ Added UI for creating recurring shifts
   * ✅ Implemented backend support for recurring shifts
   * ✅ Updated database schema
   * ❌ Debug issue with recurring shifts not appearing on subsequent weeks
6. 🔄 Google Calendar Integration (NEXT)

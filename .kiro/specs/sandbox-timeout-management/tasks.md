# Implementation Plan

- [x] 1. Database Schema Migration

  - Add new `sandbox_info` JSONB column to project table schema
  - Create migration script to handle existing data transformation
  - Update TypeScript interfaces to include SandboxInfo type
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Enhanced Status API Implementation

  - [x] 2.1 Create new status API endpoint with intelligent sandbox checking

    - Implement `/api/v1/projects/[id]/sandbox/status` route
    - Add logic to compare end_time with current time
    - Integrate E2B getInfo() calls for sandbox verification
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.2 Implement sandbox info update functionality

    - Create database query methods for sandbox_info JSONB operations

    - Add logic to update end_time from E2B sandbox information
    - Implement error handling for E2B API failures
    - _Requirements: 2.4, 2.5_

- [x] 3. Update Sync API for New Schema

  - [x] 3.1 Modify sync API to check status before creating sandbox

    - Update sync route to call status API first
    - Skip sandbox creation if status indicates sandbox is running
    - Return existing sandbox info when sandbox is already active
    - _Requirements: 4.1, 5.2, 5.3_

  - [x] 3.2 Update sync API to store complete sandbox_info

    - Modify sync API to populate full sandbox_info object
    - Include start_time and calculated end_time in database updates
    - Update response format to include sandbox timing information
    - _Requirements: 4.1, 4.2_

- [x] 4. Update Project Queries for New Schema

  - [x] 4.1 Add sandbox_info query methods to project queries

    - Create `updateSandboxInfo()` method for JSONB updates
    - Add `getSandboxInfo()` method for extracting sandbox data
    - Update existing query methods to work with sandbox_info column
    - _Requirements: 1.3, 4.3_

  - [x] 4.2 Update all existing APIs to use sandbox_info

    - Modify project CRUD operations to read from sandbox_info
    - Update save-from-sandbox API to work with new schema
    - Ensure backward compatibility in API responses
    - _Requirements: 4.3, 4.4_

- [x] 5. Frontend Status Management Integration

  - [x] 5.1 Implement periodic status checking in project page

    - Create SandboxStatusManager class for coordinating status checks
    - Add logic to call status API every 1 minute
    - Implement automatic sync triggering when sandbox expires
    - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.4_

  - [x] 5.2 Update project loading logic to use status API

    - Modify project page initialization to call status API first
    - Skip automatic sync when status indicates sandbox is running
    - Update loading states to reflect status checking process
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.3 Update sandbox dropdown with status information

    - Modify sandbox dropdown to display remaining time
    - Add status indicators for running/expired/creating states
    - Update context menu actions based on current sandbox status
    - _Requirements: 5.4_

- [x] 6. Projects Manager Store Updates

  - [x] 6.1 Update MobX projects store for new sandbox_info structure

    - Modify Project interface to include sandbox_info instead of separate fields
    - Update syncToSandbox method to use new status checking logic
    - Add sandbox status tracking to store state
    - _Requirements: 4.3, 4.4_

  - [x] 6.2 Implement status checking methods in projects store

    - Add checkSandboxStatus method to projects manager
    - Create periodic status update functionality
    - Update sandbox state management to use timing information
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Data Migration Implementation

  - [ ] 7.1 Create migration script for existing projects

    - Write script to populate sandbox_info from existing sandbox_id/preview_url
    - Add default timing values for existing sandboxes (assume expired)
    - Validate migration results and handle edge cases
    - _Requirements: 1.1, 1.2_

  - [ ] 7.2 Update database schema definition
    - Remove old sandbox_id and preview_url columns from schema
    - Update all TypeScript types to reflect new structure
    - Run database migration to apply schema changes
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 8. Error Handling and Resilience

  - [x] 8.1 Implement comprehensive error handling for status API

    - Add retry logic for E2B API failures
    - Implement fallback behavior when status checks fail
    - Add logging and monitoring for sandbox status operations
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 8.2 Add error recovery for frontend status checking

    - Handle network failures during periodic status checks
    - Implement exponential backoff for failed status requests
    - Add user notifications for sandbox status issues
    - _Requirements: 3.2, 3.3, 5.4_

- [x] 9. Integration and Validation

  - [x] 9.1 Update all sandbox-related API endpoints

    - Ensure sandbox creation, restart, and kill APIs work with new schema
    - Update sandbox file operations to use sandbox_info
    - Validate that all existing functionality continues to work
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 9.2 Validate complete sandbox lifecycle workflow

    - Test project creation → status check → sync → periodic updates → expiration
    - Verify that sandbox resources are properly managed
    - Ensure user experience improvements are working as expected
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 5.4_

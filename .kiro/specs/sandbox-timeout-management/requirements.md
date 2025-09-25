# Requirements Document

## Introduction

The current sandbox system has timeout issues where sandboxes automatically shut down after a configured time period (30 minutes), but the application doesn't properly track or manage these timeouts. When users refresh their browser or navigate to a project, the system always calls the sync API which creates a new sandbox, even if an existing sandbox is still running. This leads to unnecessary resource usage and poor user experience.

The solution involves replacing the current `sandbox_id` and `preview_url` columns in the project table with a rich `sandbox_info` JSONB column that tracks sandbox lifecycle information, and implementing a status API that intelligently manages sandbox state.

## Requirements

### Requirement 1

**User Story:** As a developer, I want the system to track sandbox lifecycle information accurately, so that I don't waste resources creating unnecessary sandboxes.

#### Acceptance Criteria

1. WHEN a project is created or synced THEN the system SHALL store sandbox information in a JSONB `sandbox_info` column containing `sandbox_id`, `preview_url`, `start_time`, and `end_time`
2. WHEN updating sandbox information THEN the system SHALL replace all references to the old `sandbox_id` and `preview_url` columns with the new `sandbox_info` structure
3. WHEN querying sandbox information THEN the system SHALL extract data from the `sandbox_info` JSONB column instead of separate columns

### Requirement 2

**User Story:** As a developer, I want a status API that intelligently determines sandbox state, so that the system only creates new sandboxes when necessary.

#### Acceptance Criteria

1. WHEN the status API is called THEN the system SHALL compare the stored `end_time` with the current time to determine if the sandbox is still active
2. IF the stored `end_time` is in the future THEN the system SHALL consider the sandbox as running and SHALL NOT call the sync API
3. IF the stored `end_time` is in the past THEN the system SHALL consider the sandbox as expired and SHALL call the sync API to create a new one
4. WHEN a sandbox is confirmed as running THEN the system SHALL call the E2B getInfo() method to retrieve current sandbox information
5. WHEN sandbox info is retrieved THEN the system SHALL update the database `end_time` with the sandbox's actual `endAt` time

### Requirement 3

**User Story:** As a developer, I want the status API to be called periodically to keep sandbox timing information current, so that the system always has accurate timeout data.

#### Acceptance Criteria

1. WHEN a user opens a project editor page THEN the system SHALL call the status API first before any other sandbox operations
2. WHEN the status API confirms a sandbox is running THEN the system SHALL call the status API every 1 minute to update the `end_time`
3. WHEN the status API detects an expired sandbox THEN the system SHALL stop the periodic calls and trigger a sync operation
4. WHEN a new sandbox is created via sync THEN the system SHALL resume periodic status API calls every 1 minute

### Requirement 4

**User Story:** As a developer, I want all existing APIs to work with the new sandbox_info structure, so that the migration is seamless.

#### Acceptance Criteria

1. WHEN the sync API creates a new sandbox THEN it SHALL update the complete `sandbox_info` object with all timing information
2. WHEN the sandbox status API retrieves info THEN it SHALL update only the `end_time` field in the existing `sandbox_info` object
3. WHEN any API needs sandbox information THEN it SHALL read from the `sandbox_info` JSONB column
4. WHEN the frontend requests sandbox data THEN it SHALL receive the information in the same format as before for backward compatibility

### Requirement 5

**User Story:** As a developer, I want the frontend to use the status API intelligently, so that sandbox operations are optimized and user experience is improved.

#### Acceptance Criteria

1. WHEN a user refreshes the project page THEN the system SHALL call the status API before attempting any sync operations
2. WHEN the status API indicates a sandbox is running THEN the system SHALL use the existing sandbox without creating a new one
3. WHEN the status API indicates a sandbox is expired THEN the system SHALL automatically trigger a sync operation to create a new sandbox
4. WHEN periodic status checks are running THEN the system SHALL display appropriate loading states and sandbox status indicators to the user

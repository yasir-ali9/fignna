# JSON-Based Persistence System Requirements

## Introduction

This specification defines the requirements for extending the existing fignna project with JSON-based file storage system that supports both Loveable-like chat functionality and Figma-like visual editing. The system will replace the current basic auth-only database schema with a comprehensive project management system that stores all project files as JSON objects to enable atomic operations, better performance for visual editing, and simplified state management.

## Current State Analysis

**Existing Implementation:**

- ✅ Basic database schema with auth tables (user, session, account, verification)
- ✅ V1 API for sandbox management (create, kill, status, logs)
- ✅ MobX EditorEngine with managers (Canvas, Elements, Files, State, AI, Sandbox)
- ✅ Project structure with modules (code-editor, project modes, widgets)
- ✅ E2B sandbox integration with global state management
- ✅ Basic UI components and providers

**Missing Implementation:**

- ❌ Project persistence in database
- ❌ JSON-based file storage
- ❌ Version control system (optional)
- ❌ Project management APIs

**Frontend-Only (No DB needed):**

- ✅ Canvas state (MobX CanvasManager - temporary UI state)
- ✅ Layer tree parsing (file-parser.ts - computed from files)
- ✅ Editor preferences (localStorage or StateManager)

## Requirements

### Requirement 1: Database Schema Extension

**User Story:** As a developer, I want to extend the existing auth schema with project tables that store files as JSON, so that I can perform atomic operations and maintain data consistency.

#### Acceptance Criteria

1. WHEN extending the database schema THEN the system SHALL add projects table with JSONB fields for file storage
2. WHEN storing project data THEN the system SHALL include canvas state and layer information in separate JSONB fields
3. WHEN versioning projects THEN the system SHALL track version numbers and change types in project_versions table
4. IF a project has many files THEN the system SHALL store them efficiently in a single JSONB field
5. WHEN querying projects THEN the system SHALL support selective field loading for performance
6. WHEN integrating with existing auth THEN the system SHALL reference existing user table

### Requirement 2: Project Management API

**User Story:** As a user, I want to create, read, update, and delete projects, so that I can manage my development work effectively.

#### Acceptance Criteria

1. WHEN creating a project THEN the system SHALL initialize with empty files JSON and default canvas state
2. WHEN fetching a project THEN the system SHALL return all files and metadata in a single response
3. WHEN updating a project THEN the system SHALL support partial updates of files and canvas state
4. WHEN deleting a project THEN the system SHALL clean up associated sandbox resources
5. WHEN listing projects THEN the system SHALL return metadata without heavy file content

### Requirement 3: File Operations API

**User Story:** As a user, I want to create, modify, and delete files within my project, so that I can build my application.

#### Acceptance Criteria

1. WHEN creating a file THEN the system SHALL add it to the project's files JSON
2. WHEN updating a file THEN the system SHALL modify the content atomically
3. WHEN deleting a file THEN the system SHALL remove it from the files JSON
4. WHEN performing batch operations THEN the system SHALL update multiple files in one transaction
5. WHEN syncing to sandbox THEN the system SHALL push all changed files efficiently

### Requirement 4: Frontend State Management (No DB Persistence)

**User Story:** As a user, I want my canvas state (zoom, pan, selections) to be managed efficiently in memory, so that I have a smooth editing experience.

#### Acceptance Criteria

1. WHEN working in Edit mode THEN the system SHALL manage canvas zoom and pan state in MobX CanvasManager
2. WHEN selecting elements THEN the system SHALL handle selection state in memory only
3. WHEN switching between modes THEN the system SHALL maintain state in existing StateManager
4. WHEN refreshing page THEN the system SHALL reset to default canvas state (like Figma)
5. WHEN loading a project THEN the system SHALL initialize canvas with default viewport

### Requirement 5: Layer Tree Parsing (Frontend Computed)

**User Story:** As a user, I want to see a Figma-like layers panel, so that I can navigate and select components visually.

#### Acceptance Criteria

1. WHEN parsing TSX files THEN the system SHALL extract component hierarchy using existing file-parser.ts
2. WHEN building layer tree THEN the system SHALL compute structure from files in FilesManager
3. WHEN updating components THEN the system SHALL refresh the layer tree automatically in memory
4. WHEN selecting in layers panel THEN the system SHALL highlight corresponding canvas elements via MobX
5. WHEN modifying layer structure THEN the system SHALL update the underlying code files only

### Requirement 6: Enhanced Sandbox Integration

**User Story:** As a user, I want my code changes to be reflected in a live preview, so that I can see results immediately.

#### Acceptance Criteria

1. WHEN project files change THEN the system SHALL sync to existing E2B sandbox automatically
2. WHEN sandbox expires THEN the system SHALL recreate using existing V1 API and restore from JSON files
3. WHEN initializing sandbox THEN the system SHALL push all files from JSON storage to E2B
4. WHEN sandbox is ready THEN the system SHALL store preview URL in project record
5. WHEN files are large THEN the system SHALL handle sync efficiently using existing sandbox manager
6. WHEN integrating with existing V1 API THEN the system SHALL maintain compatibility with current endpoints

### Requirement 7: Version Control

**User Story:** As a user, I want to track major changes to my project, so that I can revert if needed.

#### Acceptance Criteria

1. WHEN making significant changes THEN the system SHALL create version snapshots
2. WHEN AI generates code THEN the system SHALL mark versions appropriately
3. WHEN manually saving THEN the system SHALL allow optional commit messages
4. WHEN viewing history THEN the system SHALL show version timeline
5. WHEN reverting THEN the system SHALL restore files and canvas state

### Requirement 8: Performance Optimization

**User Story:** As a user, I want fast loading and saving, so that my editing experience is smooth.

#### Acceptance Criteria

1. WHEN loading projects THEN the system SHALL complete within 2 seconds using existing MobX stores
2. WHEN saving changes THEN the system SHALL complete within 1 second using JSONB operations
3. WHEN handling large projects THEN the system SHALL maintain performance with existing FilesManager
4. WHEN multiple users edit THEN the system SHALL handle concurrent access using optimistic locking
5. WHEN syncing to sandbox THEN the system SHALL use existing SandboxManager for incremental updates

### Requirement 9: Real-time Collaboration Support

**User Story:** As a user, I want to collaborate with others in real-time, so that we can work together effectively.

#### Acceptance Criteria

1. WHEN multiple users edit THEN the system SHALL prevent data conflicts
2. WHEN changes occur THEN the system SHALL broadcast to collaborators
3. WHEN conflicts arise THEN the system SHALL provide resolution mechanisms
4. WHEN users join THEN the system SHALL sync current project state
5. WHEN users leave THEN the system SHALL handle cleanup gracefully

### Requirement 10: Error Handling and Recovery

**User Story:** As a user, I want reliable data persistence, so that I never lose my work.

#### Acceptance Criteria

1. WHEN database errors occur THEN the system SHALL retry operations automatically
2. WHEN JSON parsing fails THEN the system SHALL provide meaningful error messages
3. WHEN sandbox sync fails THEN the system SHALL queue operations for retry
4. WHEN data corruption occurs THEN the system SHALL recover from last known good state
5. WHEN network issues arise THEN the system SHALL handle offline scenarios gracefully

### Requirement 11: Integration with Existing Architecture

**User Story:** As a developer, I want to integrate JSON persistence with existing MobX stores and components, so that I can maintain code consistency and reuse existing functionality.

#### Acceptance Criteria

1. WHEN implementing persistence THEN the system SHALL extend existing EditorEngine and managers
2. WHEN storing project data THEN the system SHALL integrate with existing FilesManager and CanvasManager
3. WHEN managing sandbox THEN the system SHALL use existing SandboxManager and V1 API endpoints
4. WHEN handling UI state THEN the system SHALL work with existing StateManager and components
5. WHEN parsing files THEN the system SHALL extend existing file-parser.ts functionality
6. WHEN managing authentication THEN the system SHALL integrate with existing auth schema and better-auth

### Requirement 12: Backward Compatibility

**User Story:** As a developer, I want to maintain compatibility with existing code and APIs, so that I don't break current functionality.

#### Acceptance Criteria

1. WHEN adding new database tables THEN the system SHALL not modify existing auth tables
2. WHEN implementing new APIs THEN the system SHALL maintain existing V1 sandbox endpoints
3. WHEN updating MobX stores THEN the system SHALL preserve existing manager interfaces
4. WHEN adding persistence THEN the system SHALL not break existing project components
5. WHEN extending functionality THEN the system SHALL maintain existing module structure

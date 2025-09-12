# Implementation Plan

## Phase 1: Database Schema Extension

- [x] 1. Extend existing database schema with projects table

  - Add projects table to existing `fignna/lib/db/schema.ts` with JSONB fields
  - Add projectVersions table for optional version history
  - Add relations linking to existing user table
  - Create database migration using drizzle-kit
  - _Requirements: 1.1, 1.2, 1.6_

- [x] 2. Create database queries for project operations

  - Add projectQueries to `fignna/lib/db/queries.ts` (if it doesn't exist, create it)
  - Implement CRUD operations with JSONB field handling
  - Add version management queries for project history
  - Create efficient queries for project listing and file retrieval
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Update database connection and types

  - Extend `fignna/lib/db/index.ts` with new project types
  - Add TypeScript interfaces for Project and ProjectVersion
  - Create Zod schemas for validation
  - Test database connection with new schema
  - _Requirements: 1.4, 10.2_

## Phase 2: API Routes Implementation

- [x] 4. Create project management API routes

  - Create `fignna/app/api/v1/projects/route.ts` for GET (list) and POST (create)
  - Create `fignna/app/api/v1/projects/[id]/route.ts` for GET, PUT, DELETE operations
  - Implement JSON file storage and retrieval with proper validation
  - Add error handling and response formatting consistent with V1 API
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.3_

- [x] 5. Create project synchronization endpoints

  - Create `fignna/app/api/v1/projects/[id]/sync/route.ts` for sandbox sync
  - Integrate with existing V1 sandbox API endpoints
  - Implement file extraction from JSONB and push to E2B sandbox
  - Add dependency installation coordination with sandbox
  - _Requirements: 6.1, 6.3, 6.6, 11.3_

- [x] 6. Add version management endpoints (optional)

  - Create `fignna/app/api/v1/projects/[id]/versions/route.ts`
  - Implement version snapshot creation and retrieval
  - Add version restoration functionality
  - Create version comparison utilities
  - _Requirements: 7.1, 7.4, 7.5_

## Phase 3: MobX Store Extensions

- [x] 7. Create ProjectsManager for the EditorEngine

  - Create `fignna/lib/stores/editor/projects/index.ts`
  - Implement project loading, saving, and state management
  - Add integration with existing FilesManager and SandboxManager
  - Create project list management and current project tracking
  - _Requirements: 11.1, 11.2, 8.1_

- [x] 8. Extend existing FilesManager for persistence

  - Update `fignna/lib/stores/editor/files/index.ts`
  - Add database synchronization methods to existing file operations
  - Implement auto-save functionality with debouncing
  - Add dirty state tracking and save status indicators
  - _Requirements: 3.1, 3.2, 3.4, 8.2, 11.2_

- [x] 9. Update EditorEngine to include ProjectsManager

  - Modify `fignna/lib/stores/editor/index.ts`
  - Add ProjectsManager to existing manager composition
  - Update initialization and disposal methods
  - Ensure proper MobX observable setup
  - _Requirements: 11.1, 11.4_

- [x] 10. Extend SandboxManager for project integration
  - Update `fignna/lib/stores/editor/sandbox.ts`
  - Add project file synchronization methods
  - Integrate with existing V1 API calls
  - Add project-specific sandbox state management
  - _Requirements: 6.1, 6.2, 6.5, 11.3_

## Phase 4: UI Integration

- [ ] 11. Update project page to use persistence

  - Modify `fignna/app/project/page.tsx` to load projects from database
  - Replace mock project data with real project loading
  - Add project creation and selection functionality
  - Integrate with existing EditorProvider and MobX stores
  - _Requirements: 11.4, 11.5_

- [ ] 12. Add project management UI components

  - Create project list component in `fignna/modules/projects/`
  - Add project creation modal or form
  - Create project settings and metadata editing
  - Add save status indicators and auto-save feedback
  - _Requirements: 2.1, 2.5, 8.2_

- [ ] 13. Integrate with existing TopRibbon component
  - Update `fignna/modules/project/project/common/top-ribbon/index.tsx`
  - Add project name editing with database persistence
  - Add save status and version information display
  - Integrate project actions (save, duplicate, delete)
  - _Requirements: 11.4, 7.3_

## Phase 5: File Operations Integration

- [ ] 14. Update code editor for persistence

  - Modify code editor components in `fignna/modules/project/code-editor/`
  - Integrate file operations with database storage
  - Add auto-save indicators and manual save options
  - Update file tree to reflect database-stored files
  - _Requirements: 3.1, 3.2, 3.4, 11.2_

- [ ] 15. Enhance file parser for layer tree generation
  - Extend `fignna/modules/project/file-parser.ts`
  - Add React component parsing for layer tree generation
  - Implement real-time layer tree updates from file changes
  - Create component hierarchy extraction from TSX files
  - _Requirements: 5.1, 5.2, 5.3, 11.5_

## Phase 6: Sandbox Integration

- [ ] 16. Connect project persistence with sandbox lifecycle

  - Update sandbox creation to use project files from database
  - Implement project restoration when sandbox expires
  - Add automatic project sync when sandbox is recreated
  - Integrate with existing V1 sandbox status monitoring
  - _Requirements: 6.2, 6.3, 6.4, 11.3_

- [ ] 17. Add dependency management integration
  - Implement package.json dependency tracking in database
  - Add automatic dependency installation in sandbox
  - Create dependency conflict resolution
  - Integrate with existing sandbox package management
  - _Requirements: 6.5, 3.5_

## Phase 7: Performance Optimization

- [ ] 18. Implement efficient JSONB operations

  - Add PostgreSQL JSONB indexing for file path queries
  - Implement partial JSON updates for large projects
  - Add query optimization for project loading
  - Create efficient file change detection
  - _Requirements: 8.1, 8.3, 8.5_

- [ ] 19. Add caching and optimization
  - Implement project caching in MobX stores
  - Add debounced auto-save to prevent excessive database writes
  - Create efficient file diff algorithms
  - Add memory management for large projects
  - _Requirements: 8.2, 8.4_

## Phase 8: Error Handling & Recovery

- [ ] 20. Implement comprehensive error handling

  - Add database operation retry mechanisms
  - Create graceful degradation when database is unavailable
  - Implement local storage backup for critical data
  - Add error reporting and user feedback
  - _Requirements: 10.1, 10.4, 10.5_

- [ ] 21. Add data validation and integrity checks
  - Implement JSONB schema validation at API level
  - Add data integrity checks for file operations
  - Create automatic backup before major operations
  - Implement recovery from corrupted project states
  - _Requirements: 10.2, 10.4_

## Phase 9: Testing & Quality Assurance

- [ ] 22. Create unit tests for new functionality

  - Test database operations and JSONB handling
  - Test MobX store extensions and project management
  - Test API endpoints with existing V1 API compatibility
  - Test file operations and persistence integration
  - _Requirements: All requirements validation_

- [ ] 23. Add integration tests
  - Test complete project lifecycle (create, edit, save, load)
  - Test sandbox integration with project persistence
  - Test concurrent operations and data consistency
  - Test error scenarios and recovery mechanisms
  - _Requirements: 8.4, 9.1, 10.1_

## Phase 10: Documentation & Migration

- [ ] 24. Create database migration scripts

  - Create Drizzle migration for new tables
  - Add data migration utilities if needed
  - Create rollback procedures for schema changes
  - Test migration on development and staging environments
  - _Requirements: 1.1, 12.1_

- [ ] 25. Update documentation and deployment
  - Update API documentation to include new project endpoints
  - Create developer guides for project persistence
  - Update deployment scripts for database migrations
  - Create monitoring and alerting for new functionality
  - _Requirements: 11.6, 12.2_

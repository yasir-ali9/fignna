# Design Document

## Overview

This design implements a robust sandbox timeout management system that replaces the current simple `sandbox_id` and `preview_url` columns with a rich `sandbox_info` JSONB structure. The solution introduces intelligent sandbox lifecycle tracking through a status API that prevents unnecessary sandbox creation and optimizes resource usage.

The core innovation is the shift from reactive sandbox management (always creating new sandboxes) to proactive timeout tracking (checking if existing sandboxes are still valid before creating new ones).

## Architecture

### Database Schema Changes

The project table will be modified to replace the current sandbox tracking columns:

**Current Schema:**

```sql
sandboxId: text("sandbox_id")
previewUrl: text("preview_url")
```

**New Schema:**

```sql
sandboxInfo: jsonb("sandbox_info").$type<{
  sandbox_id: string;
  preview_url: string;
  start_time: string; // ISO timestamp
  end_time: string;   // ISO timestamp
}>()
```

### API Architecture

The system introduces a centralized status API that acts as the intelligent coordinator for all sandbox operations:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Status API     │    │   E2B Sandbox   │
│   (Project Page)│────│   (Coordinator)  │────│   (Remote)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └──────────────│   Database       │─────────────┘
                        │   (sandbox_info) │
                        └──────────────────┘
```

### Status API Flow

The status API implements a decision tree for sandbox management:

```
Status API Called
       │
       ▼
┌─────────────────┐
│ Get sandbox_info│
│ from database   │
└─────────────────┘
       │
       ▼
┌─────────────────┐      YES    ┌─────────────────┐
│ end_time >      │─────────────▶│ Call E2B        │
│ current_time?   │              │ getInfo()       │
└─────────────────┘              └─────────────────┘
       │ NO                              │
       ▼                                 ▼
┌─────────────────┐              ┌─────────────────┐
│ Return          │              │ Update end_time │
│ "expired"       │              │ in database     │
└─────────────────┘              └─────────────────┘
                                         │
                                         ▼
                                 ┌─────────────────┐
                                 │ Return          │
                                 │ "running"       │
                                 └─────────────────┘
```

## Components and Interfaces

### 1. Database Migration Component

**Purpose:** Safely migrate existing projects from old schema to new schema

**Interface:**

```typescript
interface MigrationService {
  migrateProjects(): Promise<void>;
  validateMigration(): Promise<boolean>;
  rollbackMigration(): Promise<void>;
}
```

**Implementation Strategy:**

- Add new `sandbox_info` column as nullable initially
- Migrate existing data: `{sandbox_id: old_sandbox_id, preview_url: old_preview_url, start_time: created_at, end_time: created_at + 30min}`
- Update all API references
- Remove old columns after validation

### 2. Enhanced Status API Component

**Purpose:** Intelligent sandbox lifecycle management

**Interface:**

```typescript
interface StatusAPIResponse {
  success: boolean;
  status: "running" | "expired" | "not_found";
  sandbox_info?: {
    sandbox_id: string;
    preview_url: string;
    start_time: string;
    end_time: string;
    remaining_time_minutes: number;
  };
  action_required: "none" | "sync_needed";
}
```

**Core Logic:**

```typescript
async function checkSandboxStatus(
  projectId: string,
  userId: string
): Promise<StatusAPIResponse> {
  // 1. Get sandbox_info from database
  const project = await projectQueries.getById(projectId, userId);

  if (!project.sandboxInfo) {
    return { status: "not_found", action_required: "sync_needed" };
  }

  const { end_time, sandbox_id } = project.sandboxInfo;
  const currentTime = new Date();
  const endTime = new Date(end_time);

  // 2. Check if sandbox should still be running
  if (endTime <= currentTime) {
    return { status: "expired", action_required: "sync_needed" };
  }

  // 3. Verify with E2B that sandbox is actually running
  try {
    const sandboxInfo = await e2b.getInfo(sandbox_id);

    // 4. Update database with actual end time from E2B
    await projectQueries.updateSandboxInfo(projectId, userId, {
      end_time: sandboxInfo.endAt,
    });

    return {
      status: "running",
      sandbox_info: {
        ...project.sandboxInfo,
        end_time: sandboxInfo.endAt,
        remaining_time_minutes: Math.floor(
          (new Date(sandboxInfo.endAt) - currentTime) / 60000
        ),
      },
      action_required: "none",
    };
  } catch (error) {
    // Sandbox not found in E2B, mark as expired
    return { status: "expired", action_required: "sync_needed" };
  }
}
```

### 3. Updated Sync API Component

**Purpose:** Create sandboxes only when needed and update complete sandbox_info

**Enhanced Functionality:**

- Only create sandbox if status API indicates it's needed
- Store complete timing information in sandbox_info
- Return structured response for frontend consumption

**Interface Changes:**

```typescript
// Before sync, check status
const statusResult = await checkSandboxStatus(projectId, userId);
if (statusResult.status === "running") {
  return {
    success: true,
    message: "Sandbox already running",
    ...statusResult.sandbox_info,
  };
}

// Proceed with sync only if needed
const sandbox = await createE2BSandbox();
const sandboxInfo = {
  sandbox_id: sandbox.id,
  preview_url: sandbox.url,
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
};

await projectQueries.updateSandboxInfo(projectId, userId, sandboxInfo);
```

### 4. Frontend Integration Component

**Purpose:** Coordinate status checks and sandbox operations

**Periodic Status Checking:**

```typescript
class SandboxStatusManager {
  private statusInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 minute (60 seconds)

  async startStatusChecking(projectId: string) {
    // Initial status check
    await this.checkAndUpdateStatus(projectId);

    // Start periodic checks
    this.statusInterval = setInterval(async () => {
      const status = await this.checkAndUpdateStatus(projectId);
      if (status.status === "expired") {
        this.stopStatusChecking();
        // Trigger sync if user is still active
        await this.handleExpiredSandbox(projectId);
      }
    }, this.CHECK_INTERVAL);
  }

  private async checkAndUpdateStatus(projectId: string) {
    const response = await fetch(
      `/api/v1/projects/${projectId}/sandbox/status`
    );
    const status = await response.json();

    // Update UI with current status
    this.updateSandboxUI(status);

    return status;
  }
}
```

## Data Models

### SandboxInfo Type Definition

```typescript
interface SandboxInfo {
  sandbox_id: string;
  preview_url: string;
  start_time: string; // ISO 8601 timestamp
  end_time: string; // ISO 8601 timestamp
}

interface SandboxInfoWithMetadata extends SandboxInfo {
  remaining_time_minutes: number;
  status: "running" | "expired" | "not_found";
  last_checked: string;
}
```

### Database Schema Update

```typescript
// Updated project schema
export const project = pgTable("project", {
  // ... existing fields
  sandboxInfo: jsonb("sandbox_info").$type<SandboxInfo>(),
  // Remove: sandboxId and previewUrl columns
});
```

### API Response Models

```typescript
interface StatusAPIResponse {
  success: boolean;
  status: "running" | "expired" | "not_found";
  sandbox_info?: SandboxInfoWithMetadata;
  action_required: "none" | "sync_needed";
  message: string;
}

interface SyncAPIResponse {
  success: boolean;
  data: {
    projectId: string;
    sandbox_info: SandboxInfo;
    filesCount: number;
    version: number;
  };
  message: string;
}
```

## Error Handling

### Database Migration Errors

- **Rollback Strategy:** Keep old columns until migration is fully validated
- **Data Integrity:** Validate all migrated records before removing old columns
- **Fallback Mechanism:** If migration fails, system falls back to old schema temporarily

### E2B API Errors

- **Timeout Handling:** If E2B getInfo() fails, assume sandbox is expired
- **Rate Limiting:** Implement exponential backoff for E2B API calls
- **Network Issues:** Cache last known status for up to 5 minutes during network issues

### Status API Error Scenarios

```typescript
try {
  const sandboxInfo = await e2b.getInfo(sandbox_id);
  // Success path
} catch (error) {
  if (error.code === "SANDBOX_NOT_FOUND") {
    return { status: "expired", action_required: "sync_needed" };
  } else if (error.code === "RATE_LIMITED") {
    // Return cached status if available
    return (
      getCachedStatus(projectId) || {
        status: "unknown",
        action_required: "retry_later",
      }
    );
  } else {
    // Network or other errors
    throw new Error(`Status check failed: ${error.message}`);
  }
}
```

## Testing Strategy

### Unit Tests

- **Database Operations:** Test sandbox_info CRUD operations
- **Status Logic:** Test timeout calculation and decision logic
- **Migration:** Test data migration accuracy and rollback

### Integration Tests

- **API Workflow:** Test complete status → sync → status cycle
- **E2B Integration:** Test actual E2B getInfo() calls and error handling
- **Frontend Integration:** Test periodic status checking and UI updates

### End-to-End Tests

- **Sandbox Lifecycle:** Create project → sync → wait for timeout → verify expiration
- **User Journey:** Test complete user workflow from project creation to sandbox expiration
- **Error Recovery:** Test system behavior during E2B outages

### Performance Tests

- **Database Performance:** Test JSONB query performance vs. separate columns
- **API Response Times:** Ensure status API responds within 500ms
- **Concurrent Users:** Test system behavior with multiple users checking status simultaneously

## Migration Strategy

### Phase 1: Schema Addition (Non-Breaking)

1. Add `sandbox_info` JSONB column as nullable
2. Update APIs to write to both old and new columns
3. Deploy and monitor for issues

### Phase 2: Data Migration (Background)

1. Run migration script to populate `sandbox_info` from existing data
2. Validate migrated data integrity
3. Update APIs to read from `sandbox_info` with fallback to old columns

### Phase 3: Cleanup (Breaking)

1. Update all APIs to use only `sandbox_info`
2. Remove old `sandbox_id` and `preview_url` columns
3. Update frontend to use new API responses

### Rollback Plan

- Keep old columns until Phase 3 is complete
- Maintain dual-write capability during migration
- Implement feature flag to switch between old and new logic

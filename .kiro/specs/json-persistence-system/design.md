# JSON-Based Persistence System Design

## Overview

This document outlines the technical design for extending the existing fignna project with JSON-based file storage. The design builds on the current auth schema, V1 sandbox API, and MobX architecture to add project persistence while maintaining compatibility with existing code.

## Architecture

### Database Schema Extension

Building on your existing `fignna/lib/db/schema.ts`, add:

```typescript
// Add to existing schema.ts
export const projects = pgTable("projects", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),

  // Link to existing user table
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // File Storage (JSONB for performance)
  files: jsonb("files").$type<Record<string, string>>().notNull().default({}),

  // Sandbox Integration (compatible with existing V1 API)
  sandboxId: text("sandbox_id"), // Links to E2B sandbox
  previewUrl: text("preview_url"), // Live preview URL
  
  // Versioning (simple approach)
  version: integer("version").default(1),
  lastSavedAt: timestamp("last_saved_at").defaultNow(),

  // Status
  isActive: boolean("is_active").default(true),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Optional: Simple version history
export const projectVersions = pgTable("project_versions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),

  // Snapshot data
  files: jsonb("files").$type<Record<string, string>>().notNull(),
  dependencies: jsonb("dependencies")
    .$type<Record<string, string>>()
    .default({}),

  // Version metadata
  version: integer("version").notNull(),
  message: text("message"), // Optional commit message
  changeType: text("change_type")
    .$type<"manual" | "ai_generated" | "auto_save">()
    .default("manual"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add relations
export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(user, {
    fields: [projects.userId],
    references: [user.id],
  }),
  versions: many(projectVersions),
}));

export const projectVersionsRelations = relations(
  projectVersions,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectVersions.projectId],
      references: [projects.id],
    }),
  })
);
```

### API Routes Structure

Extend existing `/api/v1/` structure:

```
/api/v1/projects/
├── GET     /           # List user projects
├── POST    /           # Create new project
├── GET     /:id        # Get project with files
├── PUT     /:id        # Update project files
├── DELETE  /:id        # Delete project
└── POST    /:id/sync   # Sync project to sandbox

/api/v1/projects/:id/versions/
├── GET     /           # Get version history
├── POST    /           # Create version snapshot
└── POST    /:versionId/restore # Restore version
```

## Components and Interfaces

### Enhanced MobX Store Architecture

Extend existing `EditorEngine` in `fignna/lib/stores/editor/index.ts`:

```typescript
export class EditorEngine {
  // Existing managers
  canvas: CanvasManager;
  elements: ElementsManager;
  frames: FramesManager;
  state: StateManager;
  ai: AIManager;
  sandbox: SandboxManager;
  files: FilesManager;

  // New additions
  projects: ProjectsManager; // New manager for project persistence

  // Current project state
  currentProject: Project | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  constructor() {
    // ... existing initialization
    this.projects = new ProjectsManager(this); // Add new manager
    makeAutoObservable(this);
  }
}
```

### New ProjectsManager

```typescript
// Add to fignna/lib/stores/editor/projects/index.ts
export class ProjectsManager {
  private engine: EditorEngine;

  // Project list and current project
  projects: Project[] = [];
  currentProject: Project | null = null;

  // Loading states
  isLoading: boolean = false;
  isSaving: boolean = false;
  error: string | null = null;

  constructor(engine: EditorEngine) {
    this.engine = engine;
    makeAutoObservable(this);
  }

  // Load project and sync with existing managers
  async loadProject(projectId: string) {
    this.isLoading = true;
    try {
      const project = await this.fetchProject(projectId);
      this.currentProject = project;

      // Sync with existing managers
      this.engine.files.setFiles(project.files);
      this.engine.sandbox.updateSandboxInfo(
        project.sandboxId,
        project.previewUrl
      );

      this.isLoading = false;
    } catch (error) {
      this.error = error.message;
      this.isLoading = false;
    }
  }

  // Save current state to database
  async saveProject() {
    if (!this.currentProject) return;

    this.isSaving = true;
    try {
      const updatedProject = await this.updateProject(this.currentProject.id, {
        files: this.engine.files.getAllFiles(),
        dependencies: this.engine.files.getDependencies(),
        sandboxId: this.engine.sandbox.currentSandboxId,
        previewUrl: this.engine.sandbox.previewUrl,
        version: this.currentProject.version + 1,
        lastSavedAt: new Date(),
      });

      this.currentProject = updatedProject;
      this.isSaving = false;
    } catch (error) {
      this.error = error.message;
      this.isSaving = false;
    }
  }
}
```

### Enhanced FilesManager

Extend existing `fignna/lib/stores/editor/files/index.ts`:

```typescript
export class FilesManager {
  // Existing properties...

  // Add persistence methods
  async syncToDatabase() {
    if (this.engine.projects.currentProject) {
      await this.engine.projects.saveProject();
    }
  }

  // Override existing methods to trigger auto-save
  updateFile(path: string, content: string) {
    // Existing logic...
    this.markDirty();
    this.debouncedSave(); // Add auto-save
  }

  private debouncedSave = debounce(() => {
    this.syncToDatabase();
  }, 2000); // Auto-save after 2 seconds of inactivity
}
```

## Data Models

### Core Types

```typescript
// Add to fignna/lib/types/index.ts
export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;

  // File storage
  files: Record<string, string>; // path -> content
  dependencies: Record<string, string>; // package.json deps

  // Sandbox integration
  sandboxId?: string;
  previewUrl?: string;

  // Versioning
  version: number;
  lastSavedAt: Date;

  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectVersion {
  id: string;
  projectId: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  version: number;
  message?: string;
  changeType: "manual" | "ai_generated" | "auto_save";
  createdAt: Date;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  template?: "react" | "nextjs" | "vite"; // Default templates
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  files?: Record<string, string>;
  dependencies?: Record<string, string>;
}
```

## Integration with Existing Systems

### Sandbox Integration

Extend existing `SandboxManager` to work with project persistence:

```typescript
// In fignna/lib/stores/editor/sandbox.ts
export class SandboxManager {
  // Existing properties...

  // Add project sync methods
  async syncProjectToSandbox(project: Project) {
    // Use existing V1 API
    await fetch("/api/v1/sandbox/create", { method: "POST" });

    // Sync files to sandbox
    for (const [path, content] of Object.entries(project.files)) {
      await this.writeFileToSandbox(path, content);
    }

    // Install dependencies
    if (Object.keys(project.dependencies).length > 0) {
      await this.installDependencies(project.dependencies);
    }
  }
}
```

### File Parser Integration

Extend existing `fignna/modules/project/file-parser.ts`:

```typescript
// Add methods for layer tree parsing
export function parseFilesToLayerTree(
  files: Record<string, string>
): LayerNode[] {
  const layerTree: LayerNode[] = [];

  // Parse TSX files to extract component hierarchy
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith(".tsx") || path.endsWith(".jsx")) {
      const components = parseReactComponents(content);
      layerTree.push(
        ...components.map((comp) => ({
          id: `${path}:${comp.name}`,
          name: comp.name,
          type: "component",
          filePath: path,
          children: comp.children || [],
        }))
      );
    }
  });

  return layerTree;
}
```

## Error Handling

### Database Operations

```typescript
// Add to fignna/lib/db/queries.ts
export const projectQueries = {
  async create(data: CreateProjectRequest, userId: string): Promise<Project> {
    try {
      const [project] = await db
        .insert(projects)
        .values({
          ...data,
          userId,
          files: getDefaultProjectFiles(data.template),
          dependencies: getDefaultDependencies(data.template),
        })
        .returning();

      return project;
    } catch (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  },

  async update(id: string, data: UpdateProjectRequest): Promise<Project> {
    try {
      const [project] = await db
        .update(projects)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(projects.id, id))
        .returning();

      if (!project) {
        throw new Error("Project not found");
      }

      return project;
    } catch (error) {
      throw new Error(`Failed to update project: ${error.message}`);
    }
  },
};
```

## Testing Strategy

### Unit Tests

- Project CRUD operations
- File operations with JSON storage
- MobX store state management
- Database query functions

### Integration Tests

- API endpoints with existing V1 routes
- Sandbox synchronization
- File parsing and layer tree generation

This design maintains compatibility with your existing architecture while adding the essential persistence layer for projects and files.

# New Code Editor

This is the new code editor built from scratch for Fignna's database-first architecture.

## Architecture

**Database-First Flow:**

```
Editor → tRPC → Database → Daytona Sync → Preview Update
```

## Features

### Core Editor

- ✅ **CodeMirror 6** - Modern, performant editor
- ✅ **Database Integration** - Files loaded from/saved to NeonDB via tRPC
- ✅ **Real-time Sync** - Changes sync to Daytona sandbox automatically
- ✅ **File Management** - Create, edit, delete, rename files
- ✅ **Agent Ready** - Built for AI agent file operations

### File Management

- ✅ **File Explorer** - Hierarchical file tree from database
- ✅ **Tabbed Interface** - Multiple files open simultaneously
- ✅ **Auto-save** - Debounced saves to database
- ✅ **Dirty State** - Visual indicators for unsaved changes

### Integration

- ✅ **MobX State** - Centralized state management via FilesManager
- ✅ **tRPC API** - Type-safe database operations
- ✅ **Sandbox Sync** - Real-time preview updates
- ✅ **Agent Support** - Batch operations for AI agents

## Components

```
code-editor/
├── file-explorer/          # File tree and navigation
├── editor-tabs/           # Tab management
├── editor-core/           # CodeMirror editor
├── file-operations/       # Create, delete, rename modals
└── index.tsx             # Main code editor component
```

## Usage

```tsx
import { CodeEditor } from "@/components/code-editor";

<CodeEditor projectId={projectId} />;
```

The editor automatically:

1. Loads files from database via tRPC
2. Manages file tree and tabs via MobX FilesManager
3. Syncs changes to database and sandbox
4. Updates preview in real-time

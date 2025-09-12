# V1 API Documentation

This document describes the V1 API endpoints for sandbox management in the Vite React application.

## Overview

The V1 API provides endpoints for creating and managing E2B sandboxes specifically designed for Vite React projects. These endpoints use global state management for sandbox lifecycle.

## Base URL

```
/api/v1/
```

## Endpoints

### POST /api/v1/sandbox/create

Creates a new E2B sandbox for Vite React projects using global state management.

#### Request Body

No request body required 

#### Response

**Success (200)**

```json
{
  "success": true,
  "sandboxId": "sandbox_id",
  "url": "https://sandbox-host.e2b.dev",
  "message": "Vite React sandbox created and initialized successfully",
  "version": "v1"
}
```

**Error (500)**

```json
{
  "success": false,
  "error": "Failed to create Vite React sandbox",
  "details": "Error details",
  "version": "v1"
}
```

#### Features

- Creates E2B sandbox with 30-minute timeout
- Automatically kills existing sandbox before creating new one
- Sets up complete Vite React project with TypeScript and Tailwind CSS
- Installs all dependencies automatically
- Uses Python scripts for efficient file creation
- Stores sandbox state globally for quick access
- Creates beautiful default landing page

#### Project Structure Created

```
/home/user/app/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
└── src/
    ├── App.tsx
    ├── main.tsx
    └── index.css
```

### POST /api/v1/sandbox/kill

Destroys the active E2B sandbox and clears global state.

#### Request Body

No request body required - operates on global active sandbox.

#### Response

**Success (200)**

```json
{
  "success": true,
  "message": "Sandbox destroyed successfully",
  "sandboxId": "sandbox_id",
  "version": "v1"
}
```

**Error (404)**

```json
{
  "success": false,
  "error": "No active sandbox to destroy",
  "version": "v1"
}
```

**Error (500)**

```json
{
  "success": false,
  "error": "Failed to destroy sandbox",
  "details": "Error details",
  "version": "v1"
}
```

### GET /api/v1/sandbox/status

Checks the status of the active sandbox.

#### Query Parameters

None required - checks global sandbox state.

#### Response

**Success (200) - Active Sandbox**

```json
{
  "success": true,
  "status": "active",
  "sandbox": {
    "id": "sandbox_id",
    "host": "sandbox-host.e2b.dev",
    "url": "https://sandbox-host.e2b.dev",
    "status": "ready",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "filesTracked": ["src/App.jsx", "src/main.jsx"],
    "lastHealthCheck": "2024-01-15T10:35:00.000Z"
  },
  "message": "Sandbox is active and healthy",
  "version": "v1"
}
```

**Success (200) - No Sandbox**

```json
{
  "success": true,
  "status": "no_sandbox",
  "message": "No active sandbox",
  "version": "v1"
}
```

**Success (200) - Unhealthy Sandbox**

```json
{
  "success": true,
  "status": "unhealthy",
  "message": "Sandbox exists but is not responding",
  "version": "v1"
}
```

### GET /api/v1/sandbox/logs/sandbox

Retrieves real-time system logs from the active sandbox, including process status, memory usage, disk space, and port availability.

#### Query Parameters

None required - operates on global active sandbox.

#### Response

**Success (200)**

```json
{
  "success": true,
  "hasErrors": false,
  "logs": [
    "Vite dev server is running",
    "Process: user 1234 0.5 2.1 ...",
    "Memory status: 1.2G available",
    "Disk usage: 45% used",
    "Port 5173 is active"
  ],
  "status": "running",
  "processCount": 1,
  "version": "v1"
}
```

**Error (404)**

```json
{
  "success": false,
  "error": "No active sandbox",
  "version": "v1"
}
```

### GET /api/v1/sandbox/logs/project

Monitors Vite React project for build errors, TypeScript errors, missing dependencies, and warnings.

#### Query Parameters

None required - operates on global active sandbox.

#### Response

**Success (200)**

```json
{
  "success": true,
  "hasErrors": true,
  "hasWarnings": false,
  "errors": [
    {
      "type": "npm-missing",
      "package": "lodash",
      "message": "Module not found: Can't resolve 'lodash'",
      "file": "Unknown"
    },
    {
      "type": "typescript",
      "message": "Property 'foo' does not exist on type 'Bar'",
      "file": "Unknown"
    }
  ],
  "warnings": [],
  "errorCount": 2,
  "warningCount": 0,
  "version": "v1"
}
```

**Error (404)**

```json
{
  "success": false,
  "error": "No active sandbox",
  "version": "v1"
}
```

## Global State Management

The V1 API uses global variables to manage sandbox state:

- `global.activeSandbox`: The active E2B sandbox instance
- `global.sandboxData`: Metadata about the current sandbox
- `global.existingFiles`: Set tracking created files


## Error Handling

All endpoints follow consistent error handling patterns:

- **404 Not Found**: No active sandbox when one is expected
- **500 Internal Server Error**: Server-side errors with detailed messages

Error responses include:

- `success`: Always false for errors
- `error`: Human-readable error message
- `details`: Technical error details (when available)
- `version`: API version for debugging

## Usage Examples

### Creating a Sandbox

```javascript
const response = await fetch("/api/v1/sandbox/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
});

const data = await response.json();
if (data.success) {
  console.log("Sandbox created:", data.sandbox.url);
  // Navigate to sandbox URL or embed in iframe
}
```

### Destroying a Sandbox

```javascript
const response = await fetch("/api/v1/sandbox/kill", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
});

const data = await response.json();
if (data.success) {
  console.log("Sandbox destroyed:", data.sandboxId);
}
```

### Checking Sandbox Status

```javascript
const response = await fetch("/api/v1/sandbox/status");
const data = await response.json();

if (data.status === "active") {
  console.log("Active sandbox:", data.sandbox.url);
  console.log("Files tracked:", data.sandbox.filesTracked.length);
} else if (data.status === "unhealthy") {
  console.log("Sandbox exists but unhealthy");
} else {
  console.log("No active sandbox");
}
```

## Implementation Notes

- Uses E2B Code Interpreter with direct API integration
- Creates complete Vite React setup with modern tooling
- Implements automatic cleanup and error recovery
- Uses Python scripts for efficient file operations
- Supports 30-minute sandbox sessions
- Includes beautiful default UI with Tailwind CSS
- Lightning-fast development with Vite's HMR
- No database dependencies - pure in-memory state

## Project Management Endpoints

### GET /api/v1/projects

Lists all projects for the authenticated user with pagination support.

#### Query Parameters

- `limit` (optional): Number of projects to return (default: 50, max: 100)
- `offset` (optional): Number of projects to skip (default: 0)

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project-uuid",
        "name": "My React App",
        "description": "A sample React application",
        "files": {},
        "sandboxId": "sandbox-id",
        "previewUrl": "https://sandbox.e2b.dev",
        "version": 1,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:35:00.000Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1
    }
  },
  "message": "Projects retrieved successfully",
  "version": "v1"
}
```

### POST /api/v1/projects

Creates a new project for the authenticated user.

#### Request Body

```json
{
  "name": "My New Project",
  "description": "Optional project description"
}
```

#### Response

**Success (201)**

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "project-uuid",
      "name": "My New Project",
      "description": "Optional project description",
      "files": {},
      "version": 1,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Project created successfully",
  "version": "v1"
}
```

### GET /api/v1/projects/[id]

Retrieves a specific project by ID.

### PUT /api/v1/projects/[id]

Updates project metadata (name, description).

### DELETE /api/v1/projects/[id]

Soft deletes a project (marks as inactive).

### PUT /api/v1/projects/[id]/files

Updates project files with JSONB storage.

### GET /api/v1/projects/[id]/files

Retrieves only the files for a specific project.

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "id": "project-uuid",
    "files": {
      "src/App.jsx": "import React from 'react'...",
      "package.json": "{\n  \"name\": \"my-app\"..."
    },
    "version": 3
  },
  "message": "Project files retrieved successfully",
  "version": "v1"
}
```

### PUT /api/v1/projects/[id]/files

Updates project files with JSONB storage and creates automatic version snapshot.

#### Request Body

```json
{
  "files": {
    "src/App.jsx": "import React from 'react'...",
    "src/NewComponent.jsx": "export default function NewComponent() {...}"
  }
}
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "projectId": "project-uuid",
    "version": 4,
    "lastSavedAt": "2024-01-15T10:35:00.000Z",
    "fileCount": 2
  },
  "message": "Project files updated successfully",
  "version": "v1"
}
```

### POST /api/v1/projects/[id]/sync

Synchronizes project files to a live E2B sandbox. Creates basic React app structure if project has no files.

#### Features

- Extracts files from database JSONB storage
- Creates new E2B sandbox with 30-minute timeout
- Writes all project files to sandbox filesystem
- Installs npm dependencies automatically
- Starts development server (Vite/Next.js auto-detected)
- Creates version snapshot for scaffolded projects
- Updates project with sandbox ID and preview URL

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "projectId": "project-uuid",
    "sandboxId": "sandbox-id",
    "previewUrl": "https://sandbox.e2b.dev",
    "filesCount": 7,
    "version": 2
  },
  "message": "Project synchronized to sandbox successfully",
  "version": "v1"
}
```

**Error (400) - No Files**

```json
{
  "success": false,
  "error": "No files found in project",
  "version": "v1"
}
```

#### Auto-Scaffolding

When a project has no files, the sync endpoint automatically creates:

```
/home/user/app/
├── package.json (React + Vite dependencies)
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx (React entry point)
    ├── App.jsx (Welcome component)
    ├── App.css
    └── index.css
```

## Version Management Endpoints

### GET /api/v1/projects/[id]/versions

Lists version history for a project with pagination.

#### Query Parameters

- `limit` (optional): Number of versions to return (default: 20, max: 100)
- `offset` (optional): Number of versions to skip (default: 0)

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "version-uuid",
        "projectId": "project-uuid",
        "version": 3,
        "message": "Added new component",
        "changeType": "manual",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "count": 1
    }
  },
  "message": "Project versions retrieved successfully",
  "version": "v1"
}
```

### POST /api/v1/projects/[id]/versions

Creates a version snapshot of the current project state.

#### Request Body

```json
{
  "files": {},
  "dependencies": {},
  "message": "Manual version snapshot",
  "changeType": "manual"
}
```

#### Response

**Success (201)**

```json
{
  "success": true,
  "data": {
    "version": {
      "id": "version-uuid",
      "projectId": "project-uuid",
      "version": 4,
      "message": "Manual version snapshot",
      "changeType": "manual",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Version snapshot created successfully",
  "version": "v1"
}
```

### GET /api/v1/projects/[id]/versions/[versionId]

Retrieves a specific version with full file content.

### POST /api/v1/projects/[id]/versions/[versionId]/restore

Restores the project to a specific version state.

### POST /api/v1/projects/[id]/versions/compare

Compares two versions and returns file differences.

#### Request Body

```json
{
  "fromVersionId": "version-uuid-1",
  "toVersionId": "version-uuid-2"
}
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "fromVersion": {
      "id": "version-uuid-1",
      "version": 2,
      "message": "Previous version",
      "createdAt": "2024-01-15T10:00:00.000Z"
    },
    "toVersion": {
      "id": "version-uuid-2",
      "version": 3,
      "message": "Current version",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "changes": [
      {
        "path": "src/App.jsx",
        "type": "modified",
        "fromSize": 1024,
        "toSize": 1156
      },
      {
        "path": "src/NewComponent.jsx",
        "type": "added",
        "toSize": 512
      }
    ],
    "statistics": {
      "totalFiles": 2,
      "added": 1,
      "removed": 0,
      "modified": 1,
      "unchanged": 0
    }
  },
  "message": "Version comparison completed successfully",
  "version": "v1"
}
```

### POST /api/v1/projects/[id]/versions/cleanup

Cleans up old versions, keeping only the most recent ones.

#### Request Body

```json
{
  "keepCount": 10
}
```

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "deletedCount": 5,
    "keptCount": 10
  },
  "message": "Cleaned up 5 old versions, kept 10 most recent",
  "version": "v1"
}
```

## Code Generation and AI Endpoints

### POST /api/v1/code/generate

Generates code using AI based on user prompts.

#### Request Body

```json
{
  "prompt": "Create a React component with a button",
  "model": "openai/gpt-4o-mini",
  "context": {
    "sandboxId": "sandbox-id"
  },
  "isEdit": false
}
```

#### Response

**Streaming Response** - Server-Sent Events

```
data: {"type": "stream", "text": "import React from 'react';\n\n"}
data: {"type": "stream", "text": "function Button() {\n"}
data: {"type": "complete", "fullCode": "import React from 'react';\n\nfunction Button() {\n  return <button>Click me</button>;\n}"}
```

### POST /api/v1/code/apply

Applies generated code to the active sandbox.

#### Request Body

```json
{
  "response": "import React from 'react';\n\nfunction Button() {\n  return <button>Click me</button>;\n}",
  "isEdit": false,
  "packages": [],
  "sandboxId": "sandbox-id"
}
```

#### Response

**Streaming Response** - Server-Sent Events

```
data: {"type": "progress", "message": "Creating files..."}
data: {"type": "complete", "results": {"filesCreated": ["src/Button.jsx"]}}
```

### POST /api/v1/code/analyze

Analyzes code or project structure for AI context.

#### Request Body

```json
{
  "code": "import React from 'react';\n\nfunction App() {\n  return <div>Hello World</div>;\n}",
  "type": "component_analysis"
}
```

## File Management Endpoints

### GET /api/v1/sandbox/files/manifest

Retrieves complete file manifest from active sandbox with component analysis.

#### Response

**Success (200)**

```json
{
  "success": true,
  "files": {
    "src/App.jsx": "import React from 'react'...",
    "src/main.jsx": "import React from 'react'...",
    "package.json": "{\n  \"name\": \"my-app\"..."
  },
  "structure": "app/\n  src/\n    App.jsx\n    main.jsx\n  package.json",
  "fileCount": 3,
  "manifest": {
    "files": {
      "/home/user/app/src/App.jsx": {
        "content": "import React from 'react'...",
        "type": "component",
        "path": "/home/user/app/src/App.jsx",
        "relativePath": "src/App.jsx",
        "lastModified": 1642234567890
      }
    },
    "routes": [],
    "componentTree": {},
    "entryPoint": "/home/user/app/src/main.jsx",
    "styleFiles": ["/home/user/app/src/index.css"],
    "timestamp": 1642234567890
  },
  "version": "v1"
}
```

**Error (404)**

```json
{
  "success": false,
  "error": "No active sandbox",
  "version": "v1"
}
```

## Chat Management Endpoints (Project-Scoped)

### GET /api/v1/projects/[id]/chat

Lists all chats for a specific project.

#### Query Parameters

- `limit` (optional): Number of chats to return (default: 50, max: 100)

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "id": "chat-uuid",
        "projectId": "project-uuid",
        "name": "Main Chat",
        "messageCount": 5,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:35:00.000Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "total": 1
    }
  },
  "message": "Project chats retrieved successfully",
  "version": "v1"
}
```

### POST /api/v1/projects/[id]/chat

Creates a new chat in a project.

#### Request Body

```json
{
  "name": "Feature Discussion"
}
```

#### Response

**Success (201)**

```json
{
  "success": true,
  "data": {
    "chat": {
      "id": "chat-uuid",
      "projectId": "project-uuid",
      "name": "Feature Discussion",
      "messageCount": 0,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Chat created successfully",
  "version": "v1"
}
```

### GET /api/v1/projects/[id]/chat/[chatId]

Retrieves a specific chat by ID.

### PUT /api/v1/projects/[id]/chat/[chatId]

Updates chat metadata (name).

#### Request Body

```json
{
  "name": "Updated Chat Name"
}
```

### DELETE /api/v1/projects/[id]/chat/[chatId]

Deletes a chat and all its messages.

## Message Management Endpoints (Chat-Scoped)

### GET /api/v1/projects/[id]/chat/[chatId]/messages

Lists all messages in a chat.

#### Query Parameters

- `limit` (optional): Number of messages to return (default: 50, max: 100)
- `offset` (optional): Number of messages to skip (default: 0)

#### Response

**Success (200)**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message-uuid",
        "chatId": "chat-uuid",
        "role": "user",
        "content": "Create a todo app",
        "sequence": 1,
        "metadata": {
          "model": "openai/gpt-4o-mini",
          "status": "completed"
        },
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "message-uuid-2",
        "chatId": "chat-uuid",
        "role": "assistant",
        "content": "I'll create a todo app for you...",
        "sequence": 2,
        "metadata": {
          "model": "openai/gpt-4o-mini",
          "status": "completed",
          "generatedCode": "...",
          "appliedFiles": ["src/TodoApp.jsx"]
        },
        "createdAt": "2024-01-15T10:31:00.000Z",
        "updatedAt": "2024-01-15T10:31:00.000Z"
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 2
    }
  },
  "message": "Messages retrieved successfully",
  "version": "v1"
}
```

### POST /api/v1/projects/[id]/chat/[chatId]/messages

Creates a new message in a chat.

#### Request Body

```json
{
  "role": "user",
  "content": "Make it responsive",
  "metadata": {
    "status": "completed"
  }
}
```

#### Response

**Success (201)**

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "message-uuid",
      "chatId": "chat-uuid",
      "role": "user",
      "content": "Make it responsive",
      "sequence": 3,
      "metadata": {
        "status": "completed"
      },
      "createdAt": "2024-01-15T10:32:00.000Z",
      "updatedAt": "2024-01-15T10:32:00.000Z"
    }
  },
  "message": "Message created successfully",
  "version": "v1"
}
```

## AI Code Generation with Chat Context

### POST /api/v1/projects/[id]/chat/[chatId]/generate

Generates code using AI with full chat conversation context. Automatically saves user message and AI response to the chat.

#### Request Body

```json
{
  "prompt": "Add a dark mode toggle",
  "model": "openai/gpt-4o-mini",
  "isEdit": true
}
```

#### Response

**Streaming Response** - Server-Sent Events

```
data: {"type": "status", "message": "Initializing AI...", "version": "v1"}
data: {"type": "status", "message": "Using openai/gpt-4o-mini for code generation...", "version": "v1"}
data: {"type": "status", "message": "Generating code...", "version": "v1"}
data: {"type": "stream", "text": "I'll add a dark mode toggle...", "version": "v1"}
data: {"type": "complete", "message": "Code generation completed!", "generatedCode": "...", "messageId": "message-uuid", "version": "v1"}
```

#### Features

- **Chat Context**: Loads previous messages from the chat for AI context
- **Message Persistence**: Automatically saves user message and AI response
- **Streaming**: Real-time code generation with progress updates
- **Project-Scoped**: Ensures chat belongs to the specified project
- **Error Handling**: Updates message status on errors

## Chat Workflow Integration

### Typical User Flow

1. **User creates project** → Auto-creates "Main Chat"
2. **User sends first message** → `POST /api/v1/projects/[id]/chat/[chatId]/generate`
3. **AI generates code** → Saves both user message and AI response
4. **User continues conversation** → All messages persist in chat
5. **User creates new chat** → `POST /api/v1/projects/[id]/chat` for different topics
6. **User switches chats** → Each chat maintains independent conversation history

### Context Management

- **Recent Messages**: AI loads last 15 messages from chat for context
- **Applied Files Tracking**: Prevents AI from recreating existing components
- **Conversation History**: Full message history available for reference
- **Project Isolation**: Chats are scoped to specific projects only

## Dependencies

- `@e2b/code-interpreter`: E2B sandbox creation
- `vite`: Vite build tool
- `react`: React framework
- `drizzle-orm`: Database ORM
- `postgres`: PostgreSQL database
- `openai`: AI code generation
- Environment variables: `E2B_API_KEY`, `OPENAI_API_KEY`

## Key Features

1. **Project-Scoped Chats**: Chats belong to specific projects only
2. **Message Persistence**: All conversations stored in database
3. **AI Context Awareness**: AI remembers conversation history
4. **Multiple Chats**: Users can create multiple chats per project
5. **Real-time Streaming**: Live code generation with progress updates
6. **Automatic Message Saving**: User and AI messages saved automatically
7. **Error Recovery**: Failed generations tracked with error status

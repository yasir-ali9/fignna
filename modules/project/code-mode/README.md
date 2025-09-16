# Code Editor - Complete Implementation

This folder contains the complete CodeMirror-based code editor implementation integrated with our database-first architecture.

## 🎯 Purpose

Provides a professional VS Code-like editing experience that:

- Reads/writes files from NeonDB via tRPC
- Auto-saves changes with debouncing
- Syncs changes to Daytona sandbox in real-time
- Supports multiple file tabs and file operations
- Integrates seamlessly with Chat and Edit modes

## 📁 Structure

```
code-editor/
├── core/
│   ├── extensions.ts           # CodeMirror extensions, themes, and configs
├── editor-core/
│   └── codemirror-editor.tsx   # Main CodeMirror editor with DB integration
├── editor-tabs/
│   └── tab-bar.tsx             # File tabs with close functionality
├── file-explorer/
│   ├── file-tree.tsx           # File browser with database integration
│   └── new-file-modal.tsx      # Modal for creating new files
├── panels/
│   ├── code-panel.tsx          # Complete editor (explorer + tabs + editor)
│   └── split-view.tsx          # Code + preview split layout
└── index.tsx                   # Main exports
```

## ✅ Features Implemented

### Core Editor

- **CodeMirror 6** - Modern, performant editor with fallback
- **Syntax Highlighting** - JavaScript, TypeScript, HTML, CSS, JSON
- **Auto-save** - Debounced saving to database (1 second delay)
- **Multiple Themes** - Figma-inspired light/dark themes
- **File Tabs** - Multi-file editing with dirty state indicators

### File Management

- **Database Integration** - Files stored in NeonDB, synced to sandbox
- **File Explorer** - Hierarchical tree view from database
- **File Operations** - Create, open, edit, save files
- **Real-time Sync** - Changes sync to Daytona sandbox automatically
- **New File Creation** - Modal with templates for different file types

### State Management

- **MobX Integration** - Centralized state via FilesManager
- **Tab Management** - Open/close files, track dirty state
- **Error Handling** - Graceful fallbacks and error messages
- **Loading States** - Proper loading indicators

### UI/UX

- **Professional Design** - VS Code-inspired interface
- **Responsive Layout** - Resizable panels and proper overflow handling
- **Keyboard Shortcuts** - Standard editor shortcuts (when CodeMirror available)
- **File Icons** - Different icons for files and folders

## 🚀 Installation

### 1. Install CodeMirror Packages

Run the installation script:

```bash
node scripts/install-codemirror.js
```

Or install manually:

```bash
npm install codemirror @codemirror/view @codemirror/state @codemirror/language @codemirror/commands @codemirror/autocomplete @codemirror/search @codemirror/lang-javascript @codemirror/lang-html @codemirror/lang-css @codemirror/lang-json @codemirror/theme-one-dark
```

### 2. Usage in Components

```tsx
import { CodePanel, SplitView } from "@/components/code-editor";

// Full editor with file explorer
<CodePanel projectId={project.id} />

// Code + preview split view
<SplitView projectId={project.id} previewUrl={project.previewUrl} />
```

## 🔄 Data Flow

```
User Edit → CodeMirror → FilesManager → tRPC → Database → Daytona Sync → Preview Update
```

1. **User types** in CodeMirror editor
2. **FilesManager** updates tab state and marks as dirty
3. **Debounced save** triggers tRPC mutation after 1 second
4. **Database** stores the file content
5. **Daytona sync** updates the sandbox files
6. **Preview** refreshes automatically

## 🎨 Integration Points

### Chat Mode

- **Code Tab** - Full editor in chat mode
- **Split View** - Code + preview layout option
- **Only Code** - Full-screen editor mode

### Edit Mode

- **Left Panel** - Code panel option in edit mode
- **Canvas Integration** - Future: visual editing of components

### State Management

- **EditorEngine.files** - Centralized file state
- **Real-time Updates** - MobX observers for reactive UI
- **Persistence** - State survives mode switches

## 🛠️ Technical Details

### Fallback Handling

- **Graceful Degradation** - Works without CodeMirror packages
- **Fallback Editor** - Simple textarea when packages missing
- **Installation Prompts** - Clear instructions for missing dependencies

### Performance

- **Debounced Saving** - Prevents excessive API calls
- **Lazy Loading** - Files loaded only when opened
- **Efficient Rendering** - MobX observers prevent unnecessary re-renders

### Error Handling

- **Network Errors** - Graceful handling of API failures
- **File Conflicts** - Proper error messages for file operations
- **Validation** - File path validation and sanitization

## 🎨 File Icons System

### Supported File Types

- **JavaScript** - `.js`, `.mjs` files with custom JS icon
- **React** - `.jsx` files with React logo
- **TypeScript** - `.ts` files with TS logo
- **React TypeScript** - `.tsx` files with React + TS logo
- **JSON** - `.json`, `.jsonc` files with JSON brackets icon
- **Markdown** - `.md`, `.mdx` files with Markdown icon
- **Shell Scripts** - `.sh`, `.bash`, `.zsh` files with terminal icon
- **CSS** - `.css`, `.scss`, `.sass`, `.less` files with PostCSS icon
- **SVG** - `.svg` files with vector graphics icon
- **Text Files** - `.txt` files with document lines icon
- **Environment** - `.env`, `.env.local` files with settings gear icon
- **Images** - `.png`, `.jpg`, `.webp`, `.gif` files with image icon
- **Git Files** - `.git`, `.gitignore`, `.gitattributes` files with Git icon
- **Config Files** - Special icons for `tsconfig.json`, `next.config.js`, etc.
- **Folders** - Dynamic open/closed folder icons

### Usage

```tsx
import { FileIcon } from '@/components/code-editor/icons/file-icons';

// Basic file icon
<FileIcon filename="app.js" size={16} />

// Folder icon
<FileIcon 
  filename="components" 
  isDirectory={true} 
  isOpen={true} 
  size={16} 
/>
```

### Testing

Visit `/test-icons` to see all available icons in action.

## 🔮 Future Enhancements

### Phase 2 Features

- **File Search** - Global search across all files
- **Find & Replace** - In-editor search and replace
- **Git Integration** - File status indicators
- **Collaborative Editing** - Real-time multi-user editing

### Advanced Features

- **AI Code Completion** - Claude-powered suggestions
- **Refactoring Tools** - Automated code improvements
- **Debugging Support** - Breakpoints and debugging
- **Extension System** - Plugin architecture for custom features

## 📋 API Integration

### tRPC Endpoints Used

- `files.getByProject` - Load project files
- `files.getByPath` - Load individual file content
- `files.upsert` - Save file changes
- `files.create` - Create new files
- `sandbox.syncChangedFiles` - Sync to sandbox

### Database Schema

- **Projects** - Project metadata
- **Files** - File content and paths
- **Real-time Sync** - Changes propagate to sandbox

This implementation provides a complete, production-ready code editor that integrates seamlessly with your database-first architecture and provides a professional development experience.

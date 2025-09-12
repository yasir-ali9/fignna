# Project Module

This module contains all the components and functionality for the main project editor interface.

## Structure

- **code-editor/**: CodeMirror-based code editor components with file explorer, tabs, and syntax highlighting
- **project/**: Main project interface components
  - **edit-mode/**: Figma-like visual editor interface with canvas, panels, and tools
  - **view-mode/**: Preview interface with code/preview panels and chat functionality
  - **code-mode/**: Full-screen code editor interface
  - **common/**: Shared components used by all modes (top ribbon, chat panel, terminal)
- **providers/**: React context providers for state management
- **widgets/**: Reusable UI components and widgets

## Key Features

- **Dual Mode Interface**: Switch between Edit mode (Figma-like) and Chat mode (Loveable-like)
- **Centralized State**: All state managed through MobX stores (EditorEngine pattern)
- **Code Editor**: Full-featured code editor with file management
- **Live Preview**: Real-time preview of the application being built
- **AI Integration**: Chat-based AI assistance for code generation and modifications

## State Management

Uses MobX with the EditorEngine pattern for centralized state management. All components are wrapped with `observer()` to react to state changes.

## Dependencies

- MobX for state management
- CodeMirror for code editing
- Lucide React for icons
- Tailwind CSS for styling

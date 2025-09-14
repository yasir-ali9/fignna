# Project Overview

I am building a tool that combines the best of Figma (figma.com) and Loveable (loveable.com) & code editor like VS Code 9(using code mirror) These are two different tools:

- **Figma**: A design tool
- **Loveable**: A coding agentic tool that performs actions like making files, writing code, and executing terminal commands in a cloud sandbox

## Core Concept

We need to create a unified tool that works like Loveable but includes an "Edit" mode where users can experience a Figma-like interface.

### How It Works

**All are same** - the difference is only in UI/UX layout:

- **View Mode**: Users see preview and chat panel (like Loveable)
- **Edit Mode**: Users interact with the same isolated project through a Figma-like canvas interface
- **Code Mode**: Code editor

When users prompt something in either mode, we should:

1. Create a vitew react (for now) project in a sandbox (In e2b.dev for now and we can integrate fly.io etc in future)
2. Use Tailwind CSS for styling
3. Build parsers for different purposes (in frontend):
   - Parse content after return statements in TSX files to create layers panel (like Figma)
   - Parse Tailwind classes to show styles
4. Render the project in an iframe within the canvas for Figma-like experience

### Edit Mode Benefits

The "Edit" mode allows users to modify elements using Figma-like panels AND chat, which:

- Provides visual canvas interaction with the same AI-driven project
- Saves user costs through direct visual manipulation
- Eliminates API calls for minor changes (positions, colors, fonts)
- Maintains the same chat panel available in both modes

### Required Technologies

- **MobX**: State management (used by big apps like Canva, Leetcode, Udemy)

### State Management Architecture

- **Centralized State**: All application state must be managed through MobX stores, never use local component state (`useState`)
- **EditorEngine Pattern**: Follow the centralized `EditorEngine` pattern.
- **Store Structure**: Use specialized managers (StateManager, CanvasManager, ElementsManager, etc.) composed in the main EditorEngine
- **Observer Pattern**: All components that use state must be wrapped with `observer()` from `mobx-react-lite`
- **State Persistence**: Centralized state ensures data persists across mode switches and component re-renders
- **Type Safety**: Use enums (AppMode, ChatModeTab, etc.) for state values instead of string literals

## Design Guidelines

- Use variables defined in `globals.css` file (like `bg-bk-40`, `text-fg-50`, etc.)

## General Guidelines

- **app/project**: Main editor where users can:
  - Prompt to build apps (Loveable-like experience)
  - Edit or design stuff (Figma-like experience)
- **components/widget**: Location for creating reusable components
- **scalibility**: always architesct or organize or write code in scalablable manner. for example lets say we start with e2b then you have to make option to switch in few options like by making sandboxes folder and under it e2b folder, so we can later on add fly.io and more.
- **comments**: Always write comments with every metho/function or code block in simple english.

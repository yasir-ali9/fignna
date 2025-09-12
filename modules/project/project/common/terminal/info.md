# Terminal Components

This directory contains terminal-related components for the Fignna project editor.

## 📁 Files Structure

```
components/terminal/
├── terminal-panel.tsx    # Resizable bottom panel with terminal tabs
├── terminal.tsx          # Main terminal component with log streaming
└── info.md              # This documentation file
```

## 🖥️ Components

### **TerminalPanel**
- **Purpose**: Resizable bottom panel that contains terminal and future tabs
- **Features**: 
  - Collapsible/expandable panel
  - Tab system (terminal + future tabs)
  - Resize handle for height adjustment
  - Uses terminal icon from Phosphor Icons
- **Styling**: Uses bg-bk-70, font-mono, and project CSS variables

### **Terminal** 
- **Purpose**: Main terminal interface for Daytona workspace interaction
- **Features**:
  - Command input with history
  - Real-time log streaming from Daytona
  - Auto-scroll to latest output
  - Keyboard shortcuts (Ctrl+L to clear)
  - Connection status indicator
- **Styling**: Uses font-mono, bg-bk-70, proper color coding for different log types

## 🔧 Usage

```tsx
import { TerminalPanel } from '@/components/terminal/terminal-panel';

// Add to project layout
<TerminalPanel workspaceId={project.workspaceId} />
```

## 🚀 Integration Points

- **Layout**: Added to bottom of project page layout (below EditMode/ChatMode)
- **State**: Uses MobX observer pattern for reactivity
- **API**: Will connect to Daytona SDK for command execution and log streaming
- **Styling**: Follows project design system with CSS variables

## 🔮 Future Features

- **Real Daytona Integration**: Connect to actual workspace commands
- **Log Streaming**: Implement WebSocket-based real-time logs
- **Command History**: Up/down arrow navigation through previous commands
- **Multiple Terminals**: Support for multiple terminal sessions
- **File Operations**: Drag & drop files to terminal
- **Search**: Search through terminal history

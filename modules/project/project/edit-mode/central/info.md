# Central Area - Edit Mode Canvas

This area contains the main Figma-like canvas workspace for Edit Mode.

## Components

### canvas.tsx
- **Purpose**: Main canvas container with zoom, pan, and interaction controls
- **Features**: 
  - Infinite canvas with smooth zoom/pan (Ctrl+scroll to zoom, scroll to pan)
  - Space key for hand tool
  - Advanced zoom controls with presets (25%, 50%, 75%, 100%, 125%, 150%, 200%)
  - Frame management and positioning
  - Element selection and interaction handling

### Canvas Features

#### **Zoom & Pan Controls**
- **Mouse wheel + Ctrl/Cmd**: Zoom in/out with cursor-based focal point
- **Mouse wheel**: Pan horizontally/vertically (Shift+wheel for horizontal)
- **Space + drag**: Hand tool for panning
- **Middle mouse button**: Temporary hand tool
- **Zoom controls**: Buttons for zoom in/out, reset, fit to screen
- **Zoom presets**: Dropdown with common zoom levels

#### **Frame Interaction**
- **Drag frames**: Click and drag frame headers to reposition
- **Resize frames**: 8-point resize handles (corners and edges)
- **Frame selection**: Click frames to select with visual feedback
- **Minimum constraints**: Prevents frames from becoming too small (200x150px min)

#### **Canvas Management**
- **Infinite canvas**: Unlimited workspace area
- **Viewport constraints**: Smart boundary detection
- **Transform persistence**: Position and zoom state maintained
- **Performance optimized**: Smooth 60fps interactions

## Frame System

### CanvasFrame Component
- **Advanced iframe** with communication capabilities
- **Resizable handles** for all 8 directions (corners + edges)
- **Drag & drop** positioning anywhere on canvas
- **Visual selection** with blue outline and handles
- **DOM communication** for element interaction (Phase 2)
- **Browser-style header** with traffic light buttons

## Usage

The canvas automatically shows sandbox previews in interactive frames that users can:
1. **Move** by dragging the frame header
2. **Resize** using the corner and edge handles
3. **Select** for showing properties and tools
4. **Interact with content** through advanced iframe communication

This provides a true Figma-like experience for web development with live preview interaction.
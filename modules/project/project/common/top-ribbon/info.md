# Top Ribbon

This component provides the dynamic top navigation bar that appears in both Edit Mode and Chat Mode.

## Purpose

- **Logo & Branding**: Contains the app logo with dropdown menu
- **Project Name**: Editable project name (Figma-style inline editing)
- **Mode-Specific Tabs**: Code/Preview tabs (Chat Mode only)
- **Mode Switching**: Central mode switcher with tooltips for Edit/Chat modes
- **Theme Controls**: Logo dropdown includes theme selection (Light/Dark/System)
- **Mode Indicator**: Shows current mode on the right side

## Features

### Project Name Editing
- **Click to Edit**: Single click to enter edit mode
- **Select All**: All text selected when editing starts (Figma-style)
- **Auto-sizing**: Input width adjusts to content length
- **Keyboard Controls**: Enter to confirm, Escape to cancel
- **Fallback**: Defaults to "Unnamed" if empty

### Dynamic Content
- **Code/Preview Tabs**: Only visible in Chat Mode
- **Conditional Props**: Accepts tab state only when needed
- **Clean Layout**: Adapts layout based on mode

### Design Consistency
- **Icon-Only Mode Switcher**: Compact 16x16px icons with tooltips
- **Active State**: Uses `bg-bk-30` for active mode indication
- **Responsive Layout**: Flexbox layout with centered mode switcher
- **Consistent Styling**: 11-13px fonts, proper spacing and colors

## Props

```tsx
interface TopRibbonProps {
  currentMode: 'edit' | 'chat';
  onModeChange: (mode: 'edit' | 'chat') => void;
  // Chat mode specific props
  activeCodeOrViewTab?: 'preview' | 'code';
  onCodeOrViewTabChange?: (tab: 'preview' | 'code') => void;
}
```

## Usage

### Edit Mode
```tsx
<TopRibbon 
  currentMode="edit" 
  onModeChange={setCurrentMode} 
/>
```

### Chat Mode
```tsx
<TopRibbon 
  currentMode="chat" 
  onModeChange={setCurrentMode}
  activeCodeOrViewTab={activeTab}
  onCodeOrViewTabChange={setActiveTab}
/>
```

## Components Used

- **LogoDropdown**: Theme selection and branding
- **Tooltip**: Mode switcher tooltips with 500ms delay
- **SVG Icons**: Chat and Edit mode icons
- **Inline Input**: Project name editing functionality

This component demonstrates dynamic UI patterns where content adapts based on application state and mode.

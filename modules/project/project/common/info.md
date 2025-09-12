# Common Components

This folder contains shared components that are used across multiple modes (Edit Mode and Chat Mode).

## Purpose

Contains reusable components that provide consistent functionality and UI across different application modes.

## Components

- **chat-panel/**: Shared chat interface component used in both Edit Mode and Chat Mode
- **top-ribbon/**: Top navigation bar with logo, mode switcher, and theme controls

## Features

### Chat Panel
- Configurable placeholder text
- Reusable across both modes
- Consistent message styling and interactions

### Top Ribbon
- **Mode Switching**: Icon-based switcher with tooltips (16x16px icons)
- **Logo & Branding**: Logo dropdown with theme selection
- **Active States**: Uses `bg-bk-30` for active mode indication
- **Responsive Layout**: Centered mode switcher with proper spacing

## Usage

Components in this folder should be:
- Mode-agnostic (work in any context)
- Highly reusable
- Configurable through props
- Well-documented with clear interfaces

## Import Pattern

```tsx
import { ChatPanel } from '../common/chat-panel';
import { TopRibbon } from '../common/top-ribbon';
```

This ensures consistent behavior and reduces code duplication across modes.

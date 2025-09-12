# Toast System Design

## Overview

The toast system will be implemented as a React-based notification system using a global context provider for state management. The design follows the existing application patterns and integrates seamlessly with the current design system, taking inspiration from the context menu component styling.

## Architecture

### Component Structure

```
components/common/toast/
├── index.ts                 # Export barrel
├── toast-provider.tsx      # Context provider for global state
├── toast-container.tsx     # Container that renders all toasts
├── toast-item.tsx          # Individual toast component
├── use-toast.tsx           # Hook for triggering toasts
└── types.ts                # TypeScript interfaces
```

### State Management

- **Global Context**: Toast state managed via React Context API
- **Provider Pattern**: ToastProvider wraps the application at root level
- **Hook Interface**: useToast() hook provides simple API for components
- **Auto-cleanup**: Automatic removal of expired toasts

## Components and Interfaces

### ToastProvider Component

```typescript
interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number; // Default: 5
  defaultDuration?: number; // Default: 4000ms
  defaultPosition?: ToastPosition; // Default: 'top-right'
}
```

**Responsibilities:**

- Manage global toast state array
- Handle toast creation, updates, and removal
- Provide context value to child components
- Implement auto-dismiss timers

### ToastContainer Component

```typescript
interface ToastContainerProps {
  position?: ToastPosition;
}
```

**Responsibilities:**

- Render toast items in correct position
- Handle stacking and spacing between toasts
- Manage enter/exit animations
- Position toasts in viewport corners

### ToastItem Component

```typescript
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}
```

**Responsibilities:**

- Render individual toast with appropriate styling
- Handle click-to-dismiss functionality
- Display toast type indicators (colors/icons)
- Manage fade-in/fade-out animations

### useToast Hook

```typescript
interface UseToastReturn {
  toast: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
```

**API Methods:**

- `toast(message, options)` - Show new toast, returns ID
- `dismiss(id)` - Manually dismiss specific toast
- `dismissAll()` - Clear all active toasts

## Data Models

### Toast Interface

```typescript
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  position: ToastPosition;
  createdAt: number;
  isVisible: boolean;
}

type ToastType = "success" | "error" | "info" | "warning";
type ToastPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  position?: ToastPosition;
}
```

### Context State

```typescript
interface ToastContextState {
  toasts: Toast[];
  addToast: (message: string, options?: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}
```

## Styling Design

### Base Toast Styling

Following the context menu design pattern:

```css
/* Base toast container */
.toast-base {
  background: bg-bk-40;
  border: 1px solid bd-50;
  border-radius: 8px;
  box-shadow: shadow-lg;
  padding: 12px 16px;
  min-width: 200px;
  max-width: 400px;
  font-size: 11px;
  letter-spacing: -0.025em; /* tracking-tight */
}
```

### Type-Specific Styling

```css
/* Success toast */
.toast-success {
  border-left: 3px solid #10b981; /* green accent */
}

/* Error toast */
.toast-error {
  border-left: 3px solid #ef4444; /* red accent */
}

/* Warning toast */
.toast-warning {
  border-left: 3px solid #f59e0b; /* amber accent */
}

/* Info toast (default) */
.toast-info {
  border-left: 3px solid #3b82f6; /* blue accent */
}
```

### Positioning System

```css
/* Container positioning */
.toast-container {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.toast-container.top-right {
  top: 16px;
  right: 16px;
}

.toast-container.top-left {
  top: 16px;
  left: 16px;
}

.toast-container.bottom-right {
  bottom: 16px;
  right: 16px;
}

.toast-container.bottom-left {
  bottom: 16px;
  left: 16px;
}

/* Individual toast spacing */
.toast-item {
  margin-bottom: 8px;
  pointer-events: auto;
}
```

## Animation Strategy

### Enter Animation

- **Duration**: 200ms
- **Easing**: ease-out
- **Transform**: translateX(100%) → translateX(0) for right positions
- **Opacity**: 0 → 1

### Exit Animation

- **Duration**: 300ms
- **Easing**: ease-in
- **Transform**: translateX(0) → translateX(100%) for right positions
- **Opacity**: 1 → 0

### Stacking Animation

- **Duration**: 150ms
- **Easing**: ease-in-out
- **Transform**: Smooth repositioning when toasts are added/removed

## Error Handling

### Toast Creation Errors

- **Invalid message**: Fallback to "Notification" if message is empty
- **Invalid options**: Use default values for invalid option properties
- **Context missing**: Graceful degradation with console warning

### State Management Errors

- **Memory leaks**: Automatic cleanup of expired toasts
- **Performance**: Limit maximum toasts to prevent DOM bloat
- **Race conditions**: Use stable IDs and proper state updates

### Animation Errors

- **CSS support**: Fallback to simple opacity transitions
- **Performance**: Use transform3d for hardware acceleration
- **Accessibility**: Respect prefers-reduced-motion setting

## Testing Strategy

### Unit Testing Focus

- Toast creation and dismissal logic
- Timer management for auto-dismiss
- State updates and context behavior
- Hook API functionality

### Integration Testing Focus

- Toast positioning across different screen sizes
- Multiple toast stacking behavior
- Animation timing and sequencing
- Context provider integration

### Manual Testing Scenarios

- Toast visibility across different themes
- Performance with multiple rapid toasts
- Accessibility with screen readers
- Mobile responsiveness and touch interactions

## Implementation Notes

### Performance Considerations

- Use React.memo for ToastItem to prevent unnecessary re-renders
- Implement efficient toast removal to avoid array mutations
- Use CSS transforms for animations (hardware accelerated)
- Debounce rapid toast creation to prevent spam

### Accessibility Features

- ARIA live regions for screen reader announcements
- Keyboard navigation support (Tab to focus, Enter/Space to dismiss)
- High contrast mode compatibility
- Respect user's motion preferences

### Integration Points

- Root layout integration for ToastProvider
- Error boundary integration for API error toasts
- Form validation integration for user feedback
- Project operations integration (rename, delete, etc.)

### Scalability Features

- Configurable positioning system
- Extensible toast types
- Customizable duration and behavior
- Plugin architecture for future enhancements

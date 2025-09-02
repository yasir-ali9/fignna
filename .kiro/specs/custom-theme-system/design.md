# Design Document

## Overview

The custom theme system will integrate seamlessly with the existing Next.js + Tailwind CSS setup, providing a robust theming solution using CSS custom properties and React Context. The system will support the provided color palette with semantic naming conventions.

## Architecture

### Theme Management Flow

```
User Interaction → Theme Context → CSS Variables → Tailwind Classes → UI Update
```

### Component Hierarchy

```
App Layout
├── ThemeProvider (Context)
├── Theme Page
│   └── ThemeToggle (Component)
└── Other Pages (inherit theme)
```

## Components and Interfaces

### 1. Theme Context (`components/context/theme-context.tsx`)

- **Purpose**: Manage global theme state and provide theme switching functionality
- **State**: Current theme ('light' | 'dark'), toggle function
- **Storage**: localStorage for persistence, system preference detection
- **Interface**:
  ```typescript
  interface ThemeContextType {
    theme: "light" | "dark";
    toggleTheme: () => void;
  }
  ```

### 2. Theme Toggle (`components/common/toggle.tsx`)

- **Purpose**: Reusable toggle component for theme switching
- **Features**: Visual feedback, accessibility support, smooth transitions
- **Props**: Optional size, styling customization
- **Interface**:
  ```typescript
  interface ToggleProps {
    size?: "sm" | "md" | "lg";
    className?: string;
  }
  ```

### 3. Theme Demo Page (`app/theme/page.tsx`)

- **Purpose**: Demonstrate theming system with various UI elements
- **Content**: Color swatches, text samples, interactive elements
- **Features**: Theme toggle integration, responsive design

## Data Models

### Theme Configuration

```typescript
type Theme = "light" | "dark";

interface ColorVariables {
  bk: Record<string, string>; // Background colors
  fg: Record<string, string>; // Foreground colors
  bd: Record<string, string>; // Border colors
  ac: Record<string, string>; // Accent colors
}

interface ThemeConfig {
  light: ColorVariables;
  dark: ColorVariables;
}
```

### CSS Variable Structure

- **Background**: `--bk-30` through `--bk-70`
- **Foreground**: `--fg-30` through `--fg-70`
- **Border**: `--bd-50`
- **Accent**: `--ac-01`

## Error Handling

### Theme Context Errors

- **Missing Provider**: Graceful fallback to light theme
- **localStorage Issues**: Fall back to system preference
- **Invalid Theme Values**: Reset to default light theme

### Component Errors

- **Toggle Component**: Disable functionality if context unavailable
- **CSS Variables**: Provide fallback colors for unsupported browsers

## Testing Strategy

### Unit Tests

- Theme context state management
- Toggle component functionality
- CSS variable application

### Integration Tests

- Theme persistence across page reloads
- System preference detection
- Component theme updates

### Visual Tests

- Color accuracy across themes
- Transition smoothness
- Responsive behavior

## Implementation Details

### CSS Integration

- Extend `globals.css` with custom properties
- Use `@theme inline` directive for Tailwind CSS v4 integration
- Implement smooth transitions for theme changes

### Tailwind Integration

- Use `@theme inline` directive in CSS for custom colors (no config file needed in v4)
- Map CSS variables to Tailwind color names using inline theme configuration
- Ensure proper IntelliSense support through CSS variable definitions

### Performance Considerations

- Minimize re-renders during theme changes
- Use CSS transitions instead of JavaScript animations
- Lazy load theme-specific assets if needed

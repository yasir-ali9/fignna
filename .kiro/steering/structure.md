# Project Structure

## App Directory (`/app`)

Uses Next.js 13+ App Router convention:

- `layout.tsx` - Root layout with fonts, global styles, and ThemeProvider
- `page.tsx` - Home page component with theme integration
- `theme/page.tsx` - Theme demonstration and testing page
- `globals.css` - Global CSS with Tailwind imports and theme variables
- `favicon.ico` - Site favicon

## Public Assets (`/public`)

- `*.svg` files for icons and logos
- `media/` subfolder for additional assets
- Static files served from root URL path

## Configuration Files

- `package.json` - Dependencies and scripts
- `next.config.ts` - Next.js configuration (TypeScript)
- `tsconfig.json` - TypeScript compiler options with path aliases
- `eslint.config.mjs` - ESLint configuration (ES modules)
- `postcss.config.mjs` - PostCSS configuration
- `.gitignore` - Git ignore patterns

## Conventions

- **File Extensions**: Use `.tsx` for React components, `.ts` for utilities
- **File Naming**: Always use kebab-case for files and folders
- **Path Aliases**: Use `@/` for imports from project root
- **Styling**: Tailwind classes with CSS custom properties for theming (bg-bk-50, text-fg-50, border-bd-50)
- **Components**: Server components by default, add 'use client' when needed
- **Fonts**: Geist Sans and Mono loaded via `next/font/google`
- **Images**: Use Next.js `Image` component for optimization
- **Comments**: Always add comments above code blocks and methods in simple English

## Theming System

### Color Variable Usage

- **Background Colors**: `bg-bk-30` to `bg-bk-70` (lighter to darker)
- **Text Colors**: `text-fg-30` to `text-fg-70` (higher contrast to lower)
- **Border Colors**: `border-bd-30` to `border-bd-70` (subtle to prominent)
- **Accent Colors**: `bg-ac-01` for primary actions and highlights

### Theme Context

- Use `useTheme()` hook to access current theme and toggle function
- Theme state persists in localStorage with system preference fallback
- Theme provider wraps entire application at root layout level
- Error boundaries handle theme-related failures gracefully

### CSS Variables

- All colors defined as RGB values in CSS custom properties
- Variables automatically switch between light and dark variants
- Use `data-theme` attribute on document root for theme detection
- Smooth transitions applied to all theme-aware properties

### Component Organization

#### Context Providers (`/components/context/`)

- **theme-context.tsx**: Main theme state management
  - Exports `ThemeProvider` component and `useTheme` hook
  - Handles localStorage persistence and system preference detection
  - Provides theme toggle functionality with smooth transitions

#### Common Components (`/components/common/`)

- **toggle.tsx**: Reusable theme toggle component
  - Accessible toggle with ARIA labels and keyboard navigation
  - Visual feedback for current theme state
  - Smooth animations using theme colors
- **error-boundary.tsx**: Error boundary for theme system
  - Graceful fallback handling for theme-related errors
  - Prevents theme failures from breaking the entire application

### Usage Patterns

#### Basic Theme Usage

```tsx
// Import theme hook
import { useTheme } from "@/components/context/theme-context";

// Use in component
const { theme, toggleTheme } = useTheme();
```

#### Color Class Patterns

```tsx
// Standard surface hierarchy
className = "bg-bk-50 border border-bd-50";

// Text hierarchy
className = "text-fg-70 hover:text-fg-60";

// Interactive elements
className = "bg-ac-01 hover:bg-ac-01/90 text-fg-70";
```

#### Theme-Aware Styling

```tsx
// Conditional styling based on theme
className={`transition-colors ${
  theme === 'dark' ? 'shadow-lg' : 'shadow-sm'
}`}
```

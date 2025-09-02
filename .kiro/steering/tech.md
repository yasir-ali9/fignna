# Technology Stack

## Core Framework

- **Next.js 15.5.2** with App Router
- **React 19.1.0** with latest features
- **TypeScript 5** for type safety

## Styling & UI

- **Tailwind CSS v4** for utility-first styling (no config file needed)
- **Geist fonts** (Sans & Mono) from Google Fonts
- **Custom Theme System** with semantic color variables:
  - `bk` (background) - Surface and container colors
  - `fg` (foreground) - Text and icon colors
  - `bd` (border) - Border and divider colors
  - `ac` (accent) - Primary action and highlight colors
  - Each category has 5 variants: 30, 40, 50, 60, 70
- **Dark/Light Mode** support via React Context with localStorage persistence
- **Theme Provider** integrated at root layout level with error boundaries
- **CSS Variables** mapped to Tailwind colors using `@theme inline` directive
- **Smooth Transitions** for theme changes with proper accessibility support

### Theme System Implementation

- **CSS Variables**: All colors defined as RGB values (e.g., `--bk-50: 255 255 255`)
- **Tailwind Integration**: Use `@theme inline` directive in `globals.css` for v4 compatibility
- **Theme Context**: React Context provider manages theme state with localStorage persistence
- **System Preference**: Automatic detection of user's preferred color scheme
- **Error Handling**: Graceful fallbacks for unsupported browsers and missing context

### Color Usage Guidelines

- **Primary Surfaces**: Use `bg-bk-50` for main backgrounds, `bg-bk-40` for elevated surfaces
- **Text Hierarchy**: `text-fg-70` for primary text, `text-fg-60` for secondary, `text-fg-50` for muted
- **Interactive Elements**: `bg-ac-01` for primary buttons and active states
- **Borders**: `border-bd-50` for standard borders, `border-bd-60` for emphasis
- **Hover States**: Increment color variant by 10 (e.g., `hover:bg-bk-60` from `bg-bk-50`)

## Build Tools

- **Turbopack** for fast development and builds
- **ESLint 9** with Next.js configuration
- **PostCSS** for CSS processing

## Development Commands

```bash
# Development server with Turbopack
npm run dev

# Production build with Turbopack
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Key Dependencies

- All React/Next.js types included
- ESLint config extends `next/core-web-vitals` and `next/typescript`
- Path alias `@/*` configured for root-level imports

## Performance Features

- Turbopack enabled for faster builds
- Image optimization via Next.js Image component
- Font optimization with `next/font/google`

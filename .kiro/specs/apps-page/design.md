# Design Document

## Overview

This design document outlines the implementation of an apps page with a header component that displays session information for authenticated users. The page will show user profile data and provide a clean interface for the application.

## Architecture

### Component Structure

```
app/apps/
├── page.tsx                 # Main apps page component
└── _components/
    └── header.tsx          # Header component with session data
```

### Authentication Flow

1. **Page Load**: User navigates to `/apps`
2. **Session Check**: Check if user is authenticated using `useSession` hook
3. **Redirect Logic**: If not authenticated, redirect to `/auth` page
4. **Display Content**: Show apps page with header containing session data

### State Management

The page will use better-auth's React hooks:

- `useSession()` - For checking authentication status and getting user data
- Session data will be passed to header component

## Components and Interfaces

### 1. Main Apps Page (`app/apps/page.tsx`)

**Purpose**: Main page component for authenticated users

**Key Features**:

- Authentication check and redirect
- Clean layout with header component
- Theme-aware styling

### 2. Header Component (`app/apps/_components/header.tsx`)

**Purpose**: Header component displaying session information

**Key Features**:

- "fignna" branding on the left
- User name and profile picture on the right
- Responsive design

**Props**:

```typescript
interface HeaderProps {
  user: {
    name: string;
    image?: string;
  };
}
```

## Data Models

### Session Data Structure

```typescript
interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}
```

## Implementation Notes

### Better-Auth Integration

- Use existing `useSession` hook for session management
- Handle loading and error states appropriately

### Theme Integration

- Use existing theme system with CSS custom properties
- Responsive design with Tailwind CSS

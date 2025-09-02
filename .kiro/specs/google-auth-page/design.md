# Design Document

## Overview

This design document outlines the implementation of a simple Google authentication page for the fignna.com application. The page will provide a clean interface for users to sign in using their Google account, leveraging the existing better-auth infrastructure.

## Architecture

### Component Structure

```
app/auth/
├── page.tsx                 # Main authentication page component
└── _components/
    └── form.tsx            # Google sign-in form component
```

### Authentication Flow

1. **Page Load**: User navigates to `/auth`
2. **Session Check**: Check if user is already authenticated using `useSession` hook
3. **Redirect Logic**: If authenticated, redirect to home page
4. **Sign-in Process**: User clicks Google sign-in button
5. **OAuth Flow**: better-auth handles Google OAuth redirect
6. **Final Redirect**: User is redirected to home page

### State Management

The page will use better-auth's React hooks:

- `useSession()` - For checking authentication status
- `authClient.signIn.social()` - For initiating Google OAuth flow
- Basic loading states through React state

## Components and Interfaces

### 1. Main Authentication Page (`app/auth/page.tsx`)

**Purpose**: Main page component that handles the authentication flow

**Key Features**:

- Clean, centered layout
- Theme-aware styling using existing CSS variables
- Automatic redirect for authenticated users

### 2. Authentication Form (`app/auth/_components/form.tsx`)

**Purpose**: Form component with Google sign-in button

**Key Features**:

- Google branding with logo
- Loading states during authentication
- Basic error handling

**Authentication Integration**:

```typescript
const handleSignIn = async () => {
  await authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });
};
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

## Error Handling

### Simple Error Strategy

- Display basic error messages for failed authentication
- Allow retry for failed attempts
- Handle network errors gracefully

## Implementation Notes

### Better-Auth Integration

The existing better-auth setup provides:

- Google OAuth provider configuration
- Database schema with user, session, account tables
- React client with hooks for session management

### Theme Integration

The page will use the existing theme system:

- CSS custom properties for colors (`bg-bk-50`, `text-fg-70`, etc.)
- Theme context for light/dark mode switching

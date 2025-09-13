# Implementation Plan

- [x] 1. Fix environment variable references in API routes

  - Replace NEXTAUTH_URL with BETTER_AUTH_URL in code/apply route
  - Replace NEXTAUTH_URL with BETTER_AUTH_URL in chat generate route
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Configure Better Auth with Email OTP plugin

  - Install better-auth email OTP plugin if needed
  - Add emailOTP plugin to Better Auth configuration in lib/auth.ts
  - Implement Resend integration for sending OTP emails
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 3. Create Email OTP form component

  - Create email-otp-form.tsx component with two-step flow (email → OTP)
  - Implement email input validation and OTP verification
  - Add loading states, error handling, and resend functionality with cooldown
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Create authentication modal component

  - Create auth-modal.tsx component with portal-based rendering
  - Implement modal open/close functionality with proper z-index management
  - Add both Google OAuth and Email OTP options within modal
  - _Requirements: 2.1, 2.3, 2.4, 4.1, 4.2_

- [x] 5. Create authentication guard hook

  - Create use-auth-guard.ts hook to check authentication status
  - Implement modal trigger logic for unauthenticated users
  - Add requireAuth function to wrap protected actions
  - _Requirements: 2.1, 2.2_

- [x] 6. Enhance existing authentication form

  - Update form.tsx to include Email OTP option alongside Google OAuth
  - Ensure consistent styling and error handling between modal and page
  - Share component logic between modal and dedicated auth page
  - _Requirements: 4.1, 4.3, 4.4_

- [x] 7. Integrate modal into project interface

  - Add authentication guard to prompt writing functionality
  - Implement modal trigger when unauthenticated user writes prompt
  - Handle successful authentication to continue original action
  - _Requirements: 2.1, 2.2_

- [ ] 8. Add comprehensive error handling

  - Implement error handling for email service failures
  - Add OTP validation error handling with retry logic
  - Create consistent error messages across all auth interfaces
  - _Requirements: 1.3, 1.5, 4.3, 4.4_

- [ ] 9. Write unit tests for authentication components

  - Test Email OTP form component functionality
  - Test authentication modal behavior and state management
  - Test authentication guard hook logic
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 10. Write integration tests for auth flow
  - Test complete Email OTP authentication flow
  - Test modal integration with existing authentication system
  - Test environment variable usage in API routes
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

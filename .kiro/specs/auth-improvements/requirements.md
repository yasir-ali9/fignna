# Requirements Document

## Introduction

This feature enhances the existing Better Auth implementation by adding email OTP authentication via Resend, creating a modal-based auth system for unauthenticated users, and fixing incorrect environment variable references throughout the codebase. The improvements will provide users with multiple authentication options while maintaining a seamless user experience.

## Requirements

### Requirement 1

**User Story:** As a user, I want to authenticate using email OTP so that I can access the platform without requiring a Google account.

#### Acceptance Criteria

1. WHEN a user enters their email address THEN the system SHALL send an OTP via Resend email service
2. WHEN a user enters a valid OTP THEN the system SHALL authenticate them and create a session
3. WHEN a user enters an invalid OTP THEN the system SHALL display an error message and allow retry
4. WHEN an OTP expires THEN the system SHALL allow the user to request a new OTP
5. IF the email service fails THEN the system SHALL display an appropriate error message

### Requirement 2

**User Story:** As an unauthenticated user, I want to see an authentication modal when I try to use features that require login so that I can quickly sign in without navigating away from my current context.

#### Acceptance Criteria

1. WHEN an unauthenticated user writes a prompt THEN the system SHALL display an authentication modal
2. WHEN the user successfully authenticates via the modal THEN the system SHALL close the modal and continue with their original action
3. WHEN the user cancels the modal THEN the system SHALL close the modal without performing the action
4. WHEN the modal is displayed THEN it SHALL include both Google OAuth and email OTP options
5. IF the user is already authenticated THEN the modal SHALL NOT appear

### Requirement 3

**User Story:** As a developer, I want all environment variable references to use the correct Better Auth configuration so that the application functions properly across all API endpoints.

#### Acceptance Criteria

1. WHEN the system makes internal API calls THEN it SHALL use BETTER_AUTH_URL instead of NEXTAUTH_URL
2. WHEN environment variables are missing THEN the system SHALL use appropriate fallback values
3. WHEN the application starts THEN all auth-related configurations SHALL use Better Auth variables
4. IF incorrect environment variables are found THEN they SHALL be replaced with correct Better Auth equivalents

### Requirement 4

**User Story:** As a user, I want the authentication system to be consistent across both the dedicated auth page and the modal so that I have a familiar experience regardless of entry point.

#### Acceptance Criteria

1. WHEN using either auth interface THEN both SHALL offer the same authentication methods
2. WHEN authentication succeeds THEN both interfaces SHALL handle success consistently
3. WHEN errors occur THEN both interfaces SHALL display consistent error messages
4. WHEN loading states occur THEN both interfaces SHALL show consistent loading indicators

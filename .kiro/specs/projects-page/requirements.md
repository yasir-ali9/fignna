# Requirements Document

## Introduction

This feature implements a projects page for authenticated users that displays session information in a header component. The page will show the user's name and profile picture along with the application branding.

## Requirements

### Requirement 1

**User Story:** As an authenticated user, I want to access a projects page, so that I can see my session information and use the application.

#### Acceptance Criteria

1. WHEN a user navigates to `/projects` THEN the system SHALL display the projects page
2. WHEN the projects page loads THEN the system SHALL display a header with session information
3. WHEN the page loads THEN the system SHALL follow the existing theme system

### Requirement 2

**User Story:** As an authenticated user, I want to see my profile information in the header, so that I know I'm signed in correctly.

#### Acceptance Criteria

1. WHEN the header loads THEN the system SHALL display "fignna" text on the left side
2. WHEN the header loads THEN the system SHALL display the user's name and profile picture on the right side

### Requirement 3

**User Story:** As an unauthenticated user, I want to be redirected to the auth page, so that I can sign in to access the projects.

#### Acceptance Criteria

1. WHEN an unauthenticated user visits `/projects` THEN the system SHALL redirect them to `/auth`
2. WHEN session is loading THEN the system SHALL show a loading state

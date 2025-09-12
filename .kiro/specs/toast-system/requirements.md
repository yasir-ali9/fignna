# Toast System Requirements

## Introduction

This specification defines a minimal, scalable toast notification system for the Fignna application. The toast system will provide user feedback for actions like project renaming, API errors, and other user interactions. The design will follow the existing design system and be inspired by the context menu component styling.

## Requirements

### Requirement 1: Basic Toast Display

**User Story:** As a user, I want to see toast notifications for important feedback, so that I know when actions succeed or fail.

#### Acceptance Criteria

1. WHEN a toast is triggered THEN the system SHALL display a toast notification on screen
2. WHEN a toast appears THEN it SHALL use the application's color system (bk, fg, bd, ac colors)
3. WHEN a toast is displayed THEN it SHALL have rounded corners and shadow similar to context menu
4. WHEN a toast contains text THEN it SHALL use 11px font size with tight tracking
5. WHEN a toast is shown THEN it SHALL auto-dismiss after 4 seconds by default

### Requirement 2: Toast Types and Styling

**User Story:** As a user, I want different toast types for different message types, so that I can quickly understand the nature of the feedback.

#### Acceptance Criteria

1. WHEN showing a success message THEN the system SHALL display a success toast with appropriate styling
2. WHEN showing an error message THEN the system SHALL display an error toast with appropriate styling
3. WHEN showing an info message THEN the system SHALL display an info toast with appropriate styling
4. WHEN showing a warning message THEN the system SHALL display a warning toast with appropriate styling
5. IF no type is specified THEN the system SHALL default to info toast styling

### Requirement 3: Toast Positioning

**User Story:** As a developer, I want configurable toast positioning, so that toasts can appear in different locations based on context.

#### Acceptance Criteria

1. WHEN creating a toast THEN the system SHALL support top-right positioning by default
2. WHEN positioning is specified THEN the system SHALL support top-left, top-right, bottom-left, and bottom-right positions
3. WHEN multiple toasts exist THEN they SHALL stack vertically with proper spacing
4. WHEN toasts are stacked THEN newer toasts SHALL appear at the top of the stack

### Requirement 4: Toast Management

**User Story:** As a user, I want toasts to be manageable and not overwhelming, so that they don't interfere with my workflow.

#### Acceptance Criteria

1. WHEN a toast is displayed THEN the user SHALL be able to manually dismiss it by clicking
2. WHEN multiple toasts are shown THEN the system SHALL limit the maximum number to 5 toasts
3. WHEN the toast limit is exceeded THEN the system SHALL remove the oldest toast automatically
4. WHEN a toast auto-dismisses THEN it SHALL fade out smoothly over 300ms
5. WHEN a toast is manually dismissed THEN it SHALL remove immediately with fade animation

### Requirement 5: Programmatic API

**User Story:** As a developer, I want a simple API to show toasts, so that I can easily integrate toast notifications throughout the application.

#### Acceptance Criteria

1. WHEN calling the toast API THEN it SHALL accept a message string as the primary parameter
2. WHEN calling the toast API THEN it SHALL accept optional type parameter (success, error, info, warning)
3. WHEN calling the toast API THEN it SHALL accept optional duration parameter in milliseconds
4. WHEN calling the toast API THEN it SHALL accept optional position parameter
5. WHEN calling the toast API THEN it SHALL return a toast ID for manual dismissal
6. WHEN dismissing programmatically THEN the system SHALL accept a toast ID parameter

### Requirement 6: Integration with Existing Design System

**User Story:** As a user, I want toasts to feel native to the application, so that they provide a consistent user experience.

#### Acceptance Criteria

1. WHEN a toast is displayed THEN it SHALL use bg-bk-40 background color like context menu
2. WHEN a toast is displayed THEN it SHALL use border-bd-50 border color
3. WHEN a toast has text THEN it SHALL use text-fg-30 color for primary text
4. WHEN a toast needs emphasis THEN it SHALL use appropriate accent colors for different types
5. WHEN a toast appears THEN it SHALL have the same shadow-lg styling as context menu
6. WHEN a toast is interactive THEN it SHALL follow the same hover states as other components

# Toast System Implementation Plan

- [x] 1. Create core toast types and interfaces

  - Define TypeScript interfaces for Toast, ToastOptions, ToastType, and ToastPosition
  - Create barrel export file for clean imports
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Implement ToastProvider context and state management

  - Create React Context for global toast state
  - Implement ToastProvider component with state management
  - Add methods for adding, removing, and clearing toasts
  - Implement auto-dismiss timer logic
  - _Requirements: 1.1, 1.5, 4.3, 4.4_

- [x] 3. Create useToast hook for programmatic API

  - Implement useToast hook with toast(), dismiss(), and dismissAll() methods
  - Add proper error handling for missing context
  - Generate unique toast IDs using crypto.randomUUID()
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 4. Build ToastItem component with styling

  - Create individual toast component with message display
  - Implement click-to-dismiss functionality
  - Add type-specific styling with color-coded left borders
  - Apply design system colors (bg-bk-40, border-bd-50, text-fg-30)
  - Set 11px font size with tight tracking
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 6.1, 6.2, 6.3, 6.4_

- [x] 5. Implement ToastContainer with positioning and stacking

  - Create container component that renders all active toasts
  - Implement positioning system for all four corners
  - Add proper stacking with vertical spacing
  - Ensure newer toasts appear at top of stack
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Add smooth animations for enter/exit transitions

  - Implement fade-in animation for new toasts
  - Add fade-out animation for dismissing toasts
  - Create smooth repositioning when toasts are removed
  - Use CSS transforms for hardware acceleration
  - _Requirements: 4.4, 4.5_

- [x] 7. Integrate ToastProvider into application root

  - Add ToastProvider to app/layout.tsx after ThemeProvider
  - Ensure ToastContainer is rendered at root level
  - Configure default settings (max 5 toasts, 4 second duration, top-right position)
  - _Requirements: 4.2, 4.3_

- [ ] 8. Replace existing alert() calls with toast notifications
  - Update project rename error handling to use toast instead of alert()
  - Replace other alert() calls throughout the application
  - Add success toasts for positive actions
  - _Requirements: 1.1, 2.1, 2.2_

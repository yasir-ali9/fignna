# TypeScript Check on File Save

## Description

Automatically runs TypeScript type checking when any TypeScript or JavaScript file is saved and attempts to fix any errors found.

## Trigger

- **Event**: File Save
- **File Pattern**: `**/*.{ts,tsx,js,jsx}`

## Actions

1. Run `npx tsc --noEmit --skipLibCheck` to check for TypeScript errors
2. If errors are found, attempt to fix common issues automatically
3. Report results to the user

## Configuration

```json
{
  "name": "TypeScript Check on Save",
  "description": "Automatically check and fix TypeScript errors when files are saved",
  "trigger": {
    "event": "file.save",
    "filePattern": "**/*.{ts,tsx,js,jsx}"
  },
  "actions": [
    {
      "type": "shell",
      "command": "npx tsc --noEmit --skipLibCheck",
      "onError": "continue"
    },
    {
      "type": "ai-fix",
      "prompt": "Fix any TypeScript errors found in the previous command output. Focus on:\n1. Type mismatches\n2. Missing properties\n3. Null/undefined safety\n4. Import/export issues\n5. Interface compatibility\n\nOnly make minimal changes needed to resolve the errors.",
      "condition": "previous_command_failed"
    }
  ],
  "settings": {
    "autoFix": true,
    "reportLevel": "errors",
    "timeout": 30000
  }
}
```

## Auto-Fix Patterns

The hook will automatically attempt to fix:

### 1. Type Mismatches

- `string | null` vs `string | undefined`
- Missing optional properties (`?`)
- Array vs single item types

### 2. Null Safety

- Add `?.` operators for optional chaining
- Add null checks where needed
- Fix `useRef` initialization

### 3. Import Issues

- Add missing imports
- Fix import paths
- Remove unused imports

### 4. Interface Compatibility

- Align interface properties
- Add missing required properties
- Fix property types

### 5. Common Patterns

- Fix `any` type violations
- Add proper type annotations
- Fix function parameter types

## Usage

This hook runs automatically when you save any TypeScript or JavaScript file. You can also manually trigger it using the command palette:

1. Open Command Palette (`Ctrl+Shift+P`)
2. Search for "Run TypeScript Check"
3. Select the hook to run it manually

## Benefits

- **Immediate Feedback**: Catch type errors as soon as you save
- **Automatic Fixes**: Common issues are resolved without manual intervention
- **Consistent Code Quality**: Maintains type safety across the project
- **Development Speed**: Reduces time spent debugging type issues

## Example Fixes Applied

- Fixed Next.js 15 route handler parameter types (`params: Promise<{...}>`)
- Resolved null vs undefined type mismatches
- Added missing interface properties
- Fixed ESLint `any` type violations
- Corrected import/export issues

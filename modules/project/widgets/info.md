# Widgets

This folder contains reusable UI components that can be used across different parts of the application.

## Components

### SandboxLoading
- **Purpose**: Simple loading spinner shown while sandbox is starting
- **Features**: Clean Loader2 spinner with "Showing Preview..." text
- **Usage**: Displayed during sandbox creation to show loading state

### Iframe
- **Purpose**: Advanced iframe with optional communication capabilities
- **Features**: Window messaging, DOM interaction, element selection, loading states with sandbox loading spinner
- **Usage**: Used in both Chat Mode and Edit Mode for preview functionality

### CanvasFrame
- **Purpose**: Advanced frame container with full interaction capabilities for Edit Mode canvas
- **Features**: Resizable handles, drag & drop, element selection, DOM communication, Figma-like styling
- **Usage**: Main frame component for Edit Mode with complete interaction capabilities

## Design Guidelines

- All widgets should be reusable and mode-agnostic
- Use MobX observer pattern for reactive components
- Follow consistent styling with CSS variables from globals.css
- Include proper TypeScript interfaces for props

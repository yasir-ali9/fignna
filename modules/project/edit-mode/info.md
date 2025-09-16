# Edit Mode

This folder contains all components related to the **Edit Mode** of the application.

## Purpose

Edit Mode is where users can:
- Design and edit visual elements through Figma-like canvas interface
- Use canvas tools (move, hand, etc.) for direct manipulation
- Manipulate layers and frames visually
- Access style properties panels
- Chat with AI for design assistance (same AI-driven experience as Chat Mode)
- Interact with the isolated project rendered in iframe within canvas

## Components

- **bottom-ribbon/**: Floating toolbar with AI prompt and canvas tools
- **central/**: Main canvas area with zoom controls and infinite canvas
- **left-panel/**: Layers, Pages, and Code tabs
- **right-panel/**: Styles and Chat tabs

## Shared Components

- **top-ribbon**: Now located in `../common/top-ribbon` for reuse across modes

## Similar To

- Figma's design interface
- Framer's canvas mode

This mode focuses on visual design and direct manipulation of UI elements.

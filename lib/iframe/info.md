# Iframe Communication

This folder contains the iframe communication system for Phase 2 features.

## Purpose

Provides a Penpal-style window messaging system for real-time communication between the main app and iframe content.

## Components

### penpal-types.ts
- **Purpose**: TypeScript interfaces for iframe communication
- **Features**: DOM element types, layer nodes, method signatures
- **Usage**: Type definitions for parent-child iframe communication

### communication.ts
- **Purpose**: Core communication class with window messaging
- **Features**: Promise-based method calls, timeout handling, error management
- **Usage**: Establishes bidirectional communication with iframes

## Features

- ✅ **Bidirectional Communication**: Parent ↔ Child window messaging
- ✅ **Promise-based API**: Async method calls with timeout handling
- ✅ **DOM Interaction**: Element selection, styling, layer tree building
- ✅ **Error Handling**: Graceful fallbacks for external sites
- ✅ **Type Safety**: Full TypeScript support

## Usage Example

```typescript
import { createParentCommunication } from '@/lib/iframe/communication';

const comm = createParentCommunication(iframeElement);
const element = await comm.callMethod('getElementAtLoc', x, y);
await comm.callMethod('highlightElement', element.selector);
```

## Phase 2 Integration

This system enables:
- Real-time element selection in Edit Mode
- DOM manipulation from the canvas
- Layer tree synchronization
- Visual element highlighting
- Style property editing

## Security

- ✅ Origin validation support
- ✅ Method whitelisting
- ✅ Timeout protection
- ✅ Graceful degradation for external sites

---
id: overview
title: GameByte Framework
description: Modern Mobile-First Game Development Framework for JavaScript/TypeScript
sidebar_position: 1
slug: /
keywords: [gamebyte, game framework, javascript, typescript, pixi, three.js, mobile games]
llm_summary: "GameByte is a comprehensive game framework unifying 2D (Pixi.js) and 3D (Three.js) with Laravel-inspired architecture. Entry point: createGame(). Key services: renderer, scene.manager, physics, audio, input."
---

<!-- llm-context: game-framework, mobile-first, pixi-v8, three-js, service-container, typescript -->

# GameByte Framework

**Modern Mobile-First Game Development Framework**

GameByte is a comprehensive JavaScript game framework that unifies 2D and 3D game development with Laravel-inspired architecture. Build mobile-optimized games with a clean, maintainable codebase.

## Features

| Feature | Description |
|---------|-------------|
| **Dual Rendering** | Pixi.js v8 (2D) & Three.js (3D) |
| **Laravel Architecture** | Service providers, dependency injection, facades |
| **Modern UI System** | Gradients, glow, shadows, animations |
| **Scene Management** | Smooth transitions & lifecycle management |
| **Physics Integration** | Matter.js (2D) & Cannon.js (3D) |
| **Audio System** | Spatial audio, music, SFX with mobile optimization |
| **Mobile-First** | 44px touch targets, performance optimizations |
| **TypeScript** | 100% type safety |

## Quick Example

```typescript
import { createGame } from '@gamebyte/framework';

// Create and initialize
const game = createGame();
await game.initialize(canvas, '2d');

// Get services
const renderer = game.make('renderer');
const sceneManager = game.make('scene.manager');

// Start game loop
game.start();
```

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                  GameByte App                    │
├─────────────────────────────────────────────────┤
│  Facades: Renderer, Scenes, UI, Audio, Input    │
├─────────────────────────────────────────────────┤
│              Service Container                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Renderer │ │ Scenes  │ │ Physics │ ...       │
│  │Provider │ │Provider │ │Provider │           │
│  └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────┤
│     Pixi.js v8     │      Three.js             │
└─────────────────────────────────────────────────┘
```

## Installation

```bash
npm install @gamebyte/framework
```

Or use via CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@gamebyte/framework/dist/gamebyte.umd.js"></script>
```

## Next Steps

- [Installation Guide](/getting-started/installation) - Detailed setup instructions
- [Quick Start](/getting-started/quick-start) - Build your first game in 5 minutes
- [Core Concepts](/core-concepts/architecture) - Understand the architecture
- [API Reference](/api-reference) - Complete API documentation

## For AI Agents

GameByte is optimized for AI-driven development:

- **Minimal context**: Core API is ~2000 tokens
- **Discoverable**: All docs include semantic keywords
- **Type-rich**: Full TypeScript support with JSDoc

See the [AI Agent Guide](/ai-agent-guide) for integration details.

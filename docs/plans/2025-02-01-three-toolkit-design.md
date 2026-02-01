# Three.js 3D Game Toolkit Design

**Date:** 2025-02-01
**Status:** Approved
**Target:** 3D Puzzle/Strategy Games (isometric, tower defense, grid-based)

## Overview

Expand GameByte Framework's Three.js support with high-level components for 3D strategy and puzzle games. Follows the same philosophy as the Pixi.js UI components - helpers that work with pure Three.js, not replacements.

## Architecture

```
src/three/
├── cameras/
│   ├── IsometricCamera.ts      # Orthographic isometric preset
│   ├── StrategyCamera.ts       # Perspective top-down with controls
│   └── CameraController.ts     # Pan, zoom, rotate, bounds
│
├── grids/
│   ├── GridSystem.ts           # Base grid interface
│   ├── SquareGrid.ts           # Square tile grid
│   ├── HexGrid.ts              # Hexagonal grid
│   └── GridRenderer.ts         # Visual grid rendering
│
├── interaction/
│   ├── Object3DPicker.ts       # Raycasting object selection
│   ├── DragController.ts       # 3D drag and drop
│   └── GestureHandler3D.ts     # Tap, drag, pinch unified
│
├── ui/
│   ├── Billboard.ts            # Always-face-camera sprites
│   ├── HealthBar3D.ts          # In-world health bars
│   ├── SelectionIndicator.ts   # Selection rings/highlights
│   └── FloatingText.ts         # Damage numbers, labels
│
└── helpers/
    ├── ObjectPool3D.ts         # 3D object pooling
    ├── Pathfinder.ts           # A* on grid
    └── StateMachine.ts         # Simple FSM for entities
```

## Components

### 1. Camera System

**IsometricCamera** - True isometric with orthographic projection
- 45° rotation, 35.264° tilt (classic isometric angle)
- Configurable view size and zoom
- Works with CameraController

**StrategyCamera** - Perspective top-down (Clash Royale style)
- Configurable FOV, distance, angle, tilt
- Target-based look-at
- Works with CameraController

**CameraController** - Unified camera controls
- Pan (drag), zoom (pinch/scroll), optional rotate
- Bounds enforcement with soft edges
- Momentum/inertia on release
- Smooth interpolation

### 2. Grid System

**IGridSystem** - Common interface for all grids
- worldToCell / cellToWorld conversion
- Cell data storage (get/set/clear)
- Neighbor queries
- Pathfinding integration (isWalkable, movementCost)

**SquareGrid** - Rectangular tile grid
- Configurable width, height, cell size
- 4-way or 8-way neighbors
- Origin at center or corner

**HexGrid** - Hexagonal grid
- Cube coordinates (q, r, s)
- Flat-top or pointy-top orientation
- Ring and line queries

**GridRenderer** - Visual grid helper
- Configurable line style
- Cell highlighting
- Debug visualization

### 3. Interaction System

**Object3DPicker** - Raycasting selection
- Layer-based filtering
- Single and multi-pick
- Hover enter/exit events

**DragController** - Drag and drop
- Plane-constrained movement
- Optional grid snapping
- Ghost preview
- Validation callback

**GestureHandler3D** - Unified touch/mouse input
- Tap, double-tap, long-press
- Drag with velocity
- Pinch to zoom
- Connects to camera, picker, dragger

### 4. In-World UI

**Billboard** - Camera-facing sprite
- Fixed or distance-scaled size
- Texture or canvas source
- Attach to parent object

**HealthBar3D** - Floating health bar
- Animated value changes
- Low health color change
- Auto-hide when full

**SelectionIndicator** - Selection visualization
- Ring, square, hex shapes
- Pulse animation
- Multi-select support

**FloatingText** - Damage numbers, labels
- Rise-fade, pop, bounce animations
- Pooled for performance
- Auto-removal after animation

### 5. Game Helpers

**ObjectPool3D** - Object reuse
- Factory function pattern
- Auto scene management
- Warmup and stats

**Pathfinder** - A* pathfinding
- Works with any IGridSystem
- Diagonal support
- Movement range queries
- Path visualization

**StateMachine** - Entity behavior
- State definitions with enter/update/exit
- Trigger-based transitions
- Instance per entity
- Debug history

## Demos

1. **3d-camera-demo.html** - Camera switching and controls
2. **3d-grid-demo.html** - Square/hex grid interaction
3. **3d-tower-defense-demo.html** - Complete mini-game using all components
4. **3d-hex-strategy-demo.html** - Hex grid with unit movement

## Documentation

New section: `docs-site/docs/three-toolkit/`
- overview.md
- cameras.md
- grids.md
- interaction.md
- world-ui.md
- helpers.md

## Implementation Order

1. **Phase 1: Foundation** - Cameras, CameraController
2. **Phase 2: Grids** - GridSystem, SquareGrid, HexGrid, GridRenderer
3. **Phase 3: Interaction** - Picker, Dragger, GestureHandler3D
4. **Phase 4: UI** - Billboard, HealthBar3D, SelectionIndicator, FloatingText
5. **Phase 5: Helpers** - ObjectPool3D, Pathfinder, StateMachine
6. **Phase 6: Demos** - All four demos
7. **Phase 7: Docs** - Documentation pages

## Key Principles

- Work with pure Three.js objects (extend THREE.Group where appropriate)
- No heavy abstraction - these are helpers
- Mobile-first (touch gestures, performance)
- Proper resource disposal
- TypeScript with full type safety

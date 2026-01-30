# GameByte Agent Guide

AI-optimized documentation for autonomous agents and code assistants.

## Documentation Tiers

**Tier 1 - Core Knowledge (Load by default)**
- `CORE_API.md` - Essential API including reactive state (~2500 tokens)
- `QUICK_REFERENCE.md` - Command cheatsheet (~600 tokens)

**Tier 1.5 - Feature Modules (Load when relevant)**
- `UI_EFFECTS.md` - Celebration effects, sparkles, confetti (~1500 tokens)

**Tier 2 - Discoverable Guides**
- Search with: `grep -r "keyword" docs/guides/`
- Or: Semantic search in RAG system

**Tier 3 - Working Examples**
- Pattern library: `examples/`
- Runnable demos: `docs-site/static/demos/`

## Key Features

- **Reactive State** - Vue/Svelte-inspired `createState()` for auto-updating UI
- **15+ UI Components** - GameStyleButton, TopBar, HexagonButton, MergeGrid, etc.
- **Celebration Effects** - Confetti, Shimmer, Starburst via CelebrationManager
- **Mobile-First** - 44px touch targets, performance tiers, responsive scaling
- **Dual Rendering** - Pixi.js v8 (2D) + Three.js (3D)

## Usage for AI Agents

1. **Load Tier 1** - Read CORE_API.md before any game creation
2. **Discovery** - Use grep/semantic search when encountering unknown patterns
3. **Examples** - Reference working code for complex features

## Quick Imports

```typescript
// Core
import { createGame, createState, computed } from 'gamebyte-framework';

// UI Components
import { UIButton, TopBar, GameStyleButton, ArcheroMenu } from 'gamebyte-framework';

// Facades
import { Renderer, Scenes, UI, Audio, Input, Physics } from 'gamebyte-framework';
```

---

<!-- keywords: agent, ai, documentation, guide, getting-started, reactive, state -->

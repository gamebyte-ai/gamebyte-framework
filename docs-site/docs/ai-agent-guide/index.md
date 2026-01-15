---
id: index
title: AI Agent Guide
description: Guide for AI agents and code assistants using GameByte
sidebar_position: 1
keywords: [ai, agent, llm, rag, integration]
llm_summary: "AI-optimized docs: Core API ~2000 tokens at /ai-agent-guide/core-api. Quick reference ~500 tokens at /ai-agent-guide/quick-reference. Use llms.txt for discovery."
---

<!-- llm-context: ai-agent, llm-integration, rag, context-efficient, code-assistant -->

# AI Agent Guide

GameByte is optimized for AI-driven development with tiered documentation and discoverable patterns.

## Quick Start for Agents

### 1. Load Core Knowledge (Required)

Read these files first:
- **Core API**: `/ai-agent-guide/core-api` (~2000 tokens)
- **Quick Reference**: `/ai-agent-guide/quick-reference` (~500 tokens)

### 2. Discover Topics (As Needed)

```bash
# Search guides by keyword
grep -r "physics" docs/
grep -r "mobile.*optimization" docs/
```

### 3. Reference Examples

Check `examples/` directory for working code patterns.

## Documentation Tiers

| Tier | Content | Tokens | When to Load |
|------|---------|--------|--------------|
| **Tier 1** | Core API | ~2000 | Always (pre-loaded) |
| **Tier 2** | Advanced guides | Variable | On-demand |
| **Tier 3** | Working examples | Variable | For patterns |

## LLM Integration

### llms.txt

The `/llms.txt` file provides a machine-readable index:

```
GET https://docs.gamebyte.dev/llms.txt
```

### Semantic Search

All markdown docs include semantic keywords:

```markdown
<!-- llm-context: physics, collision, 2d, matter-js -->
```

### Frontmatter

Each page includes:
- `llm_summary`: One-line API summary
- `keywords`: Searchable terms
- `llm-context`: Semantic context tags

## Key Patterns

### Minimal Game Setup

```typescript
const game = createGame();
await game.initialize(canvas, '2d');
game.start();
```

### Service Resolution

```typescript
const renderer = game.make('renderer');
const sceneManager = game.make('scene.manager');
const input = game.make('input');
```

### Scene Creation

```typescript
class MyScene extends BaseScene {
    constructor() { super('my-scene', 'My Scene'); }
    async initialize() { await super.initialize(); /* setup */ }
    update(deltaTime: number) { super.update(deltaTime); /* logic */ }
}
```

## Common Tasks

| Task | Pattern |
|------|---------|
| Create game | `createGame()` → `initialize(canvas, '2d')` → `start()` |
| Add scene | `sceneManager.add(new Scene())` → `switchTo('id')` |
| Create button | `new UIButton({ text, width, height, backgroundColor })` |
| Play audio | `Music.play(key)` or `SFX.play(key)` |
| Handle input | `input.keyboard.on('KeyW', callback)` |
| Add physics | `Physics.create2DWorld()` → `createBody()` |

## Smart Defaults

GameByte has 40+ auto-configured settings. Only override when needed:

- Touch targets: 44px (Apple HIG)
- Render resolution: Device pixel ratio
- Physics timestep: 1/60
- Audio volumes: Master=1, Music=0.7, SFX=1

## Integration Tips

1. **Start with Core API** - Covers 80% of use cases
2. **Use semantic search** - Keywords in all docs
3. **Check examples** - Real working code
4. **Smart defaults** - Don't over-configure
5. **Type-safe** - Full TypeScript support

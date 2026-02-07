---
id: changelog
title: Changelog
description: All notable changes to GameByte Framework
sidebar_position: 1
slug: /changelog
keywords: [changelog, releases, versions, updates, migration]
---

# Changelog

<div style={{textAlign: 'center', marginBottom: '2rem'}}>
  <img src="/img/changelog/changelog-timeline.png" alt="GameByte Framework Version Timeline" style={{borderRadius: '12px', maxWidth: '100%', boxShadow: '0 4px 20px rgba(124, 68, 234, 0.3)'}} />
</div>

All notable changes to GameByte Framework are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## Releases

### [v1.3.0 — Comprehensive Feature Expansion](/changelog/v1.3.0) {#v130}

**February 6, 2026** | [GitHub Release](https://github.com/gamebyte-ai/gamebyte-framework/releases/tag/v1.3.0)

<div style={{textAlign: 'center', margin: '1.5rem 0'}}>
  <img src="/img/changelog/v1.3.0-hero.png" alt="v1.3.0 Release" style={{borderRadius: '12px', maxWidth: '100%', boxShadow: '0 4px 20px rgba(124, 68, 234, 0.2)'}} />
</div>

The largest release in GameByte history. **10 new feature modules**, 5 new facades, 50+ new files, and 15,000+ lines of production code.

| New Module | What It Does |
|:-----------|:-------------|
| **TickSystem** | Per-component render loop with priority ordering |
| **ResourceTracker** | Auto-dispose scoped resource lifecycle |
| **RaycastEventSystem** | DOM-like 3D pointer events with bubbling |
| **PerformanceAdvisor** | Adaptive quality tiers with thermal protection |
| **InstanceManager** | Automatic GPU instancing at 3+ copies |
| **PostProcessingPipeline** | Effect merging via pmndrs/postprocessing |
| **EnvironmentSystem** | Skybox, fog, sun presets with smooth transitions |
| **PrefabSystem** | JSON-driven prefabs with ECS-lite components |
| **SmartAssetPipeline** | Priority loading with memory budgets & LRU eviction |
| **GameSoundPresets** | 15 procedural game sounds (zero file deps) |

**Breaking changes:** 2 low-severity changes. See [full release notes](/changelog/v1.3.0#breaking-changes).

[**Read full v1.3.0 release notes &rarr;**](/changelog/v1.3.0)

---

### v1.2.1 {#v121}

**February 6, 2026** | [GitHub Release](https://github.com/gamebyte-ai/gamebyte-framework/releases/tag/v1.2.1)

Bug fixes and demo improvements.

**Fixed:**
- CI/CD release workflow permissions and npm publish
- Platform-specific rollup dependency breaking CI
- Deprecated API calls in demos

**Added:**
- Comprehensive Pixi.js v8 and Three.js feature support
- 6 diverse game demos with different mechanics
- LiveDemo iframes in documentation pages
- A\* Pathfinder for grid-based navigation
- CameraController component

---

### v1.2.0 — @pixi/ui Integration {#v120}

**January 30, 2026** | [GitHub Release](https://github.com/gamebyte-ai/gamebyte-framework/releases/tag/v1.2.0)

Complete integration of [@pixi/ui](https://github.com/pixijs/ui) with game-style "jellybean" wrappers.

**New UI Components:**
- `GameCheckBox` — Touch-friendly checkbox with animation
- `GameRadioGroup` — Radio button group with dot indicator
- `GameList` — Auto-layout wrapper around @pixi/ui List
- `GameInput` — Styled text input with focus states
- `GameScrollBox` — Scrollable container with styled frame
- `GameSelect` — Dropdown select with backdrop closing

**Also:**
- `GameStyleButton` horizontal padding + auto text scaling
- 6 new color schemes (input, scrollbox, select, checkbox, radio, list)
- New `pixi-ui-components-demo.html` demo

**Dependencies:** Added `@pixi/ui: ^2.3.2`

---

### v1.1.0 — AI-Agent-Friendly Framework {#v110}

**January 15, 2026**

Made the framework discoverable and usable by AI agents.

**Added:**
- `docs/agent-guide/CORE_API.md` — Essential API (~2000 tokens)
- `docs/agent-guide/QUICK_REFERENCE.md` — Command cheatsheet
- 9+ advanced guides with semantic keyword enrichment
- Self-contained HTML examples (`examples/platformer/`, `examples/ui-showcase/`)
- `npm run validate:agent-docs` validation script

---

### v0.1.0 — Initial Release {#v010}

**January 2025**

Foundation release with core framework architecture.

- Service Container with dependency injection
- Pixi.js v8 (2D) and Three.js (3D) rendering
- Scene management with lifecycle hooks
- Plugin system with npm-style architecture
- Mobile-first design with adaptive quality scaling
- Complete TypeScript strict mode support

---

## Versioning Strategy

GameByte follows [Semantic Versioning](https://semver.org/):

| Version Part | When It Bumps | Example |
|:-------------|:-------------|:--------|
| **Major** (X.0.0) | Breaking API changes that require code updates | Removing a public method |
| **Minor** (0.X.0) | New features, backwards-compatible | Adding new modules |
| **Patch** (0.0.X) | Bug fixes, docs, CI/CD | Fixing a rendering glitch |

:::tip For AI Agents
The latest API reference is always available at [`/llms-full.txt`](/llms-full.txt) (2,200+ lines, copy-pasteable code examples for every exported class).
:::

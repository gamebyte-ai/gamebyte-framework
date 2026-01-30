# Changelog

All notable changes to GameByte Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-30

### Added - @pixi/ui Integration

Complete integration of [@pixi/ui](https://github.com/pixijs/ui) library with game-style wrappers that maintain the framework's "jellybean" visual style.

**New UI Components:**
- `GameCheckBox` - Checkbox with jellybean styling, checkmark animation, touch-friendly (32px min)
- `GameRadioGroup` - Radio button group with circular buttons, dot indicator, horizontal/vertical layout
- `GameList` - Layout wrapper around @pixi/ui List for automatic child arrangement
- `GameInput` - Text input wrapping @pixi/ui Input with custom focus states and styled background
- `GameScrollBox` - Scrollable container wrapping @pixi/ui ScrollBox with styled frame
- `GameSelect` - Dropdown select with jellybean trigger button, dropdown panel, and click-outside-to-close

**New Color Schemes (GameStyleUITheme):**
- `GAME_INPUT` - Input field colors (background, focus, border, text, placeholder)
- `GAME_SCROLLBOX` - Scrollbox colors (background, border, scrollbar track/thumb)
- `GAME_SELECT` - Select dropdown colors (trigger, dropdown, items)
- `GAME_CHECKBOX` - Checkbox colors (box, checkmark, states)
- `GAME_RADIO` - Radio button colors (circle, dot, states)
- `GAME_LIST` - List container colors

**New Exports:**
- All new components exported directly from `gamebyte-framework`
- `PixiUI` namespace re-export for advanced users needing raw @pixi/ui access
- Type exports for all config interfaces and color schemes

**Demo:**
- `docs-site/static/demos/pixi-ui-components-demo.html` - Interactive demo showcasing all new components

### Added - GameStyleButton Enhancements

- `horizontalPadding` config option (default: 12px) for safe text padding from button edges
- Auto text scaling - text automatically scales down if it exceeds available button width
- Prevents text overflow on buttons with long labels or icons

### Fixed

**GameSelect:**
- Dropdown z-index issue - dropdown now brought to front when opened via `bringToFront()` method
- Click-outside-to-close - implemented invisible backdrop approach for reliable dropdown closing

**GameStyleButton:**
- Unified text styling across all button color schemes (yellow, green, blue, red, purple)
- All buttons now use identical drop shadow and stroke styling
- Removed `isLightColor` conditional logic - simpler, more predictable rendering

### Changed

**Pixi.js v8 Compatibility:**
- `ThreeGraphicsFactory` updated to handle Pixi v8 `dropShadow` object format
- Text style uses `stroke: { color, width }` object format (v8 standard)
- Removed deprecated v7-style text properties

### Dependencies

- Added `@pixi/ui: ^2.3.2` to dependencies and peerDependencies

---

## [1.1.0] - 2026-01-15

### Added - AI-Agent-Friendly Framework

**Tier 1: Core Knowledge**
- `docs/agent-guide/CORE_API.md` - Essential API guide (~2000 tokens)
- `docs/agent-guide/QUICK_REFERENCE.md` - Command cheatsheet
- Minimal context for rapid prototyping

**Tier 2: Discoverable Documentation**
- `docs/guides/` - 9+ advanced guides with semantic keywords
- Keyword-enriched markdown for grep/semantic search
- Physics, UI, Audio guides reorganized with discovery tags

**Tier 3: Working Examples**
- `examples/platformer/` - Physics-based platformer
- `examples/ui-showcase/` - UI component demonstration
- Self-contained HTML examples with inline code

**Developer Experience**
- Enhanced JSDoc examples in core classes
- README updated with "For AI Agents" section
- `npm run validate:agent-docs` validation script
- `docs/agent-guide/INTEGRATION.md` for RAG/LLM integration

---

## [Unreleased]

### Added
- Initial framework architecture with Laravel-inspired patterns
- Service Container with dependency injection and IoC
- Service Provider system for modular service registration
- Facade pattern for static access to services
- Comprehensive scene management with lifecycle hooks
- Modular rendering system supporting both 2D (Pixi.js) and 3D (Three.js)
- Plugin system with npm-style architecture
- Performance monitoring and optimization features
- Mobile-first design with adaptive quality scaling
- Complete TypeScript support with strict typing
- Interactive demo showcasing framework capabilities
- Comprehensive test suite with 100% coverage goals

### Technical Features
- Unified API abstraction hiding underlying technology details
- Tree-shakeable modular bundles for optimal performance
- Clean separation between 2D and 3D rendering paths
- Enterprise-ready architecture patterns
- Cross-platform compatibility (web, mobile, desktop)

### Documentation
- Complete README with usage examples
- API documentation and guides
- Contributing guidelines and code standards
- Release procedures and versioning workflow
- Interactive demo with live examples
- Conceptual GameByte V2 docs: API reference, Tetris quickstart, and extensibility guide

## [0.1.0] - 2025-01-XX (Initial Release)

### Added
- Core framework foundation
- Basic rendering capabilities
- Initial scene management
- Service container implementation
- TypeScript configuration and build system

---

**Note**: This is the initial development phase. The framework is not yet ready for production use. We recommend waiting for the 1.0.0 stable release for production applications.
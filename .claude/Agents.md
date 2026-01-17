# GameByte Agent Guidelines

> **Read First:** [docs/PHILOSOPHY.md](../docs/PHILOSOPHY.md) - Framework philosophy and principles

---

## Framework Mission

**GameByte Framework = Lego Blocks for AI-Driven Mobile Game Development**

This framework is a modular system designed to accelerate mobile game production by AI agents. Every agent using this system follows the principles below.

---

## Agent Types & Responsibilities

### Core Architecture Agents
| Agent | Primary Responsibility |
|-------|----------------------|
| `core-architecture-designer` | Framework foundation, service container, unified APIs |
| `scene-management-architect` | Scene lifecycle, transitions, memory management |
| `asset-management-architect` | Asset loading, caching, optimization |
| `game-loop-performance-optimizer` | FPS, memory, batch rendering, pooling |

### Game Systems Agents
| Agent | Primary Responsibility |
|-------|----------------------|
| `physics-integration-architect` | 2D/3D physics, collision, platformer mechanics |
| `input-interaction-system-architect` | Touch, gestures, keyboard, gamepad |
| `audio-system-architect` | Music, SFX, spatial audio, mobile optimization |
| `animation-graphics-engine` | Animations, particles, shaders, visual effects |

### UI/UX Agents
| Agent | Primary Responsibility |
|-------|----------------------|
| `ui-ux-components-architect` | Mobile-first UI components, responsive design |
| `interface-design-architect` | UX patterns, navigation, accessibility |
| `visual-design-architect` | Art direction, color systems, visual polish |

### Quality & Documentation Agents
| Agent | Primary Responsibility |
|-------|----------------------|
| `qa-test-framework-engineer` | Tests, validation, build verification |
| `qa-validation-architect` | Quality gates, performance testing |
| `framework-docs-architect` | Documentation, guides, examples |

### Platform & Optimization Agents
| Agent | Primary Responsibility |
|-------|----------------------|
| `mobile-cross-platform-optimizer` | Device detection, adaptive quality, thermal management |
| `technical-art-optimizer` | Asset optimization, texture compression |
| `level-design-architect` | Progression curves, difficulty balancing |

---

## The Lego Block Principle

### When Adding Code

Every new piece of code should be a "lego block":

```typescript
// GOOD: Self-contained, reusable, composable
export class MatchThreeGrid {
  constructor(options: MatchThreeGridOptions) { }
  // Clear API, sensible defaults, documented
}

// BAD: Tightly coupled, game-specific assumptions
function handleMatch() {
  // Hard-coded values, no reusability
}
```

### Contribution Checklist

Before every commit:

- [ ] **Is it a reusable block?** - Can it be used in other games?
- [ ] **Does it have sensible defaults?** - Can agent use with minimal config?
- [ ] **Is it mobile-first?** - Touch-friendly, performant?
- [ ] **Is it documented?** - JSDoc + guide + example?
- [ ] **Does it follow existing patterns?** - Consistent with existing API style?
- [ ] **Is it 100% working?** - No partial implementations

---

## Code Standards

### TypeScript Requirements

```typescript
/**
 * [Component Name] - [One-line description]
 *
 * @example Basic usage
 * ```typescript
 * const component = new Component({
 *   required: 'value',
 *   // optional params shown with defaults
 * });
 * ```
 *
 * @example With customization
 * ```typescript
 * const component = new Component({
 *   required: 'value',
 *   optional: 'custom'
 * });
 * ```
 */
export class Component {
  constructor(options: ComponentOptions) {
    // Apply defaults
    const config = {
      ...DEFAULT_OPTIONS,
      ...options
    };
  }
}

export interface ComponentOptions {
  /** Required parameter description */
  required: string;

  /** Optional parameter description @default 'default' */
  optional?: string;
}
```

### Export Requirements

Every public component must:
1. Be exported from `src/index.ts`
2. Be exported with its types
3. Be accessible in UMD build

### Mobile-First Requirements

```typescript
// Touch target sizing
const MIN_TOUCH_SIZE = 44; // px (Apple HIG)

// Button example
new UIButton({
  width: Math.max(width, MIN_TOUCH_SIZE),
  height: Math.max(height, MIN_TOUCH_SIZE)
});
```

---

## Documentation Requirements

### Tier 1: Core API (Required for all public APIs)

Location: `docs/agent-guide/CORE_API.md`

```markdown
### Component Name

```typescript
// 5-line minimal example
const component = new Component({ required: 'value' });
stage.addChild(component.getContainer());
```

**What it does:** One sentence
**When to use:** One sentence
```

### Tier 2: Guide (Required for complex features)

Location: `docs/guides/[feature-name].md`

```markdown
# Feature Name

One paragraph description.

<!-- keywords: relevant, search, terms, for, agents -->

## Basic Usage
[Code example]

## Advanced Configuration
[Options table + examples]

## Common Patterns
[Real-world usage patterns]

## Related Guides
[Links to related docs]
```

### Tier 3: Example (Required for game mechanics)

Location: `examples/[genre]/`

```
examples/
  [genre]/
    index.html      # Runnable demo
    README.md       # What it demonstrates
```

---

## Quality Gates

### Before Merge

1. **Build passes:** `npm run build`
2. **Tests pass:** `npm test`
3. **Lint clean:** `npm run lint`
4. **Docs complete:** All tiers documented
5. **Example works:** Runnable in browser

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS | 60 | On mid-tier mobile |
| Bundle impact | < 50KB | Per major feature |
| Memory | No leaks | Scene transitions |
| Touch response | < 100ms | Input to visual |

---

## Agent Communication

### When to Spawn Sub-Agents

```
Complex task decomposition:
- Physics system -> physics-integration-architect
- UI components -> ui-ux-components-architect
- Performance issues -> game-loop-performance-optimizer
- Asset optimization -> technical-art-optimizer
```

### Information to Pass

```typescript
// When spawning sub-agent, provide:
{
  context: "Current game genre/type",
  constraints: "Mobile-first, 60 FPS target",
  existing_code: "Relevant file paths",
  expected_output: "Working component with docs"
}
```

---

## Common Patterns

### Creating a New Game Mechanic

```
1. Research: Analyze successful mobile games
2. Design: Define minimal API
3. Implement: Build core logic
4. Polish: Add effects, sounds, haptics
5. Document: Tier 1, 2, 3 docs
6. Example: Create runnable demo
7. Test: Write unit/integration tests
```

### Extending Existing Features

```
1. Read: Understand current implementation
2. Plan: Identify extension points
3. Extend: Use composition over modification
4. Verify: Ensure backward compatibility
5. Document: Update affected docs
```

### Fixing Bugs

```
1. Reproduce: Create minimal test case
2. Root cause: Identify actual issue
3. Fix: Minimal change, no over-engineering
4. Test: Add regression test
5. Document: Update if behavior changed
```

---

## Genre-Specific Guidelines

### Hyper-Casual
- One-tap/one-swipe core mechanic
- < 3 second learn time
- Satisfying feedback loops
- Clean, minimal UI

### Puzzle (Match-3, Merge)
- Grid-based systems
- Clear visual feedback
- Combo/chain mechanics
- Progress tracking

### Idle/Clicker
- Incremental progression
- Offline calculations
- Multiple currencies
- Prestige systems

### Platformer
- Physics-based movement
- Responsive controls
- Coyote time, variable jump
- Clear collision feedback

---

## File Organization

```
src/
  core/           # Framework foundation
  rendering/      # Pixi.js, Three.js integration
  ui/             # UI components
  scenes/         # Scene management
  physics/        # Physics engines
  audio/          # Audio systems
  input/          # Input handling
  assets/         # Asset management
  mechanics/      # Game mechanics (NEW)
    match-three/
    merge/
    idle/
    platformer/
  templates/      # Game templates (NEW)
    hyper-casual/
    puzzle/
    idle/
```

---

## Remember

> **"Every line of code should help an AI agent produce its next hit game."**

The purpose of this framework:
1. Enable AI agents to rapidly produce games
2. Deliver studio-quality polish
3. Create trend-aligned output
4. Work with minimal context

---

*This document is the foundational reference for all GameByte agents. Every agent follows these principles.*

<!-- keywords: agents, guidelines, standards, quality, mobile, framework, lego, blocks -->

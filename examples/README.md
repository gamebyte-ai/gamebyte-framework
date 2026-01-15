# GameByte Examples

Working code patterns demonstrating framework features.

<!-- keywords: examples, patterns, demos, working, runnable -->

---

## Available Examples

### 🎮 Game Patterns

| Example | Category | Demonstrates |
|---------|----------|--------------|
| `platformer/` | 2D Physics | Player controller, collision, jumping |
| `puzzle/` | Touch UI | Match-3 mechanics, touch input, animations |
| `shooter/` | 2D Action | Top-down movement, projectiles, collision |

### 🎨 UI Patterns

| Example | Focus | Components |
|---------|-------|------------|
| `ui-showcase/` | UI Components | All UI components, responsive scaling |

---

## Running Examples

**Development server:**
```bash
npm run dev
```

**Open in browser:**
- Platformer: http://localhost:8080/examples/platformer/index.html
- Puzzle: http://localhost:8080/examples/puzzle/index.html
- Shooter: http://localhost:8080/examples/shooter/index.html
- UI Showcase: http://localhost:8080/examples/ui-showcase/index.html

---

## File Naming Convention

```
examples/
  <category>/
    index.html              # Main entry point
    <category>-basic.html   # Minimal implementation
    <category>-advanced.html # Full-featured version
    README.md               # Category documentation
```

**Keywords in filenames:**
- `basic` - Minimal implementation
- `advanced` - Full-featured
- `optimized` - Performance-focused
- `mobile` - Mobile-specific

---

## Discovery

**Find by feature:**
```bash
grep -r "physics.*platformer" examples/
grep -r "touch.*swipe" examples/
```

**Find by complexity:**
```bash
ls examples/*/basic.html      # Simple examples
ls examples/*/advanced.html   # Complex examples
```

---

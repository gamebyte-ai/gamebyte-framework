# Gradient Migration to Pixi.js v8 FillGradient

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert all Canvas 2D gradient workarounds to native Pixi.js v8 FillGradient and remove dead gradient code.

**Architecture:** UIButton's gradient rendering currently creates a Canvas texture via `createCanvasTexture()` then applies it to a sprite - this is replaced with a direct `Gradients.linear.vertical()` call + `graphics.fill(gradient)`. The Canvas-based components (UIPanel, UIProgressBar) stay as-is because they render via `CanvasRenderingContext2D`, not Pixi.js Graphics. Dead code Canvas gradient helpers in GameStyleUITheme are removed.

**Tech Stack:** Pixi.js v8.16.0, TypeScript, `GradientFactory.ts` (existing Gradients facade)

---

### Task 1: Convert UIButton gradient from Canvas texture to native FillGradient

**Files:**
- Modify: `src/ui/components/UIButton.ts:1-6` (add import)
- Modify: `src/ui/components/UIButton.ts:256-278` (replace renderGradientBackground)
- Modify: `src/ui/components/UIButton.ts:472-484` (remove roundRect canvas helper)

**Step 1: Add Gradients import**

Replace the import block at line 1-5:
```typescript
import { EventEmitter } from 'eventemitter3';
import { IContainer, IGraphics, IText } from '../../contracts/Graphics';
import { graphics } from '../../graphics/GraphicsEngine';
import { Gradients } from '../../graphics/GradientFactory';
import { getFrameworkFontFamily } from '../utils/FontLoader';
import { lightenColor, darkenColor } from '../themes/GameStyleUITheme';
```

Note: Remove `numberToHex` from the import - it's no longer needed here.

**Step 2: Replace renderGradientBackground method**

Replace lines 256-278 with:
```typescript
  /**
   * Render gradient background
   */
  private renderGradientBackground(baseColor: number): void {
    const { width, height, borderRadius, gradient } = this.config;

    // Determine gradient colors
    const colorTop = gradient.colorTop !== undefined ? gradient.colorTop : lightenColor(baseColor, 0.2);
    const colorBottom = gradient.colorBottom !== undefined ? gradient.colorBottom : darkenColor(baseColor, 0.2);

    // Use native Pixi.js v8 FillGradient
    const fillGradient = Gradients.linear.vertical(colorTop, colorBottom);
    this.background.roundRect(0, 0, width, height, borderRadius);
    this.background.fill(fillGradient as any);
  }
```

**Step 3: Remove the Canvas roundRect helper**

Delete lines 472-484 (the private `roundRect(ctx, ...)` method). This was only used by the old Canvas gradient code.

**Step 4: Run build to verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add src/ui/components/UIButton.ts
git commit -m "refactor(UIButton): replace Canvas gradient with native Pixi.js v8 FillGradient"
```

---

### Task 2: Remove dead Canvas gradient helpers from GameStyleUITheme

**Files:**
- Modify: `src/ui/themes/GameStyleUITheme.ts:441-475` (remove functions)
- Modify: `src/ui/themes/index.ts:22-23` (remove re-exports)
- Modify: `src/index.ts:375-376` (remove re-exports)

**Step 1: Remove createGameButtonGradient and createSkyGradient from GameStyleUITheme.ts**

Delete lines 441-475 (both functions). These are dead code - no file imports them.

The functions to delete:
```typescript
// DELETE: createGameButtonGradient (lines 444-459)
// DELETE: createSkyGradient (lines 464-475)
```

Keep `numberToHex`, `lightenColor`, `darkenColor` - these ARE used by other components.

**Step 2: Remove re-exports from src/ui/themes/index.ts**

Remove lines 22-23:
```typescript
  createGameButtonGradient,
  createSkyGradient,
```

**Step 3: Remove re-exports from src/index.ts**

Remove lines 375-376:
```typescript
  createGameButtonGradient,
  createSkyGradient,
```

**Step 4: Verify no remaining references**

Run: `grep -r "createGameButtonGradient\|createSkyGradient" src/`
Expected: No matches

**Step 5: Run build to verify**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 7: Commit**

```bash
git add src/ui/themes/GameStyleUITheme.ts src/ui/themes/index.ts src/index.ts
git commit -m "refactor: remove unused Canvas gradient helpers (createGameButtonGradient, createSkyGradient)"
```

---

### Task 3: Verify all gradient patterns are consistent and build succeeds

**Files:**
- None modified - verification only

**Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Verify gradient pattern audit**

Run: `grep -rn "ctx\.createLinearGradient\|ctx\.createRadialGradient\|addColorStop" src/`

Expected results should ONLY show Canvas-rendering components (these are correct):
- `src/ui/components/UIPanel.ts` - Canvas 2D renderer (extends BaseUIComponent, renders via ctx)
- `src/ui/components/UIProgressBar.ts` - Canvas 2D renderer (extends BaseUIComponent, renders via ctx)

These files use `CanvasRenderingContext2D` for rendering (not Pixi.js Graphics), so Canvas gradients are the correct API for them.

All Pixi.js-based components should use either:
- `Gradients.linear.*` / `Gradients.radial.*` facade
- `graphics().createLinearGradient()` / `graphics().createRadialGradient()` factory
- Direct `new PIXI.FillGradient({...})`

**Step 4: Lint check**

Run: `npm run lint`
Expected: No new errors

**Step 5: Commit if any fixups needed**

Only if lint or build revealed issues in previous tasks.

---

## Architecture Notes for Future Reference

### When to use which gradient pattern:

| Component Type | Rendering System | Gradient API |
|---|---|---|
| Pixi.js Graphics-based (UIButton, GameStyleButton, HexagonLevelButton, etc.) | `IGraphics.fill()` | `Gradients.linear.*` or `new PIXI.FillGradient({...})` |
| Canvas 2D-based (UIPanel, UIProgressBar) | `ctx.fillRect()` / `ctx.fill()` | `ctx.createLinearGradient()` + `addColorStop()` |
| CSS/HTML-based (GameSplash) | CSS styles | `linear-gradient()`, `radial-gradient()` |

### Files confirmed as correctly using native Pixi.js v8 FillGradient:
- `src/graphics/GradientFactory.ts` - Core factory with `textureSpace: 'local'`
- `src/graphics/PixiGraphicsFactory.ts` - Factory wrapper
- `src/ui/components/HexagonLevelButton.ts` - `Gradients.linear.verticalSoft()`
- `src/ui/components/GameToggle.ts` - `Gradients.linear.vertical()`
- `src/ui/components/GameSlider.ts` - `Gradients.linear.vertical()`
- `src/ui/menus/ArcheroMenu.ts` - `graphics().createLinearGradient()`
- `src/ui/effects/SunburstEffect.ts` - `factory.createRadialGradient()`

# Game UI Polish & Reusability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Game UI Showcase pixel-perfect to the reference screenshot while ensuring all components are highly configurable and reusable across different games.

**Architecture:** Update existing components with new color schemes, improve visual rendering, and add missing configuration options. All visual properties are controlled through the theme system, allowing developers to easily customize appearances.

**Tech Stack:** TypeScript, PixiJS v8, GameByte Framework UI system

---

## Task 0: Create Safe Area + Letterbox Responsive System

**Files:**
- Create: `src/utils/SafeAreaLayout.ts`
- Modify: `src/index.ts` (add export)

**Step 1: Create SafeAreaLayout utility class**

Create `src/utils/SafeAreaLayout.ts`:

```typescript
/**
 * SafeAreaLayout - Safe Area + Letterbox responsive system
 *
 * Provides a "design resolution" based layout where:
 * - Game content is rendered at a fixed aspect ratio (safe area)
 * - Content is scaled to fit the screen while maintaining aspect ratio
 * - Letterbox bars fill excess space with background color/pattern
 *
 * Inspired by: Candy Crush, Homescapes, most mobile puzzle games
 *
 * @example
 * ```typescript
 * const layout = new SafeAreaLayout({
 *   designWidth: 390,
 *   designHeight: 844,
 *   minAspectRatio: 9 / 19.5,  // iPhone SE
 *   maxAspectRatio: 9 / 16,     // Standard 16:9
 *   backgroundColor: 0x0088EE
 * });
 *
 * // Get the game container (scaled and centered)
 * stage.addChild(layout.getContainer());
 *
 * // Add your game content to the safe area
 * layout.addChild(myGameUI);
 * ```
 */

export interface SafeAreaLayoutConfig {
  /** Design width (your reference design size) */
  designWidth: number;
  /** Design height (your reference design size) */
  designHeight: number;
  /** Minimum aspect ratio to support (width/height) - for tall phones */
  minAspectRatio?: number;
  /** Maximum aspect ratio to support (width/height) - for wide phones */
  maxAspectRatio?: number;
  /** Background color for letterbox areas */
  backgroundColor?: number;
  /** Whether to draw a subtle pattern in letterbox */
  showPattern?: boolean;
  /** Pattern opacity (0-1) */
  patternOpacity?: number;
}

export interface SafeAreaBounds {
  /** X offset of safe area from screen edge */
  x: number;
  /** Y offset of safe area from screen edge */
  y: number;
  /** Width of safe area */
  width: number;
  /** Height of safe area */
  height: number;
  /** Scale factor applied to design resolution */
  scale: number;
  /** Actual screen width */
  screenWidth: number;
  /** Actual screen height */
  screenHeight: number;
  /** Whether letterboxing is on top/bottom (true) or left/right (false) */
  isVerticalLetterbox: boolean;
}

export class SafeAreaLayout {
  private config: Required<SafeAreaLayoutConfig>;
  private container: any; // PIXI.Container
  private gameContainer: any; // PIXI.Container for game content
  private letterboxGraphics: any; // PIXI.Graphics for letterbox
  private bounds: SafeAreaBounds;
  private resizeCallbacks: Array<(bounds: SafeAreaBounds) => void> = [];

  constructor(config: SafeAreaLayoutConfig) {
    this.config = {
      designWidth: config.designWidth,
      designHeight: config.designHeight,
      minAspectRatio: config.minAspectRatio ?? 9 / 21, // iPhone 14 Pro Max
      maxAspectRatio: config.maxAspectRatio ?? 3 / 4,   // iPad
      backgroundColor: config.backgroundColor ?? 0x0088EE,
      showPattern: config.showPattern ?? true,
      patternOpacity: config.patternOpacity ?? 0.08
    };

    // Will be initialized when attached to stage
    this.bounds = this.calculateBounds(window.innerWidth, window.innerHeight);
  }

  /**
   * Initialize with PIXI objects (call after PIXI is available)
   */
  initialize(PIXI: any): void {
    this.container = new PIXI.Container();
    this.letterboxGraphics = new PIXI.Graphics();
    this.gameContainer = new PIXI.Container();

    this.container.addChild(this.letterboxGraphics);
    this.container.addChild(this.gameContainer);

    this.updateLayout(window.innerWidth, window.innerHeight);
    this.setupResizeListener();
  }

  /**
   * Calculate safe area bounds for given screen size
   */
  calculateBounds(screenWidth: number, screenHeight: number): SafeAreaBounds {
    const { designWidth, designHeight } = this.config;
    const designAspect = designWidth / designHeight;
    const screenAspect = screenWidth / screenHeight;

    let scale: number;
    let safeWidth: number;
    let safeHeight: number;
    let isVerticalLetterbox: boolean;

    if (screenAspect > designAspect) {
      // Screen is wider than design - letterbox on sides
      scale = screenHeight / designHeight;
      safeHeight = screenHeight;
      safeWidth = designWidth * scale;
      isVerticalLetterbox = false;
    } else {
      // Screen is taller than design - letterbox on top/bottom
      scale = screenWidth / designWidth;
      safeWidth = screenWidth;
      safeHeight = designHeight * scale;
      isVerticalLetterbox = true;
    }

    // Center the safe area
    const x = (screenWidth - safeWidth) / 2;
    const y = (screenHeight - safeHeight) / 2;

    return {
      x,
      y,
      width: safeWidth,
      height: safeHeight,
      scale,
      screenWidth,
      screenHeight,
      isVerticalLetterbox
    };
  }

  /**
   * Update layout when screen size changes
   */
  updateLayout(screenWidth: number, screenHeight: number): void {
    this.bounds = this.calculateBounds(screenWidth, screenHeight);

    // Update game container position and scale
    this.gameContainer.x = this.bounds.x;
    this.gameContainer.y = this.bounds.y;
    this.gameContainer.scale.set(this.bounds.scale);

    // Draw letterbox
    this.drawLetterbox();

    // Notify listeners
    this.resizeCallbacks.forEach(cb => cb(this.bounds));
  }

  /**
   * Draw letterbox areas
   */
  private drawLetterbox(): void {
    if (!this.letterboxGraphics) return;

    const g = this.letterboxGraphics;
    const { backgroundColor, showPattern, patternOpacity } = this.config;
    const { screenWidth, screenHeight, x, y, width, height, isVerticalLetterbox } = this.bounds;

    g.clear();

    // Fill entire screen with background
    g.rect(0, 0, screenWidth, screenHeight);
    g.fill({ color: backgroundColor });

    // Add subtle pattern if enabled
    if (showPattern) {
      this.drawPattern(g, screenWidth, screenHeight, patternOpacity);
    }

    // Draw slightly darker letterbox areas for visual separation
    if (isVerticalLetterbox) {
      // Top letterbox
      if (y > 0) {
        g.rect(0, 0, screenWidth, y);
        g.fill({ color: 0x000000, alpha: 0.1 });
      }
      // Bottom letterbox
      if (y + height < screenHeight) {
        g.rect(0, y + height, screenWidth, screenHeight - (y + height));
        g.fill({ color: 0x000000, alpha: 0.1 });
      }
    } else {
      // Left letterbox
      if (x > 0) {
        g.rect(0, 0, x, screenHeight);
        g.fill({ color: 0x000000, alpha: 0.1 });
      }
      // Right letterbox
      if (x + width < screenWidth) {
        g.rect(x + width, 0, screenWidth - (x + width), screenHeight);
        g.fill({ color: 0x000000, alpha: 0.1 });
      }
    }
  }

  /**
   * Draw subtle background pattern
   */
  private drawPattern(g: any, width: number, height: number, opacity: number): void {
    const spacing = 60;
    const size = 20;

    for (let px = 0; px < width + spacing; px += spacing) {
      for (let py = 0; py < height + spacing; py += spacing) {
        const offsetX = (py / spacing) % 2 === 0 ? 0 : spacing / 2;
        g.rect(px + offsetX - size / 2, py - size / 2, size, size);
        g.stroke({ color: 0xFFFFFF, width: 2, alpha: opacity });
      }
    }
  }

  /**
   * Setup window resize listener
   */
  private setupResizeListener(): void {
    window.addEventListener('resize', () => {
      this.updateLayout(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Add callback for resize events
   */
  onResize(callback: (bounds: SafeAreaBounds) => void): void {
    this.resizeCallbacks.push(callback);
  }

  /**
   * Get the main container (add to stage)
   */
  getContainer(): any {
    return this.container;
  }

  /**
   * Get the game container (add your content here)
   */
  getGameContainer(): any {
    return this.gameContainer;
  }

  /**
   * Add child to game container
   */
  addChild(child: any): void {
    this.gameContainer.addChild(child);
  }

  /**
   * Get current safe area bounds
   */
  getBounds(): SafeAreaBounds {
    return { ...this.bounds };
  }

  /**
   * Get design width (use for positioning within safe area)
   */
  getDesignWidth(): number {
    return this.config.designWidth;
  }

  /**
   * Get design height (use for positioning within safe area)
   */
  getDesignHeight(): number {
    return this.config.designHeight;
  }

  /**
   * Convert screen coordinates to design coordinates
   */
  screenToDesign(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: (screenX - this.bounds.x) / this.bounds.scale,
      y: (screenY - this.bounds.y) / this.bounds.scale
    };
  }

  /**
   * Convert design coordinates to screen coordinates
   */
  designToScreen(designX: number, designY: number): { x: number; y: number } {
    return {
      x: designX * this.bounds.scale + this.bounds.x,
      y: designY * this.bounds.scale + this.bounds.y
    };
  }

  /**
   * Destroy and cleanup
   */
  destroy(): void {
    this.resizeCallbacks = [];
    if (this.container) {
      this.container.destroy({ children: true });
    }
  }
}

/**
 * Create a SafeAreaLayout with common mobile game defaults
 */
export function createSafeAreaLayout(config?: Partial<SafeAreaLayoutConfig>): SafeAreaLayout {
  return new SafeAreaLayout({
    designWidth: config?.designWidth ?? 390,
    designHeight: config?.designHeight ?? 844,
    backgroundColor: config?.backgroundColor ?? 0x0088EE,
    ...config
  });
}
```

**Step 2: Add export to index.ts**

In `src/index.ts`, add after ResponsiveHelper exports (around line 458):

```typescript
// Safe Area Layout System
export {
  SafeAreaLayout,
  createSafeAreaLayout
} from './utils/SafeAreaLayout';
export type { SafeAreaLayoutConfig, SafeAreaBounds } from './utils/SafeAreaLayout';
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/utils/SafeAreaLayout.ts src/index.ts
git commit -m "feat: add SafeAreaLayout for responsive letterbox support"
```

---

## Task 1: Add New Color Schemes to Theme System

**Files:**
- Modify: `src/ui/themes/GameStyleUITheme.ts:116-308`

**Step 1: Add CREAM_BUTTON color scheme (for Play button like screenshot)**

After the existing button schemes (around line 166), add:

```typescript
// Cream/Beige Play Button (Candy Crush style)
CREAM_BUTTON: {
  gradientTop: 0xFFFBF0,
  gradientBottom: 0xF5E6C8,
  border: 0xD4A857,
  shadow: 0x8B6914,
  highlight: 0xFFFFFF,
  text: 0x8B6914,
  textStroke: 0xD4A857
},
```

**Step 2: Add TOP_BAR color schemes**

After the button schemes, add resource bar colors:

```typescript
// Top Bar Resource Pill Colors
TOP_BAR_LIVES: {
  background: 0x1A1A2A,
  border: 0x0D0D15,
  iconColor: 0xFF4081,
  textColor: 0xFFFFFF,
  labelBackground: 0x2A2A3A,
  labelColor: 0xFFFFFF
},

TOP_BAR_COINS: {
  background: 0x4CAF50,
  border: 0x2E7D32,
  iconColor: 0xFFD700,
  textColor: 0xFFFFFF,
  addButtonBg: 0x66BB6A,
  addButtonBorder: 0x43A047
},
```

**Step 3: Add BOTTOM_NAV color scheme**

```typescript
// Bottom Navigation Colors
BOTTOM_NAV: {
  background: 0x1A237E,
  topBorder: 0x3949AB,
  itemBackground: 0x283593,
  itemHighlight: 0x3949AB,
  itemActive: 0x5C6BC0,
  textColor: 0xFFFFFF,
  lockedColor: 0x757575
},
```

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/ui/themes/GameStyleUITheme.ts
git commit -m "feat: add cream button and top bar color schemes to theme"
```

---

## Task 2: Update GameTopBar with Flexible Resource Styling

**Files:**
- Modify: `src/ui/components/GameTopBar.ts`

**Step 1: Update ResourceItemConfig interface**

Replace the interface (around line 14-25) with:

```typescript
/**
 * Resource item configuration
 */
export interface ResourceItemConfig {
  type: ResourceType;
  value: number;
  max?: number;
  icon?: 'heart' | 'coin' | 'gem' | 'energy' | 'custom';
  iconColor?: number;
  backgroundColor?: number;
  borderColor?: number;
  showAddButton?: boolean;
  addButtonColor?: number;
  label?: string;
  labelBackgroundColor?: number;
  pillWidth?: number; // Allow custom width
  onClick?: () => void;
  onAddClick?: () => void;
}
```

**Step 2: Update createResourceDisplay method**

Replace the background creation section (around line 224-229) with:

```typescript
// Background pill shape with configurable colors
const bg = graphics().createGraphics();
const bgColor = res.backgroundColor || this.getDefaultBgColor(res.type);
const borderColor = res.borderColor || this.darkenColor(bgColor, 0.3);

// Outer shadow for depth
bg.roundRect(-halfWidth - 1, -halfHeight + 2, width + 2, height, height / 2);
bg.fill({ color: 0x000000, alpha: 0.3 });

// Main pill
bg.roundRect(-halfWidth, -halfHeight, width, height, height / 2);
bg.fill({ color: bgColor, alpha: 0.95 });
bg.stroke({ color: borderColor, width: 2 });

// Inner highlight at top
bg.roundRect(-halfWidth + 4, -halfHeight + 3, width - 8, height * 0.4, (height * 0.4) / 2);
bg.fill({ color: 0xFFFFFF, alpha: 0.15 });
container.addChild(bg);
```

**Step 3: Update getDefaultBgColor for better defaults**

Replace the method (around line 459-472):

```typescript
private getDefaultBgColor(type: ResourceType): number {
  switch (type) {
    case 'lives':
      return 0x1A1A2A; // Dark/black for lives
    case 'coins':
      return 0x4CAF50; // Green for coins
    case 'gems':
      return 0x7B1FA2; // Purple for gems
    case 'energy':
      return 0x0288D1; // Blue for energy
    default:
      return 0x2C3E50;
  }
}
```

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/ui/components/GameTopBar.ts
git commit -m "feat: add flexible resource styling to GameTopBar"
```

---

## Task 3: Improve HexagonLevelButton Glow Effect

**Files:**
- Modify: `src/ui/components/HexagonLevelButton.ts`

**Step 1: Add glow graphics layer**

After the existing graphics declarations (around line 70), add:

```typescript
private glowGraphics?: IGraphics;
```

**Step 2: Update constructor to create glow for current state**

After creating lock icon (around line 117), add:

```typescript
// Create glow for current level
if (this.config.state === 'current' && this.config.colorScheme.glow) {
  this.createGlow();
}
```

**Step 3: Add createGlow method**

After createStars method, add:

```typescript
/**
 * Create glow effect for current level
 */
private createGlow(): void {
  const { size, colorScheme } = this.config;
  const glowColor = colorScheme.glow || 0x00FFFF;

  this.glowGraphics = graphics().createGraphics();

  // Multiple glow layers for soft effect
  for (let i = 4; i >= 0; i--) {
    const alpha = 0.15 - (i * 0.025);
    const glowSize = size + (i * 25);

    this.glowGraphics.circle(0, 0, glowSize / 2);
    this.glowGraphics.fill({ color: glowColor, alpha: alpha });
  }

  // Add glow behind everything
  this.container.addChildAt(this.glowGraphics, 0);
}

/**
 * Animate glow pulsing (call from game update loop)
 */
public updateGlow(time: number): void {
  if (this.glowGraphics) {
    this.glowGraphics.alpha = 0.6 + Math.sin(time * 0.003) * 0.25;
    this.glowGraphics.scale.set(0.95 + Math.sin(time * 0.0024) * 0.05);
  }
}
```

**Step 4: Update setState to handle glow**

In setState method (around line 459-483), add glow handling:

```typescript
// Handle glow for current state
if (state === 'current' && this.config.colorScheme.glow) {
  if (!this.glowGraphics) {
    this.createGlow();
  }
} else if (this.glowGraphics) {
  this.container.removeChild(this.glowGraphics);
  this.glowGraphics.destroy();
  this.glowGraphics = undefined;
}
```

**Step 5: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/ui/components/HexagonLevelButton.ts
git commit -m "feat: add built-in glow effect to HexagonLevelButton"
```

---

## Task 4: Update GameStyleButton Cream Color Rendering

**Files:**
- Modify: `src/ui/components/GameStyleButton.ts`

**Step 1: Fix text color for light backgrounds**

In createText method (around line 128-149), add logic for dark text on light backgrounds:

```typescript
private createText(): void {
  const { colorScheme, fontSize, fontFamily, width, height } = this.config;

  // Determine if we need dark text (for light backgrounds like cream)
  const isLightBackground = this.isLightColor(colorScheme.gradientTop);
  const textColor = colorScheme.text;
  const strokeColor = colorScheme.textStroke;
  const strokeThickness = isLightBackground
    ? Math.max(2, fontSize / 12)
    : Math.max(3, fontSize / 8);

  this.textField = graphics().createText(this.config.text, {
    fontFamily: fontFamily,
    fontSize: fontSize,
    fontWeight: 'bold',
    fill: textColor,
    stroke: strokeColor,
    strokeThickness: strokeThickness,
    align: 'center',
    dropShadow: !isLightBackground,
    dropShadowAlpha: 0.5,
    dropShadowAngle: Math.PI / 2,
    dropShadowBlur: 2,
    dropShadowColor: 0x000000,
    dropShadowDistance: 2
  });

  if (this.textField.anchor) this.textField.anchor.set(0.5, 0.5);
  this.textField.x = width / 2;
  this.textField.y = height / 2;

  this.container.addChild(this.textField);
}
```

**Step 2: Add isLightColor helper method**

After getDisabledColors method, add:

```typescript
/**
 * Check if a color is light (for determining text contrast)
 */
private isLightColor(color: number): boolean {
  const r = (color >> 16) & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = color & 0xFF;
  // Using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
```

**Step 3: Add cream button factory function**

In GameButtons object (around line 454), add:

```typescript
/**
 * Create a cream/beige "Play" style button (Candy Crush style)
 */
cream(text: string = 'Play', width: number = 220, height: number = 60): GameStyleButton {
  return new GameStyleButton({
    text,
    width,
    height,
    colorScheme: GameStyleColors.CREAM_BUTTON,
    borderRadius: 18,
    shadowOffset: 5
  });
},
```

**Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/ui/components/GameStyleButton.ts
git commit -m "feat: add cream button support with proper text contrast"
```

---

## Task 5: Improve GameBottomNav Character Icon

**Files:**
- Modify: `src/ui/components/GameBottomNav.ts`

**Step 1: Update drawPlayIcon for better mascot**

Replace the drawPlayIcon method (around line 287-315):

```typescript
/**
 * Draw play/character icon (cute mascot style like Brawl Stars)
 */
private drawPlayIcon(g: IGraphics, size: number): void {
  const s = size * 0.85;

  // Character body (round blob)
  g.ellipse(0, s * 0.05, s * 0.42, s * 0.38);
  g.fill({ color: 0x4FC3F7 });
  g.stroke({ color: 0x0288D1, width: 2.5 });

  // Body highlight
  g.ellipse(-s * 0.1, -s * 0.05, s * 0.2, s * 0.15);
  g.fill({ color: 0x81D4FA, alpha: 0.6 });

  // Eyes - white backgrounds
  g.ellipse(-s * 0.14, -s * 0.02, s * 0.12, s * 0.13);
  g.fill({ color: 0xFFFFFF });
  g.ellipse(s * 0.14, -s * 0.02, s * 0.12, s * 0.13);
  g.fill({ color: 0xFFFFFF });

  // Pupils - looking slightly up and to the side
  g.circle(-s * 0.12, -s * 0.04, s * 0.055);
  g.fill({ color: 0x1A1A2A });
  g.circle(s * 0.16, -s * 0.04, s * 0.055);
  g.fill({ color: 0x1A1A2A });

  // Pupil highlights
  g.circle(-s * 0.14, -s * 0.06, s * 0.02);
  g.fill({ color: 0xFFFFFF });
  g.circle(s * 0.14, -s * 0.06, s * 0.02);
  g.fill({ color: 0xFFFFFF });

  // Ears/horns (rounder)
  g.ellipse(-s * 0.32, -s * 0.22, s * 0.1, s * 0.12);
  g.fill({ color: 0x4FC3F7 });
  g.stroke({ color: 0x0288D1, width: 1.5 });

  g.ellipse(s * 0.32, -s * 0.22, s * 0.1, s * 0.12);
  g.fill({ color: 0x4FC3F7 });
  g.stroke({ color: 0x0288D1, width: 1.5 });
}
```

**Step 2: Update drawShopIcon for better store**

Replace drawShopIcon method (around line 262-282):

```typescript
/**
 * Draw shop/store icon (gift box style)
 */
private drawShopIcon(g: IGraphics, size: number): void {
  const s = size * 0.7;

  // Box body
  g.roundRect(-s / 2, -s * 0.1, s, s * 0.55, 4);
  g.fill({ color: 0xE91E63 });
  g.stroke({ color: 0xAD1457, width: 2 });

  // Box lid
  g.roundRect(-s / 2 - 2, -s * 0.25, s + 4, s * 0.2, 3);
  g.fill({ color: 0xF48FB1 });
  g.stroke({ color: 0xAD1457, width: 1.5 });

  // Ribbon vertical
  g.rect(-s * 0.08, -s * 0.25, s * 0.16, s * 0.7);
  g.fill({ color: 0xFFD54F });

  // Ribbon horizontal
  g.rect(-s / 2, -s * 0.15, s, s * 0.12);
  g.fill({ color: 0xFFD54F });

  // Bow
  g.ellipse(-s * 0.15, -s * 0.35, s * 0.12, s * 0.08);
  g.fill({ color: 0xFFD54F });
  g.ellipse(s * 0.15, -s * 0.35, s * 0.12, s * 0.08);
  g.fill({ color: 0xFFD54F });
  g.circle(0, -s * 0.35, s * 0.06);
  g.fill({ color: 0xFFC107 });
}
```

**Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/ui/components/GameBottomNav.ts
git commit -m "feat: improve bottom nav mascot and shop icons"
```

---

## Task 6: Update Game UI Showcase Demo with Responsive Layout

**Files:**
- Modify: `docs-site/static/demos/game-ui-showcase.html`

**Step 1: Update imports to include SafeAreaLayout and new components**

Replace the destructuring (around line 18-25):

```javascript
const {
    createGame,
    GameStyleButton,
    GameTopBar,
    HexagonLevelButton,
    GameBottomNav,
    GameStyleColors,
    GameButtons,
    SafeAreaLayout
} = GameByteFramework;
```

**Step 2: Replace fixed CONFIG with SafeAreaLayout**

Replace the CONFIG and canvas creation section (around line 27-35):

```javascript
// Design resolution (reference size - content designed for this)
const DESIGN = {
    width: 390,
    height: 844
};

// Create full-screen canvas
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.appendChild(canvas);

// Create safe area layout
const safeArea = new SafeAreaLayout({
    designWidth: DESIGN.width,
    designHeight: DESIGN.height,
    backgroundColor: 0x4DA6FF,
    showPattern: true,
    patternOpacity: 0.06
});
```

**Step 3: Update game initialization to use SafeAreaLayout**

Replace the game initialization section:

```javascript
const game = createGame();

(async () => {
    await game.initialize(canvas, '2d');

    const renderer = game.make('renderer');
    const stage = renderer.getStage();

    // Initialize safe area layout with PIXI
    safeArea.initialize(PIXI);
    stage.addChild(safeArea.getContainer());

    // Get the game container (all content goes here)
    const gameContent = safeArea.getGameContainer();

    // Handle resize
    window.addEventListener('resize', () => {
        renderer.resize(window.innerWidth, window.innerHeight);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Use DESIGN dimensions for all positioning (SafeAreaLayout handles scaling)
    const CONFIG = DESIGN;
```

**Step 4: Update all stage.addChild to use gameContent**

Replace all occurrences of `stage.addChild` with `gameContent.addChild`:

```javascript
// Example changes:
// stage.addChild(topBar.getContainer());
gameContent.addChild(topBar.getContainer());

// stage.addChild(levelContainer);
gameContent.addChild(levelContainer);

// stage.addChild(playButton.getContainer());
gameContent.addChild(playButton.getContainer());

// stage.addChild(bottomNav.getContainer());
gameContent.addChild(bottomNav.getContainer());
```

**Step 2: Update top bar configuration**

Replace the topBar creation (around line 57-68):

```javascript
// === TOP BAR ===
const topBar = new GameTopBar({
    width: CONFIG.width,
    height: 55,
    padding: 12,
    resources: [
        {
            type: 'lives',
            value: 5,
            label: 'MAX',
            icon: 'heart',
            backgroundColor: 0x1A1A2A,
            borderColor: 0x0D0D15
        },
        {
            type: 'coins',
            value: 1310,
            showAddButton: true,
            icon: 'coin',
            backgroundColor: 0x4CAF50,
            borderColor: 0x2E7D32,
            addButtonColor: 0x66BB6A
        }
    ],
    showSettings: true,
    onSettingsClick: () => console.log('Settings clicked!')
});
topBar.setPosition(0, 8);
stage.addChild(topBar.getContainer());
```

**Step 3: Update Play button to use cream style**

Replace play button creation (around line 147-161):

```javascript
// === PLAY BUTTON ===
const playButton = GameButtons.cream('Play', 220, 60);
playButton.setPosition((CONFIG.width - 220) / 2, CONFIG.height - 175);
stage.addChild(playButton.getContainer());

playButton.on('click', () => {
    console.log('Play button clicked!');
});
```

**Step 4: Remove manual glow, use built-in**

Replace the glow section (around line 139-158) - update hexagon button creation to use built-in glow:

```javascript
// Create hexagon buttons
const hexButtons = [];
let time = 0;

levels.forEach((levelData, index) => {
    let colorScheme;
    if (levelData.state === 'locked') {
        colorScheme = GameStyleColors.HEXAGON_CANDY_LOCKED;
    } else if (levelData.state === 'current') {
        colorScheme = GameStyleColors.HEXAGON_CANDY_CURRENT;
    } else {
        colorScheme = GameStyleColors.HEXAGON_CANDY_BLUE;
    }

    const hexButton = new HexagonLevelButton({
        level: levelData.level,
        size: 75,
        state: levelData.state,
        colorScheme: colorScheme,
        showStars: false
    });

    hexButton.setPosition(centerX, levelData.y + 40);
    levelContainer.addChild(hexButton.getContainer());
    hexButtons.push(hexButton);

    hexButton.on('click', ({ level }) => {
        console.log(`Level ${level} clicked!`);
    });
});

// Animate glow on current level
const currentHex = hexButtons.find((h, i) => levels[i].state === 'current');
if (currentHex) {
    game.on('update', (dt) => {
        time += dt;
        currentHex.updateGlow(time);
    });
}
```

**Step 5: Remove the old addCurrentLevelGlow function call and function definition**

Delete lines 139-144 (the function call) and lines 232-258 (the function definition).

**Step 6: Run dev server and test**

Run: `cd docs-site && npm run start`
Expected: Demo loads and displays correctly

**Step 7: Commit**

```bash
git add docs-site/static/demos/game-ui-showcase.html
git commit -m "feat: update showcase to use improved components"
```

---

## Task 7: Rebuild UMD Bundle

**Files:**
- Run build process

**Step 1: Build the framework**

Run: `npm run build`
Expected: Build completes successfully

**Step 2: Copy UMD to docs-site**

Run: `cp dist/gamebyte.umd.js docs-site/static/gamebyte.umd.js`

**Step 3: Test the showcase**

Run: `cd docs-site && npm run start`
Expected: All components render correctly matching the reference screenshot

**Step 4: Commit**

```bash
git add docs-site/static/gamebyte.umd.js
git commit -m "build: update UMD bundle with improved game UI components"
```

---

## Summary of Changes

| Component | Changes |
|-----------|---------|
| **SafeAreaLayout** | New responsive system with letterbox support |
| **GameStyleUITheme** | Added CREAM_BUTTON, TOP_BAR_*, BOTTOM_NAV color schemes |
| **GameTopBar** | Flexible resource styling, better defaults |
| **HexagonLevelButton** | Built-in glow effect, updateGlow() method |
| **GameStyleButton** | Light background text handling, cream factory |
| **GameBottomNav** | Improved mascot and shop icons |
| **Showcase** | Uses SafeAreaLayout + all new features |

## Testing Checklist

- [ ] SafeAreaLayout scales correctly on different screen sizes
- [ ] Letterbox areas show subtle background pattern
- [ ] All components render without errors
- [ ] Colors match reference screenshot
- [ ] Glow animation is smooth
- [ ] Play button text is readable (dark on light background)
- [ ] Top bar pills have correct colors (dark for lives, green for coins)
- [ ] Bottom nav icons look polished
- [ ] Components are reusable with custom configurations
- [ ] Resizing window updates layout correctly

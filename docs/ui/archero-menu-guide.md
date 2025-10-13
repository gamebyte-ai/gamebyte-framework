# Archero-Style Bottom Navigation Menu - Complete Guide

A production-ready, mobile-optimized bottom navigation menu component inspired by the popular mobile game Archero. Features glossy gold gradient buttons, smooth animations, touch gestures, and particle effects.

**NEW**: The ArcheroMenu is now fully configurable and extendable! See the [Advanced Configuration Guide](./archero-menu-advanced-configuration.md) for:
- Complete style customization
- Event callbacks and hooks
- Per-section style overrides
- Dynamic section management
- Custom renderers and inheritance

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Advanced Configuration](#advanced-configuration) ⭐ NEW
- [API Reference](#api-reference)
- [Styling & Customization](#styling--customization)
- [Animation System](#animation-system)
- [Performance Optimization](#performance-optimization)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Features

### Core Features
- **Mobile-First Design**: Optimized for 9:16 portrait orientation (1080x1920)
- **Glossy Gold Gradient**: Active buttons feature multi-stop gradient with shine overlay
- **Smooth Animations**: GSAP-powered elastic and bounce effects
- **Touch Gestures**: Swipe left/right for navigation
- **Particle Effects**: Tap feedback with physics-based particles
- **Dynamic Spacing**: Automatic button positioning and redistribution
- **Renderer Agnostic**: Works with both 2D (Pixi.js) and 3D (Three.js) renderers

### Technical Features
- Type-safe TypeScript implementation
- Event-driven architecture (EventEmitter)
- Clean memory management and disposal
- Framework-agnostic graphics API
- GSAP graceful fallback for environments without it

## Quick Start

### Basic Implementation

```typescript
import { ArcheroMenu, MenuSection, ARCHERO_COLORS } from '@gamebyte/framework';

// Define menu sections
const sections: MenuSection[] = [
  { name: 'Shop', icon: '🏪', iconColor: ARCHERO_COLORS.red },
  { name: 'Gear', icon: '⚔️', iconColor: ARCHERO_COLORS.purple },
  { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
  { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
  { name: 'Chest', icon: '🎁', iconColor: ARCHERO_COLORS.red }
];

// Create menu
const menu = new ArcheroMenu({
  sections,
  activeSection: 2, // Start with Campaign
  onSectionChange: (index, section) => {
    console.log('Section changed:', section.name);
  },
  canvasWidth: 1080,
  canvasHeight: 1920
});

// Add to stage
stage.addChild(menu.getContainer());

// Update in game loop
function gameLoop(deltaTime: number) {
  menu.update(deltaTime); // Updates particles
}
```

### Integration with GameByte Framework

```typescript
import { createGame, ArcheroMenu } from '@gamebyte/framework';

const game = createGame();
await game.initialize(canvas, '2d');

const renderer = game.make('renderer');
const stage = renderer.getStage();

// Create menu
const menu = new ArcheroMenu({
  sections: [
    { name: 'Home', icon: '🏠', iconColor: 0x4ECDC4 },
    { name: 'Play', icon: '▶️', iconColor: 0x95E1D3 },
    { name: 'Settings', icon: '⚙️', iconColor: 0xF38181 }
  ],
  activeSection: 1,
  canvasWidth: canvas.width,
  canvasHeight: canvas.height
});

stage.addChild(menu.getContainer());

// Update in tick event
renderer.on('tick', (deltaTime: number) => {
  menu.update(deltaTime);
});
```

## Advanced Configuration

The ArcheroMenu now supports extensive configuration options for styling, callbacks, and dynamic management.

### Style Configuration

Customize every aspect of the menu appearance:

```typescript
import { ArcheroMenuStyleConfig } from '@gamebyte/framework';

const customStyle: Partial<ArcheroMenuStyleConfig> = {
  // Button sizes and colors
  buttonSize: 200,
  activeButtonSize: 350,
  buttonGradient: {
    topColor: 0xFF6B6B,
    middleColor: 0xFF3B3B,
    bottomColor: 0xCC0000
  },

  // Animation speeds
  transitionDuration: 0.7,
  iconAnimDuration: 0.4,

  // Particle effects
  particleCount: 50,
  enableParticles: true
};

const menu = new ArcheroMenu({
  sections: [...],
  style: customStyle
});
```

### Event Callbacks

Hook into every menu interaction:

```typescript
import { ArcheroMenuCallbacks } from '@gamebyte/framework';

const callbacks: ArcheroMenuCallbacks = {
  onBeforeTransition: (from, to) => {
    console.log(`Transitioning from ${from} to ${to}`);
    return true; // Return false to cancel
  },
  onSectionChange: (index, section) => {
    loadSectionContent(section.name);
  },
  onButtonPress: (index) => {
    playSound('button_tap');
  },
  onSwipe: (direction) => {
    console.log(`Swiped ${direction}`);
  }
};

const menu = new ArcheroMenu({
  sections: [...],
  callbacks
});
```

### Dynamic Section Management

Add, remove, or update sections at runtime:

```typescript
// Add new section
menu.addSection({
  name: 'New Section',
  icon: '⭐',
  iconColor: 0xFFD700
});

// Update existing section
menu.updateSection(2, {
  name: 'Updated Name',
  icon: '🎮'
});

// Remove section
menu.removeSection(3);

// Reorder sections
menu.reorderSections([4, 0, 2, 1, 3]);

// Get section info
const activeSection = menu.getActiveSection();
const allSections = menu.getSections();
```

### Per-Section Style Overrides

Each section can have unique styling:

```typescript
const sections: MenuSection[] = [
  {
    name: 'Fire',
    icon: '🔥',
    iconColor: 0xFF4500,
    customStyle: {
      buttonGradient: {
        topColor: 0xFF6B6B,
        middleColor: 0xFF4500,
        bottomColor: 0xCC0000
      },
      labelColor: 0xFFFFFF
    }
  },
  {
    name: 'Water',
    icon: '💧',
    iconColor: 0x1E90FF,
    customStyle: {
      buttonGradient: {
        topColor: 0x87CEEB,
        middleColor: 0x1E90FF,
        bottomColor: 0x0047AB
      }
    }
  }
];
```

### Inheritance

Extend the menu for custom functionality:

```typescript
class CustomArcheroMenu extends ArcheroMenu {
  protected createButton(section: MenuSection, index: number): ButtonData {
    const buttonData = super.createButton(section, index);
    // Add custom elements
    return buttonData;
  }

  protected animateToActive(index: number): void {
    super.animateToActive(index);
    // Add custom animations
  }
}
```

**For complete documentation on advanced features**, see the [Advanced Configuration Guide](./archero-menu-advanced-configuration.md).

## API Reference

### ArcheroMenuOptions

```typescript
interface ArcheroMenuOptions {
  // Required
  sections: MenuSection[];

  // Optional
  activeSection?: number;            // Default: 0
  onSectionChange?: (index: number, section: MenuSection) => void;
  enableSwipe?: boolean;             // Default: true
  enableParticles?: boolean;         // Default: true
  navHeight?: number;                // Default: 280
  canvasWidth?: number;              // Default: 1080
  canvasHeight?: number;             // Default: 1920
  buttonSize?: number;               // Default: 180
  activeButtonSize?: number;         // Default: 320
  padding?: number;                  // Default: 40
}
```

### MenuSection

```typescript
interface MenuSection {
  name: string;          // Display name (shown on active button)
  icon: string;          // Icon (emoji or symbol)
  iconColor?: number;    // Icon color (hex, optional)
  content?: any;         // Custom data for section (optional)
}
```

### ArcheroMenu Methods

#### `getContainer(): IContainer`
Returns the root container to add to your scene.

```typescript
const container = menu.getContainer();
stage.addChild(container);
```

#### `getActiveSection(): number`
Returns the current active section index.

```typescript
const activeIndex = menu.getActiveSection();
console.log('Current section:', activeIndex);
```

#### `setActiveSection(index: number): void`
Programmatically change the active section with animation.

```typescript
menu.setActiveSection(0); // Switch to first section
```

#### `update(deltaTime: number): void`
Update particle animations. Call this in your game loop.

```typescript
renderer.on('tick', (dt) => {
  menu.update(dt);
});
```

#### `destroy(): void`
Clean up all resources and remove event listeners.

```typescript
menu.destroy();
```

### Events

The ArcheroMenu extends EventEmitter and emits the following events:

#### `section-changed`
Emitted when the active section changes.

```typescript
menu.on('section-changed', (index: number, section: MenuSection) => {
  console.log(`Switched to ${section.name} (index: ${index})`);
});
```

## Styling & Customization

### Color Palette

The `ARCHERO_COLORS` constant provides the default color scheme:

```typescript
export const ARCHERO_COLORS = {
  // Navigation bar
  navBg: 0x0f1624,           // Dark navy blue
  navBgLight: 0x1a2332,      // Light navy blue
  separator: 0x2d3f5f,       // Blue separator

  // Button states
  activeYellow: 0xFFD700,    // Gold
  activeOrange: 0xFFA500,    // Orange
  activeLightGold: 0xFFE55C, // Light gold

  // Icon colors
  red: 0xFF3B3B,
  blue: 0x3B7BFF,
  purple: 0x9B3BFF,
  green: 0x3BFF7B,

  // Effects
  white: 0xFFFFFF,
  black: 0x000000,

  // Label text
  darkBrown: 0x4A2F1A
};
```

### Button Sizes

The menu uses two button sizes:

- **Inactive Button**: 180px (default)
- **Active Button**: 320px (default, ~1.78x larger)

You can customize these:

```typescript
const menu = new ArcheroMenu({
  sections,
  buttonSize: 150,        // Smaller inactive buttons
  activeButtonSize: 280   // Smaller active button
});
```

### Navigation Bar Height

Default: 280px

```typescript
const menu = new ArcheroMenu({
  sections,
  navHeight: 250  // Shorter nav bar
});
```

### Padding

Default: 40px from screen edges

```typescript
const menu = new ArcheroMenu({
  sections,
  padding: 30  // Less padding
});
```

## Animation System

### GSAP Integration

The ArcheroMenu automatically detects and uses GSAP if available, with graceful fallback to direct property manipulation.

#### With GSAP (Recommended)
```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
```

Features with GSAP:
- Elastic ease for active button elevation
- Back ease for icon movement
- Power2 ease for button repositioning
- Smooth scale transitions on hover

#### Without GSAP
The menu will still work but animations will be instant (no easing).

### Animation Timings

| Animation | Duration | Easing |
|-----------|----------|--------|
| Button activation | 0.5s | elastic.out(1, 0.5) |
| Button deactivation | 0.3s | power2.out |
| Icon growth | 0.3s | back.out(2) |
| Label fade in | 0.3s | (delay: 0.2s) |
| Label fade out | 0.2s | - |
| Button repositioning | 0.4s | power2.out |
| Hover scale | 0.2s | - |

### Particle System

Particles are physics-based with the following properties:

- **Count**: 30 particles per tap
- **Size**: 3-11px (random)
- **Speed**: 6-18 units (random)
- **Lifetime**: 1.0 (fades out)
- **Gravity**: 0.3 units per frame
- **Color**: Section iconColor

To disable particles:

```typescript
const menu = new ArcheroMenu({
  sections,
  enableParticles: false
});
```

## Performance Optimization

### Mobile Performance

The ArcheroMenu is optimized for mobile devices:

1. **Object Pooling**: Particles are created and destroyed efficiently
2. **Delta Time**: All animations use delta time for frame-rate independence
3. **Conditional Rendering**: Particles only render when `enableParticles` is true
4. **Memory Management**: All graphics objects are properly destroyed

### Performance Tips

1. **Disable Particles on Low-End Devices**:
```typescript
const isLowEnd = detectLowEndDevice();
const menu = new ArcheroMenu({
  sections,
  enableParticles: !isLowEnd
});
```

2. **Limit Particle Count**:
Edit line 530 in `ArcheroMenu.ts`:
```typescript
const particleCount = 15; // Reduced from 30
```

3. **Use Smaller Button Sizes**:
```typescript
const menu = new ArcheroMenu({
  sections,
  buttonSize: 140,        // 22% smaller
  activeButtonSize: 260   // 19% smaller
});
```

4. **Disable Swipe if Not Needed**:
```typescript
const menu = new ArcheroMenu({
  sections,
  enableSwipe: false  // Only button clicks
});
```

## Best Practices

### 1. Section Management

Keep sections to 3-5 items for best UX:

```typescript
// Good: 5 sections
const sections = [
  { name: 'Shop', icon: '🏪' },
  { name: 'Gear', icon: '⚔️' },
  { name: 'Campaign', icon: '🎯' },
  { name: 'Trophy', icon: '🏆' },
  { name: 'Chest', icon: '🎁' }
];

// Avoid: Too many sections (buttons will be cramped)
// const sections = [...]; // 8+ sections
```

### 2. Content Loading

Load section content asynchronously:

```typescript
const menu = new ArcheroMenu({
  sections,
  onSectionChange: async (index, section) => {
    // Show loading state
    showLoadingOverlay();

    // Load content
    await loadSectionContent(section.name);

    // Hide loading state
    hideLoadingOverlay();
  }
});
```

### 3. Memory Management

Always destroy the menu when no longer needed:

```typescript
class MenuScene {
  private menu: ArcheroMenu;

  constructor(stage: IContainer) {
    this.menu = new ArcheroMenu({ sections });
    stage.addChild(this.menu.getContainer());
  }

  public dispose(): void {
    this.menu.destroy(); // Clean up all resources
  }
}
```

### 4. Responsive Design

Adapt to different screen sizes:

```typescript
function createResponsiveMenu(screenWidth: number, screenHeight: number) {
  const scale = Math.min(screenWidth / 1080, screenHeight / 1920);

  return new ArcheroMenu({
    sections,
    buttonSize: Math.floor(180 * scale),
    activeButtonSize: Math.floor(320 * scale),
    navHeight: Math.floor(280 * scale),
    padding: Math.floor(40 * scale),
    canvasWidth: screenWidth,
    canvasHeight: screenHeight
  });
}
```

### 5. Error Handling

Validate section indices:

```typescript
function goToSection(index: number) {
  if (index < 0 || index >= sections.length) {
    console.error('Invalid section index:', index);
    return;
  }
  menu.setActiveSection(index);
}
```

## Troubleshooting

### Buttons Not Visible

**Problem**: Menu doesn't appear on screen.

**Solution**: Ensure canvas dimensions match your actual canvas:

```typescript
const menu = new ArcheroMenu({
  sections,
  canvasWidth: canvas.width,   // Use actual canvas width
  canvasHeight: canvas.height  // Use actual canvas height
});
```

### Gradients Not Showing

**Problem**: Gold gradient appears as solid color.

**Cause**: Framework graphics abstraction uses canvas textures for gradients.

**Solution**: This is working as designed. Gradients are rendered via `createCanvasTexture`.

### Animations Not Smooth

**Problem**: Animations are instant without easing.

**Solution**: Include GSAP in your project:

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
```

### Particles Not Appearing

**Problem**: No particles on button tap.

**Solutions**:
1. Ensure `enableParticles` is true (default)
2. Verify you're calling `menu.update(deltaTime)` in game loop
3. Check that deltaTime is reasonable (not 0 or very large)

### Buttons Overflow Screen

**Problem**: Buttons extend beyond screen edges.

**Solution**: Reduce button sizes or padding:

```typescript
const menu = new ArcheroMenu({
  sections,
  buttonSize: 140,        // Smaller
  activeButtonSize: 260,  // Smaller
  padding: 30             // Less padding
});
```

### Touch Events Not Working

**Problem**: Buttons don't respond to touch.

**Solutions**:
1. Ensure stage has proper hit area:
```typescript
stage.eventMode = 'static';
stage.hitArea = new Rectangle(0, 0, canvasWidth, canvasHeight);
```

2. Check that renderer supports touch events

3. Verify buttons aren't behind other UI elements

### Memory Leaks

**Problem**: Memory usage increases over time.

**Solutions**:
1. Always call `menu.destroy()` when done
2. Ensure particles are being cleaned up:
```typescript
// Check particle count
console.log('Active particles:', menu['particles'].length);
```
3. Remove event listeners before destroying:
```typescript
menu.removeAllListeners();
menu.destroy();
```

## Advanced Usage

### Multiple Content Panels

```typescript
const contentPanels = new Map<number, IContainer>();

// Create panels for each section
sections.forEach((section, index) => {
  const panel = createPanelForSection(section);
  panel.visible = index === activeSection;
  contentPanels.set(index, panel);
  stage.addChild(panel);
});

const menu = new ArcheroMenu({
  sections,
  activeSection,
  onSectionChange: (index) => {
    // Hide all panels
    contentPanels.forEach(panel => panel.visible = false);
    // Show active panel
    contentPanels.get(index)!.visible = true;
  }
});
```

### Analytics Integration

```typescript
const menu = new ArcheroMenu({
  sections,
  onSectionChange: (index, section) => {
    // Track section views
    analytics.track('section_viewed', {
      section_name: section.name,
      section_index: index,
      timestamp: Date.now()
    });
  }
});
```

### Deep Linking

```typescript
// Parse URL to determine initial section
const urlParams = new URLSearchParams(window.location.search);
const sectionParam = urlParams.get('section');
const initialSection = sections.findIndex(s => s.name === sectionParam) || 0;

const menu = new ArcheroMenu({
  sections,
  activeSection: initialSection
});

// Update URL on section change
menu.on('section-changed', (index, section) => {
  history.pushState({}, '', `?section=${section.name}`);
});
```

## Examples

Complete examples are available in:
- `/src/ui/menus/ArcheroMenuExample.ts` - 8 different use cases
- `/demo-archero-style.html` - Live demo

## Support

For issues, questions, or contributions:
- GitHub: [gamebyte-framework](https://github.com/your-org/gamebyte-framework)
- Documentation: [docs/ui/archero-menu-guide.md](./archero-menu-guide.md)

## License

Part of the GameByte Framework - Licensed under MIT

# ArcheroMenu Advanced Configuration Guide

The ArcheroMenu component is now fully configurable, extendable, and override-capable. This guide covers all the advanced features and configuration options available.

## Table of Contents

1. [Overview](#overview)
2. [Style Configuration](#style-configuration)
3. [Event Callbacks](#event-callbacks)
4. [Per-Section Style Overrides](#per-section-style-overrides)
5. [Dynamic Section Management](#dynamic-section-management)
6. [Custom Renderers](#custom-renderers)
7. [Inheritance and Extension](#inheritance-and-extension)
8. [Migration from Legacy API](#migration-from-legacy-api)

## Overview

The new ArcheroMenu API provides three main ways to customize the menu:

1. **Style Configuration** - Complete control over colors, sizes, animations
2. **Event Callbacks** - Hook into every interaction and transition
3. **Dynamic Management** - Add, remove, update sections at runtime
4. **Inheritance** - Extend the class for complete control

## Style Configuration

### Complete Style Object

```typescript
import { ArcheroMenu, ArcheroMenuStyleConfig } from '@gamebyte/framework';

const customStyle: Partial<ArcheroMenuStyleConfig> = {
  // Button Sizes
  buttonSize: 180,              // Inactive button size
  activeButtonSize: 320,        // Active button size
  buttonRadius: 30,             // Corner radius

  // Button Gradient
  buttonGradient: {
    topColor: 0xFFE55C,        // Top gradient color
    middleColor: 0xFFD700,     // Middle gradient color
    bottomColor: 0xFFA500      // Bottom gradient color
  },

  // Shine/Gloss Overlay
  shineGradient: {
    topColor: 0xFFFFFF,        // Shine top color
    middleColor: 0xFFE55C,     // Shine middle color
    bottomColor: 0xFFD700,     // Shine bottom color
    alpha: 0.5                 // Shine opacity
  },

  // Navigation Bar
  navBarColor: 0x0f1624,       // Nav bar background
  navBarAlpha: 1.0,            // Nav bar opacity
  navBarOverlayColor: 0x1a2332, // Overlay color
  navBarOverlayAlpha: 0.5,     // Overlay opacity
  separatorColor: 0x2d3f5f,    // Top separator line
  navHeight: 280,              // Nav bar height

  // Icon Styling
  iconSize: 90,                // Inactive icon size
  activeIconSize: 140,         // Active icon size
  iconYOffset: -10,            // Inactive icon Y position
  activeIconYOffset: -35,      // Active icon Y position
  iconStrokeColor: 0x000000,   // Icon outline color
  iconStrokeWidth: 8,          // Icon outline width
  iconShadowDistance: 6,       // Drop shadow distance
  iconShadowBlur: 4,           // Drop shadow blur

  // Label Styling
  labelSize: 40,               // Label font size
  labelYOffset: 55,            // Label Y position
  labelColor: 0x4A2F1A,        // Label fill color
  labelStrokeColor: 0xFFE55C,  // Label outline color
  labelStrokeWidth: 4,         // Label outline width
  labelFontWeight: '900',      // Label font weight
  labelShadowDistance: 3,      // Label shadow distance
  labelShadowBlur: 3,          // Label shadow blur

  // Layout & Spacing
  padding: 40,                 // Edge padding
  elevationOffset: 40,         // Active button Y offset

  // Animation Durations (seconds)
  transitionDuration: 0.5,     // Main transition
  iconAnimDuration: 0.3,       // Icon animation
  repositionDuration: 0.4,     // Button reposition
  elevationDuration: 0.5,      // Button elevation
  labelFadeDuration: 0.3,      // Label fade in/out
  labelFadeDelay: 0.2,         // Label fade delay

  // Particle Effects
  enableParticles: true,       // Enable particles
  particleCount: 30,           // Number of particles
  particleSizeRange: [3, 11],  // Particle size [min, max]
  particleSpeedRange: [6, 18], // Particle speed [min, max]
  particleColors: []           // Custom colors (optional)
};

const menu = new ArcheroMenu({
  sections: [...],
  style: customStyle
});
```

### Theme Examples

#### Dark Theme

```typescript
const darkTheme: Partial<ArcheroMenuStyleConfig> = {
  buttonGradient: {
    topColor: 0x6495ED,
    middleColor: 0x4169E1,
    bottomColor: 0x191970
  },
  navBarColor: 0x0a0a0a,
  labelColor: 0xFFFFFF,
  labelStrokeColor: 0x4169E1
};
```

#### Fire Theme

```typescript
const fireTheme: Partial<ArcheroMenuStyleConfig> = {
  buttonGradient: {
    topColor: 0xFF6B6B,
    middleColor: 0xFF4500,
    bottomColor: 0xCC0000
  },
  navBarColor: 0x1a0000,
  labelColor: 0xFFFFFF,
  labelStrokeColor: 0xFF4500
};
```

#### Minimal Theme (Performance)

```typescript
const minimalTheme: Partial<ArcheroMenuStyleConfig> = {
  enableParticles: false,
  transitionDuration: 0.2,
  iconAnimDuration: 0.15,
  repositionDuration: 0.2
};
```

## Event Callbacks

### Complete Callback Configuration

```typescript
import { ArcheroMenuCallbacks } from '@gamebyte/framework';

const callbacks: ArcheroMenuCallbacks = {
  // Before transition - can cancel by returning false
  onBeforeTransition: (fromIndex: number, toIndex: number): boolean => {
    console.log(`Transitioning from ${fromIndex} to ${toIndex}`);

    // Example: Prevent navigation if condition not met
    if (!userIsLoggedIn && toIndex === 2) {
      showLoginPrompt();
      return false; // Cancel transition
    }

    return true; // Allow transition
  },

  // After transition completes (animation finished)
  onAfterTransition: (fromIndex: number, toIndex: number): void => {
    console.log(`Transition completed: ${fromIndex} -> ${toIndex}`);
    saveUserPreference('lastSection', toIndex);
  },

  // Section changed (called after animation)
  onSectionChange: (index: number, section: MenuSection): void => {
    console.log(`Section: ${section.name}`);

    // Load section content
    loadSectionContent(index);

    // Track analytics
    analytics.track('section_view', { name: section.name });
  },

  // Button pressed (before transition)
  onButtonPress: (index: number): void => {
    console.log(`Button ${index} pressed`);
    playSound('button_tap');
    hapticFeedback('light');
  },

  // Swipe gesture detected
  onSwipe: (direction: 'left' | 'right'): void => {
    console.log(`Swiped ${direction}`);
  },

  // Custom icon renderer (return null to use default)
  renderIcon: (section: MenuSection, isActive: boolean) => {
    // Custom icon rendering logic
    return customIcon;
  },

  // Custom label renderer (return null to use default)
  renderLabel: (section: MenuSection) => {
    // Custom label rendering logic
    return customLabel;
  },

  // Custom button renderer (return null to use default)
  renderButton: (section: MenuSection, isActive: boolean) => {
    // Complete custom button
    return customButton;
  }
};

const menu = new ArcheroMenu({
  sections: [...],
  callbacks
});
```

## Per-Section Style Overrides

Each section can have its own custom styling that overrides the global theme:

```typescript
const sections: MenuSection[] = [
  {
    name: 'Fire',
    icon: '🔥',
    iconColor: 0xFF4500,
    // Custom red gradient for this section only
    customStyle: {
      buttonGradient: {
        topColor: 0xFF6B6B,
        middleColor: 0xFF4500,
        bottomColor: 0xCC0000
      },
      labelColor: 0xFFFFFF,
      labelStrokeColor: 0xFF4500,
      activeIconSize: 160  // Custom size for this section
    }
  },
  {
    name: 'Water',
    icon: '💧',
    iconColor: 0x1E90FF,
    // Custom blue gradient for this section only
    customStyle: {
      buttonGradient: {
        topColor: 0x87CEEB,
        middleColor: 0x1E90FF,
        bottomColor: 0x0047AB
      },
      labelColor: 0xFFFFFF,
      labelStrokeColor: 0x1E90FF
    }
  }
];

const menu = new ArcheroMenu({
  sections,
  style: {
    // Global defaults for other sections
    buttonGradient: {
      topColor: 0xFFE55C,
      middleColor: 0xFFD700,
      bottomColor: 0xFFA500
    }
  }
});
```

## Dynamic Section Management

### Add Sections

```typescript
// Add to end
menu.addSection({
  name: 'New Section',
  icon: '⭐',
  iconColor: 0xFFD700
});

// Insert at specific index
menu.addSection({
  name: 'Inserted',
  icon: '🎯',
  iconColor: 0xFF6B6B
}, 2); // Insert at index 2
```

### Remove Sections

```typescript
// Remove by index
menu.removeSection(3);

// Note: Cannot remove the last section
```

### Update Sections

```typescript
// Update section properties
menu.updateSection(1, {
  name: 'Updated Name',
  icon: '🎮',
  iconColor: 0x00FF00
});

// Update just the custom style
menu.updateSection(2, {
  customStyle: {
    buttonGradient: {
      topColor: 0xFF0000,
      middleColor: 0xCC0000,
      bottomColor: 0x990000
    }
  }
});
```

### Reorder Sections

```typescript
// Current order: [0, 1, 2, 3, 4]
// Reorder to: [4, 0, 2, 1, 3]
menu.reorderSections([4, 0, 2, 1, 3]);
```

### Set Section Count

```typescript
// Add or remove sections to reach target count
menu.setSectionCount(7, {
  // Template for new sections
  name: 'New',
  icon: '⭐',
  iconColor: 0xFFD700
});
```

### Query Sections

```typescript
// Get all sections
const allSections = menu.getSections();

// Get specific section
const section = menu.getSection(2);

// Get active section index
const activeIndex = menu.getActiveSection();
```

## Custom Renderers

Custom renderers give you complete control over how elements are displayed:

### Custom Icon Renderer

```typescript
const callbacks: ArcheroMenuCallbacks = {
  renderIcon: (section: MenuSection, isActive: boolean) => {
    // Create custom icon with gradient
    const icon = graphics().createText(
      section.icon,
      {
        fontSize: isActive ? 150 : 100,
        fill: section.iconColor,
        stroke: 0x000000,
        strokeThickness: 8
      }
    );

    icon.anchor?.set(0.5, 0.5);
    icon.y = isActive ? -40 : -15;

    return icon;
  }
};
```

### Custom Label Renderer

```typescript
const callbacks: ArcheroMenuCallbacks = {
  renderLabel: (section: MenuSection) => {
    // Create uppercase label with custom styling
    const label = graphics().createText(
      section.name.toUpperCase(),
      {
        fontSize: 45,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
        stroke: section.iconColor || 0xFFD700,
        strokeThickness: 5
      }
    );

    label.anchor?.set(0.5, 0.5);
    label.y = 60;

    return label;
  }
};
```

### Custom Button Renderer

```typescript
const callbacks: ArcheroMenuCallbacks = {
  renderButton: (section: MenuSection, isActive: boolean) => {
    // Completely custom button
    const container = graphics().createContainer();

    // Custom shape, animations, effects...
    // Add all your custom elements to container

    return container;
  }
};
```

## Inheritance and Extension

Create custom subclasses for advanced functionality:

### Basic Extension

```typescript
class MyCustomMenu extends ArcheroMenu {
  constructor(options: ArcheroMenuOptions) {
    super(options);
  }

  // Override any protected method
  protected createButton(section: MenuSection, index: number): ButtonData {
    const buttonData = super.createButton(section, index);

    // Add custom elements to button
    this.addCustomBadge(buttonData, index);

    return buttonData;
  }

  protected animateToActive(index: number): void {
    super.animateToActive(index);

    // Add custom animation
    const button = this.buttons[index];
    this.addShakeAnimation(button);
  }

  private addCustomBadge(buttonData: ButtonData, index: number): void {
    // Add notification badge
    const badge = graphics().createGraphics();
    badge.beginFill(0xFF0000);
    badge.drawCircle(0, 0, 20);
    badge.endFill();

    buttonData.container.addChild(badge);
  }

  private addShakeAnimation(button: ButtonData): void {
    if (typeof window !== 'undefined' && (window as any).gsap) {
      (window as any).gsap.from(button.container, {
        rotation: -0.1,
        duration: 0.1,
        repeat: 3,
        yoyo: true
      });
    }
  }
}
```

### Advanced Extension with Custom State

```typescript
class MenuWithBadges extends ArcheroMenu {
  private badges: Map<number, number> = new Map();

  public setBadge(index: number, count: number): void {
    this.badges.set(index, count);

    // Trigger visual update
    if (this.buttons[index]) {
      this.updateButtonBadge(index);
    }
  }

  protected createButton(section: MenuSection, index: number): ButtonData {
    const buttonData = super.createButton(section, index);

    // Add badge if exists
    const badgeCount = this.badges.get(index);
    if (badgeCount && badgeCount > 0) {
      this.renderBadge(buttonData, badgeCount);
    }

    return buttonData;
  }

  private renderBadge(buttonData: ButtonData, count: number): void {
    const badgeContainer = graphics().createContainer();

    // Badge circle
    const circle = graphics().createGraphics();
    circle.beginFill(0xFF0000);
    circle.drawCircle(0, 0, 25);
    circle.endFill();

    // Badge text
    const text = graphics().createText(count.toString(), {
      fontSize: 24,
      fill: 0xFFFFFF,
      fontWeight: 'bold'
    });
    text.anchor?.set(0.5, 0.5);

    badgeContainer.addChild(circle);
    badgeContainer.addChild(text);
    badgeContainer.x = this.style.buttonSize / 2 - 10;
    badgeContainer.y = -this.style.buttonSize / 2 + 10;

    buttonData.container.addChild(badgeContainer);
  }

  private updateButtonBadge(index: number): void {
    // Rebuild the button with new badge
    this.rebuildMenu();
  }
}
```

## Dynamic Style Updates

Update the menu style at runtime:

```typescript
const menu = new ArcheroMenu({
  sections: [
    { name: 'Day', icon: '☀️' },
    { name: 'Night', icon: '🌙' }
  ],
  callbacks: {
    onSectionChange: (index) => {
      if (index === 0) {
        // Day theme
        menu.setStyle({
          buttonGradient: {
            topColor: 0xFFE55C,
            middleColor: 0xFFD700,
            bottomColor: 0xFFA500
          },
          navBarColor: 0x87CEEB,
          labelColor: 0x4A2F1A
        });
      } else {
        // Night theme
        menu.setStyle({
          buttonGradient: {
            topColor: 0x6495ED,
            middleColor: 0x4169E1,
            bottomColor: 0x191970
          },
          navBarColor: 0x191970,
          labelColor: 0xFFFFFF
        });
      }
    }
  }
});
```

## Migration from Legacy API

The new API is fully backward compatible. Here's how to migrate:

### Before (Legacy API)

```typescript
const menu = new ArcheroMenu({
  sections: [...],
  activeSection: 1,
  onSectionChange: (index, section) => {
    console.log('Changed:', section.name);
  },
  enableSwipe: true,
  enableParticles: true,
  navHeight: 280,
  buttonSize: 180,
  activeButtonSize: 320,
  padding: 40
});
```

### After (New API - Same Behavior)

```typescript
// Option 1: Keep using legacy API (still works!)
const menu = new ArcheroMenu({
  sections: [...],
  activeSection: 1,
  onSectionChange: (index, section) => {
    console.log('Changed:', section.name);
  },
  enableSwipe: true,
  enableParticles: true,
  navHeight: 280,
  buttonSize: 180,
  activeButtonSize: 320,
  padding: 40
});

// Option 2: Use new style API
const menu = new ArcheroMenu({
  sections: [...],
  activeSection: 1,
  callbacks: {
    onSectionChange: (index, section) => {
      console.log('Changed:', section.name);
    }
  },
  style: {
    navHeight: 280,
    buttonSize: 180,
    activeButtonSize: 320,
    padding: 40,
    enableParticles: true
  },
  enableSwipe: true
});
```

## API Reference

### ArcheroMenuOptions

```typescript
interface ArcheroMenuOptions {
  sections: MenuSection[];
  activeSection?: number;
  style?: Partial<ArcheroMenuStyleConfig>;
  callbacks?: ArcheroMenuCallbacks;
  canvasWidth?: number;
  canvasHeight?: number;
  enableSwipe?: boolean;

  // Deprecated (use style.* instead)
  enableParticles?: boolean;
  navHeight?: number;
  buttonSize?: number;
  activeButtonSize?: number;
  padding?: number;
  onSectionChange?: (index: number, section: MenuSection) => void;
}
```

### Public Methods

```typescript
class ArcheroMenu {
  // Style Management
  getStyle(): ArcheroMenuStyleConfig;
  setStyle(style: Partial<ArcheroMenuStyleConfig>, rebuild?: boolean): void;

  // Section Management
  addSection(section: MenuSection, index?: number): void;
  removeSection(index: number): void;
  updateSection(index: number, section: Partial<MenuSection>): void;
  reorderSections(order: number[]): void;
  setSectionCount(count: number, template?: Partial<MenuSection>): void;
  getSections(): MenuSection[];
  getSection(index: number): MenuSection;

  // Navigation
  getActiveSection(): number;
  setActiveSection(index: number): void;

  // Lifecycle
  update(deltaTime: number): void;
  getContainer(): IContainer;
  destroy(): void;
}
```

### Protected Methods (For Inheritance)

```typescript
class ArcheroMenu {
  protected mergeStyleConfig(options: ArcheroMenuOptions): Required<ArcheroMenuStyleConfig>;
  protected rebuildMenu(): void;
  protected buildNavBar(): void;
  protected buildButtons(): void;
  protected createButton(section: MenuSection, index: number): ButtonData;
  protected createIcon(section: MenuSection, isActive: boolean): IText | IGraphics;
  protected createLabel(section: MenuSection): IText;
  protected setupButtonInteraction(container: IContainer, index: number): void;
  protected renderButtonBackground(bg: IGraphics, section: MenuSection, size: number, isActive: boolean): void;
  protected createShineOverlay(section: MenuSection, size: number): IGraphics;
  protected calculateButtonX(index: number): number;
  protected onButtonClick(index: number): void;
  protected onButtonHover(index: number): void;
  protected onButtonHoverEnd(index: number): void;
  protected switchToSection(newIndex: number): void;
  protected animateToActive(index: number): void;
  protected animateToInactive(index: number): void;
  protected repositionAllButtons(): void;
  protected createParticles(x: number, y: number, color: number): void;
  protected setupTouchHandlers(): void;
  protected hexToRgb(hex: number): string;
  protected roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void;
}
```

## Best Practices

1. **Use Style Configuration** - Keep styling separate from logic
2. **Per-Section Overrides** - Use for section-specific theming
3. **Callbacks for Logic** - Handle all business logic in callbacks
4. **Extend for Reusability** - Create custom subclasses for reusable patterns
5. **Test Performance** - Disable particles on low-end devices
6. **Memory Management** - Always call `destroy()` when removing menu

## Performance Tips

1. **Disable Particles**: Set `enableParticles: false` for better performance
2. **Reduce Animation Duration**: Lower values = faster, less CPU usage
3. **Fewer Sections**: Limit to 5-7 sections for best performance
4. **Avoid Frequent Rebuilds**: Batch section updates when possible
5. **Custom Renderers**: Keep custom renderers lightweight

## Examples

See `/src/ui/menus/ArcheroMenuExample.ts` for 12 comprehensive examples covering:

1. Basic setup (backward compatible)
2. Custom styling
3. Event callbacks
4. Per-section overrides
5. Dynamic section management
6. Custom renderers
7. Custom subclass
8. Badges and notifications
9. Dynamic theme switching
10. Content panels
11. Minimal performance mode
12. Full game integration

Each example is production-ready and demonstrates best practices for different use cases.

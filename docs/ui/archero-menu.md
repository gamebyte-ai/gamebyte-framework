# ArcheroMenu - Mobile Game Navigation

A beautiful, animated navigation menu inspired by the popular mobile game Archero. Features smooth transitions, flexbox layout, and mobile-optimized interactions.

## Features

✅ **Mobile-First Design** - Touch-optimized with swipe support
✅ **Smooth Animations** - GSAP-powered transitions with elastic easing
✅ **Flexbox Layout** - Responsive positioning using @pixi/layout
✅ **Gold Gradients** - Pixi.js v8 FillGradient API for rich visuals
✅ **Elevation Effects** - Active buttons lift up with shine overlay
✅ **Aspect Ratio Preservation** - Menu stays centered on large screens (max 1080px width)
✅ **Customizable Styles** - Full control over colors, sizes, and timing

## Quick Start

### Basic Usage

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

// Define your menu sections
const sections = [
  { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
  { name: 'Gear', icon: '⚙️', iconColor: ARCHERO_COLORS.purple },
  { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
  { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
  { name: 'Chest', icon: '📦', iconColor: ARCHERO_COLORS.blue }
];

// Create the menu
const menu = new ArcheroMenu({
  sections,
  activeSection: 2, // Campaign is default
  canvasWidth: 1080,
  canvasHeight: 1920,
  callbacks: {
    onSectionChange: (index, section) => {
      console.log('Section changed to:', section.name);
    }
  },
  enableSwipe: true
});

// Add to your Pixi.js stage
app.stage.addChild(menu);
```

### With PixiJS Application

```typescript
import * as PIXI from 'pixi.js';
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

// Create Pixi app
const app = new PIXI.Application();
await app.init({
  width: 1080,
  height: 1920,
  backgroundColor: 0x1a1a2e
});

// Create menu
const menu = new ArcheroMenu({
  sections: [
    { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
    { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
    { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green }
  ],
  activeSection: 1,
  canvasWidth: 1080,
  canvasHeight: 1920,
  enableSwipe: true
});

app.stage.addChild(menu);
```

## Configuration

### Menu Options

```typescript
interface ArcheroMenuOptions {
  sections: MenuSection[];           // Menu sections to display
  activeSection?: number;            // Initial active section (default: 0)
  canvasWidth?: number;              // Canvas width (default: 1080)
  canvasHeight?: number;             // Canvas height (default: 1920)
  enableSwipe?: boolean;             // Enable swipe navigation (default: true)
  style?: ArcheroMenuStyleConfig;    // Custom styling
  callbacks?: ArcheroMenuCallbacks;  // Event callbacks
}
```

### Menu Section

```typescript
interface MenuSection {
  name: string;                      // Section name (shown as label)
  icon: string | PIXI.Texture;       // Emoji or texture
  iconColor?: number;                // Icon color (hex)
  customStyle?: SectionStyleOverride; // Section-specific styles
  data?: any;                        // Custom data
}
```

### Callbacks

```typescript
interface ArcheroMenuCallbacks {
  onSectionChange?: (index: number, section: MenuSection) => void;
  onBeforeTransition?: (fromIndex: number, toIndex: number) => boolean;
  onAfterTransition?: (index: number, section: MenuSection) => void;
}
```

## Styling

### Default Colors

```typescript
import { ARCHERO_COLORS } from '@gamebyte/framework';

// Predefined colors
ARCHERO_COLORS.activeYellow  // 0xFFD700 - Gold
ARCHERO_COLORS.gold          // 0xFFA500 - Orange
ARCHERO_COLORS.lightGold     // 0xFFE55C - Light gold
ARCHERO_COLORS.red           // 0xFF6B6B
ARCHERO_COLORS.green         // 0x4CAF50
ARCHERO_COLORS.blue          // 0x2196F3
ARCHERO_COLORS.purple        // 0x9C27B0
```

### Custom Styling

```typescript
const menu = new ArcheroMenu({
  sections,
  style: {
    // Button sizes
    buttonSize: 180,
    activeButtonSize: 320,

    // Colors
    buttonGradient: {
      topColor: 0xFFE55C,
      middleColor: 0xFFD700,
      bottomColor: 0xFFA500
    },

    // Animation timing
    transitionDuration: 0.4,
    elevationDuration: 0.4,

    // Layout
    navHeight: 280,
    elevationOffset: 40
  }
});
```

### Full Style Options

```typescript
interface ArcheroMenuStyleConfig {
  // Sizes
  buttonSize?: number;              // Inactive button size (default: 180)
  activeButtonSize?: number;        // Active button size (default: 320)
  buttonRadius?: number;            // Button corner radius (default: 30)

  // Gradients
  buttonGradient?: GradientConfig;  // Button gradient colors
  shineGradient?: ShineGradientConfig; // Shine overlay gradient

  // Navigation bar
  navBarColor?: number;             // Nav background (default: 0x0f1624)
  navHeight?: number;               // Nav height (default: 280)

  // Icons
  iconSize?: number;                // Inactive icon size (default: 90)
  activeIconSize?: number;          // Active icon size (default: 140)
  iconYOffset?: number;             // Inactive Y offset (default: -10)
  activeIconYOffset?: number;       // Active Y offset (default: -35)

  // Labels
  labelSize?: number;               // Label font size (default: 40)
  labelYOffset?: number;            // Label Y position (default: 55)
  labelColor?: number;              // Label color (default: 0x4A2F1A)
  labelStrokeColor?: number;        // Label stroke (default: 0xFFE55C)

  // Animation durations (seconds)
  transitionDuration?: number;      // Transition time (default: 0.4)
  iconAnimDuration?: number;        // Icon animation (default: 0.25)
  elevationDuration?: number;       // Elevation time (default: 0.4)

  // Layout
  elevationOffset?: number;         // Lift height (default: 40)
}
```

## Methods

### Navigation

```typescript
// Set active section
menu.setActiveSection(index: number, skipAnimation?: boolean): void

// Navigate to next section
menu.navigateNext(): void

// Navigate to previous section
menu.navigatePrevious(): void

// Get current active index
menu.getActiveSection(): number

// Get section data
menu.getSection(index: number): MenuSection | null
```

### Customization

```typescript
// Update menu style
menu.updateStyle(newStyle: Partial<ArcheroMenuStyleConfig>): void

// Rebuild menu (after style changes)
menu.rebuild(): void

// Resize menu
menu.resize(width: number, height: number): void
```

## Advanced Usage

### Custom Section Styles

```typescript
const sections = [
  {
    name: 'Shop',
    icon: '🛒',
    customStyle: {
      buttonGradient: {
        topColor: 0xFF6B6B,
        middleColor: 0xFF5252,
        bottomColor: 0xFF3B3B
      },
      labelColor: 0xFFFFFF,
      labelStrokeColor: 0xFF3B3B
    }
  }
];
```

### Texture-Based Icons

```typescript
import * as PIXI from 'pixi.js';

const iconTexture = await PIXI.Assets.load('icon-shop.png');

const sections = [
  {
    name: 'Shop',
    icon: iconTexture,
    iconColor: 0xFF6B6B
  }
];
```

### Callbacks & State Management

```typescript
const menu = new ArcheroMenu({
  sections,
  callbacks: {
    // Prevent navigation when game is loading
    onBeforeTransition: (fromIndex, toIndex) => {
      if (gameState.isLoading) {
        return false; // Cancel transition
      }
      return true;
    },

    // Load content when section changes
    onSectionChange: async (index, section) => {
      await loadSectionContent(section.name);
    },

    // Analytics after transition completes
    onAfterTransition: (index, section) => {
      analytics.track('menu_section_viewed', {
        section: section.name,
        index
      });
    }
  }
});
```

### Responsive Design

```typescript
// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  menu.resize(width, height);
});
```

**Aspect Ratio Preservation**: The menu automatically maintains its aspect ratio on large screens by limiting its width to a maximum of 1080px and centering it horizontally. This prevents icons and text from being stretched on wide displays while allowing the canvas to fill the entire screen.

```typescript
// On screens wider than 1080px:
// - Canvas fills entire screen
// - Menu is centered horizontally at bottom
// - Maximum menu width is 1080px
// - Icons and text maintain proper proportions

const menu = new ArcheroMenu({
  sections,
  canvasWidth: 2560, // Wide desktop screen
  canvasHeight: 1440,
  // Menu will be 1080px wide and centered
});
```

## Animation Details

### Transition Flow

1. **State Update** - Button graphics update instantly
2. **Layout Calculation** - Flexbox calculates new positions
3. **Smooth Animation** - GSAP animates:
   - Button size (layout width/height)
   - Icon position
   - Elevation (Y offset)
   - Label fade in/out
   - Shine overlay fade

### Easing Functions

- **Active transition**: `back.out(1.2)` - Elastic overshoot
- **Inactive transition**: `back.in(1.2)` - Elastic ease in
- **Fade animations**: `power2.out/in` - Smooth acceleration

## Best Practices

### Performance

```typescript
// Disable particles for better performance
const menu = new ArcheroMenu({
  sections,
  style: {
    enableParticles: false
  }
});
```

### Mobile Optimization

```typescript
// 9:16 aspect ratio for mobile portrait
const MOBILE_WIDTH = 1080;
const MOBILE_HEIGHT = 1920;

const menu = new ArcheroMenu({
  sections,
  canvasWidth: MOBILE_WIDTH,
  canvasHeight: MOBILE_HEIGHT,
  enableSwipe: true, // Essential for mobile
  style: {
    buttonSize: 180,      // Finger-friendly size
    activeButtonSize: 320, // Clear visual feedback
    navHeight: 280        // Bottom navigation bar
  }
});
```

### Accessibility

```typescript
// Use descriptive section names
const sections = [
  { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
  { name: 'Equipment', icon: '⚙️', iconColor: ARCHERO_COLORS.purple },
  // Avoid: { name: 'Sec1', icon: '?' }
];

// Provide feedback
menu.callbacks = {
  onSectionChange: (index, section) => {
    // Announce section change
    announceToScreenReader(`Navigated to ${section.name}`);
  }
};
```

## Troubleshooting

### Buttons Not Visible

Make sure @pixi/layout is installed and imported:

```bash
npm install @pixi/layout
```

```typescript
import '@pixi/layout'; // Required for flexbox
```

### Gradients Not Rendering

Ensure you're using Pixi.js v8+:

```bash
npm install pixi.js@8
```

### Animations Not Smooth

GSAP is required for animations:

```bash
npm install gsap
```

```html
<!-- Or via CDN -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
```

### Layout Issues

The menu uses flexbox `space-between` - first and last buttons touch screen edges. If you need padding:

```typescript
const menu = new ArcheroMenu({
  sections,
  style: {
    // Note: Padding not directly supported in current version
    // Wrap menu in a container with margin instead
  }
});
```

## Browser Compatibility

- **Pixi.js v8**: Required for FillGradient API
- **@pixi/layout**: Required for flexbox layout
- **GSAP 3.x**: Required for smooth animations
- **WebGL/WebGPU**: Automatic fallback handled by Pixi.js
- **Touch Events**: Full mobile gesture support

## Examples

See the `demo-archero-simple.html` file for a complete working example.

## API Reference

### ArcheroMenu

Main menu class that extends `PIXI.Container`.

**Constructor**: `new ArcheroMenu(options: ArcheroMenuOptions)`

**Methods**:
- `setActiveSection(index, skipAnimation?)` - Change active section
- `navigateNext()` - Go to next section
- `navigatePrevious()` - Go to previous section
- `getActiveSection()` - Get current index
- `getSection(index)` - Get section data
- `updateStyle(style)` - Update styling
- `rebuild()` - Recreate buttons
- `resize(width, height)` - Resize menu
- `destroy()` - Cleanup and destroy

### ARCHERO_COLORS

Predefined color constants matching Archero's style.

```typescript
{
  activeYellow: 0xFFD700,
  gold: 0xFFA500,
  lightGold: 0xFFE55C,
  brown: 0x4A2F1A,
  navBar: 0x0f1624,
  navBarOverlay: 0x1a2332,
  separator: 0x2d3f5f,
  red: 0xFF6B6B,
  green: 0x4CAF50,
  blue: 0x2196F3,
  purple: 0x9C27B0,
  orange: 0xFF9800
}
```

### DEFAULT_STYLE

Default style configuration used when no custom style provided.

## License

Part of GameByte Framework - MIT License

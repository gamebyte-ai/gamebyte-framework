# UI: Mobile-First Component Design

Build touch-friendly UI with 44px minimum targets and responsive scaling.

<!-- keywords: ui, mobile, touch, components, button, responsive, 44px, accessibility -->

---

## Touch Target Sizing

**Apple HIG Standard:** 44x44 points minimum

```typescript
import { UIButton } from 'gamebyte-framework';

// ✅ Good - meets minimum
const button = new UIButton({
  text: 'Play',
  width: 200,   // 44+ px
  height: 60    // 44+ px
});

// ❌ Bad - too small for touch
const button = new UIButton({
  text: 'X',
  width: 20,    // < 44px
  height: 20    // < 44px
});
```

---

## Responsive Scaling

Use `ResponsiveScaleCalculator` to scale based on screen size:

```typescript
import { ResponsiveScaleCalculator } from 'gamebyte-framework';

const calculator = new ResponsiveScaleCalculator({
  baseWidth: 1080,    // Design resolution
  baseHeight: 1920,
  minScale: 0.5,
  maxScale: 2.0
});

// Scale button size
const button = new UIButton({
  width: calculator.scale(200),
  height: calculator.scale(60)
});

// Position scaled elements
button.x = calculator.scale(540);  // Center
button.y = calculator.scale(1600);
```

---

## Pre-built Components

### UIButton

```typescript
const button = new UIButton({
  text: 'PLAY',
  width: 200,
  height: 60,
  backgroundColor: 0x4CAF50,
  gradient: {
    enabled: true,
    colorTop: 0x66BB6A,
    colorBottom: 0x388E3C
  },
  glow: {
    enabled: true,
    color: 0x66BB6A,
    distance: 10,
    quality: 0.5
  },
  shadow: {
    enabled: true,
    color: 0x000000,
    alpha: 0.5,
    blur: 10,
    offsetY: 5
  },
  onClick: () => console.log('Button clicked')
});
```

### ArcheroMenu

Production-quality bottom navigation (670 lines → 3 lines):

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from 'gamebyte-framework';

const menu = new ArcheroMenu({
  sections: [
    { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
    { name: 'Play', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
    { name: 'Stats', icon: '📊', iconColor: ARCHERO_COLORS.green }
  ],
  activeSection: 1,
  style: {
    buttonSize: 180,
    iconSize: 50
  },
  callbacks: {
    onSectionChange: (index, section) => {
      console.log('Changed to:', section.name);
    }
  },
  responsive: true,
  enableSwipe: true,
  enableParticles: true
});
```

---

## Touch Events

```typescript
const inputManager = game.make('input');

// Tap
inputManager.on('pointerdown', (event) => {
  console.log('Tap at:', event.global.x, event.global.y);
});

// Long press
let pressTimer: number;
inputManager.on('pointerdown', (event) => {
  pressTimer = setTimeout(() => {
    console.log('Long press detected');
  }, 500);
});

inputManager.on('pointerup', () => {
  clearTimeout(pressTimer);
});

// Swipe detection
inputManager.on('swipe', (direction) => {
  console.log('Swiped:', direction);  // 'left', 'right', 'up', 'down'
});
```

---

## Accessibility

### Visual Feedback

```typescript
const button = new UIButton({
  text: 'Submit',
  // Hover state
  hoverStyle: {
    scale: 1.05,
    brightness: 1.2
  },
  // Active state
  activeStyle: {
    scale: 0.95,
    brightness: 0.8
  }
});
```

### Haptic Feedback (Mobile)

```typescript
button.on('pointerdown', () => {
  if (navigator.vibrate) {
    navigator.vibrate(50);  // 50ms vibration
  }
});
```

---

## Related Guides

- `ui-responsive-scaling.md` - Advanced responsive patterns
- `ui-archero-menu-advanced.md` - ArcheroMenu customization
- `performance-optimization-mobile.md` - UI performance

---

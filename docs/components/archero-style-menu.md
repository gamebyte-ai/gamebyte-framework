# Archero-Style Bottom Navigation Menu

## Live Example

<div style="border: 1px solid #333; border-radius: 8px; overflow: hidden; margin: 20px 0;">
  <iframe src="../examples/archero-style-example.html" width="100%" height="600" style="border: none;"></iframe>
</div>

> **Interactive Demo**: Style customization showcase. Click the theme buttons to dynamically change the menu appearance. Themes include Gold (default), Fire, Ocean, Forest, and Dark Night.

---

A mobile-optimized (9:16 portrait) bottom navigation menu system inspired by Archero, featuring glossy buttons, smooth animations, and touch gestures.

## Features

- **Mobile-First Design**: 1080x1920 base resolution with responsive scaling
- **Glossy Gold Gradient Buttons**: Active button with shine effect
- **Smooth Animations**: GSAP-powered elastic and back easing
- **Touch Gestures**: Swipe left/right for navigation
- **Particle Effects**: Tap feedback with animated particles
- **Dynamic Spacing**: Buttons automatically adjust positions

## Architecture

### Button States

**Active Button:**
- Size: 320px (larger than inactive)
- Gold gradient background (light gold → gold → orange)
- Glossy shine overlay with gradient
- Icon + Label visible
- Elevated position (40px up)

**Inactive Button:**
- Size: 180px
- Transparent background
- Icon only (no label)
- Normal position
- Slightly raised (10px up for better visibility)

### Key Measurements

```javascript
const BUTTON_SIZE = 180;           // Inactive button size
const ACTIVE_BUTTON_SIZE = 320;    // Active button size (1.78x)
const NAV_HEIGHT = 300;            // Navigation bar height
const BASE_WIDTH = 1080;           // Base canvas width
const BASE_HEIGHT = 1920;          // Base canvas height (9:16)
```

## Common Mistakes & Solutions

### 1. ❌ Gradient Not Working
**Problem:** Using old Pixi.js gradient syntax or layered semi-transparent approach

**Solution:** Use Pixi.js v8 FillGradient API:
```javascript
const gradient = new PIXI.FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
        { offset: 0, color: 0xFFE55C },    // Light gold top
        { offset: 0.5, color: 0xFFD700 },  // Gold middle
        { offset: 1, color: 0xFFA500 }     // Orange bottom
    ]
});
btnBg.fill(gradient);
```

### 2. ❌ Shine Effect Not Appearing
**Problem:** Multiple overlay layers causing render issues

**Solution:** Use single gradient overlay:
```javascript
const shineGradient = new PIXI.FillGradient({
    type: 'linear',
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    colorStops: [
        { offset: 0, color: 0xFFFFFF },      // Pure white at top
        { offset: 0.8, color: 0xFFE55C },    // Light gold
        { offset: 1, color: 0xFFD700 }       // Gold at bottom
    ]
});
overlay.fill(shineGradient);
overlay.alpha = 0.5;
```

### 3. ❌ Shine Persists on Inactive Buttons
**Problem:** Not cleaning up overlay references during animation

**Solution:** Always remove overlay when transitioning to inactive:
```javascript
if (oldBtn.overlay) {
    oldBtn.container.removeChild(oldBtn.overlay);
    oldBtn.overlay = null;
}
```

### 4. ❌ Buttons Overflow Screen
**Problem:** Fixed spacing doesn't account for active button size

**Solution:** Calculate dynamic spacing based on total button widths:
```javascript
const totalButtonsWidth = ACTIVE_BUTTON_SIZE + (BUTTON_SIZE * (sections.length - 1));
const padding = 40;
const availableWidth = BASE_WIDTH - (padding * 2);
const totalSpacing = availableWidth - totalButtonsWidth;
const spacingBetweenButtons = totalSpacing / (sections.length - 1);

// Position each button
let xPos = padding;
for (let i = 0; i < index; i++) {
    const btnSize = (i === activeSection) ? ACTIVE_BUTTON_SIZE : BUTTON_SIZE;
    xPos += btnSize + spacingBetweenButtons;
}
xPos += size / 2; // Center button on position
```

### 5. ❌ Icons and Labels Too Low
**Problem:** Default centering doesn't work with gradient shine

**Solution:** Adjust icon and label Y positions:
```javascript
icon.y = isActive ? -35 : -10;  // Active higher, inactive slightly up
label.y = 55;                   // Above button center
```

### 6. ❌ Animation Not Smooth
**Problem:** Not animating all button positions when active changes

**Solution:** Reposition ALL buttons on each transition:
```javascript
navButtons.forEach((btn, i) => {
    // Recalculate position for each button based on new active index
    let xPos = padding;
    for (let j = 0; j < i; j++) {
        const btnSize = (j === newSection) ? ACTIVE_BUTTON_SIZE : BUTTON_SIZE;
        xPos += btnSize + spacingBetweenButtons;
    }
    const currentSize = (i === newSection) ? ACTIVE_BUTTON_SIZE : BUTTON_SIZE;
    xPos += currentSize / 2;

    gsap.to(btn.container, { x: xPos, duration: 0.4, ease: 'power2.out' });
});
```

## Button Data Structure

Store all references for easy animation management:

```javascript
const buttonData = {
    container: buttonContainer,  // PIXI.Container
    bg: btnBg,                   // Background graphics
    section: section,            // Section data
    overlay: null,               // Shine overlay
    icon: null,                  // Icon text
    label: null                  // Label text (active only)
};
```

## Gradient Colors

### Button Background
- **Light Gold Top**: `0xFFE55C`
- **Gold Middle**: `0xFFD700`
- **Orange Bottom**: `0xFFA500`

### Shine Overlay
- **White Top**: `0xFFFFFF` (offset 0)
- **Light Gold**: `0xFFE55C` (offset 0.8)
- **Gold Bottom**: `0xFFD700` (offset 1)
- **Overall Alpha**: `0.5` for glossy effect

### Navigation Bar
- **Background**: `0x0f1624` (dark navy blue)
- **Overlay**: `0x000000` with `alpha: 0.5` (subtle shadow)

## GSAP Animation Settings

### Active Button (New)
```javascript
// Position (elevated)
gsap.to(newBtn.container, {
    y: NAV_HEIGHT / 2 - 40,
    duration: 0.5,
    ease: 'elastic.out(1, 0.5)'
});

// Icon (grow and move up)
gsap.to(newBtn.icon, {
    y: -35,
    duration: 0.3,
    ease: 'back.out(2)'
});
gsap.to(newBtn.icon.style, { fontSize: 140, duration: 0.3 });

// Label (fade in)
gsap.to(label, { alpha: 1, duration: 0.3, delay: 0.2 });
```

### Inactive Button (Old)
```javascript
// Position (return to normal)
gsap.to(oldBtn.container, {
    y: NAV_HEIGHT / 2,
    duration: 0.3,
    ease: 'power2.out'
});

// Icon (shrink and center)
gsap.to(oldBtn.icon, {
    y: -10,
    duration: 0.3
});
gsap.to(oldBtn.icon.style, { fontSize: 90, duration: 0.3 });

// Label (fade out and remove)
gsap.to(oldBtn.label, {
    alpha: 0,
    duration: 0.2,
    onComplete: () => {
        oldBtn.container.removeChild(oldBtn.label);
        oldBtn.label = null;
    }
});
```

### Content Scroll
```javascript
gsap.to(contentContainer, {
    x: -BASE_WIDTH * newSection,
    duration: 0.5,
    ease: 'back.out(1.2)'
});
```

## Performance Tips

1. **Use ParticleContainer**: For particle effects with many objects
2. **Batch Rendering**: Group similar graphics operations
3. **Limit Particle Count**: Max 30-50 particles per tap
4. **Reuse Graphics**: Clear and redraw instead of creating new objects
5. **Optimize Gradients**: Single gradient overlay instead of multiple layers

## Touch Gesture Implementation

```javascript
stage.on('pointerdown', (e) => {
    touchStartX = e.global.x;
});

stage.on('pointerup', (e) => {
    const touchEndX = e.global.x;
    const diffX = touchEndX - touchStartX;

    if (Math.abs(diffX) > 50) { // Swipe threshold
        if (diffX > 0 && activeSection > 0) {
            switchToSection(activeSection - 1); // Swipe right
        } else if (diffX < 0 && activeSection < sections.length - 1) {
            switchToSection(activeSection + 1); // Swipe left
        }
    }
});
```

## Example Section Data

```javascript
const sections = [
    {
        name: 'Shop',
        icon: '🛒',
        iconColor: 0x4ECDC4,
        content: 'Shop content here'
    },
    {
        name: 'Gear',
        icon: '⚙️',
        iconColor: 0x95E1D3,
        content: 'Gear content here'
    },
    {
        name: 'Campaign',
        icon: '🎯',
        iconColor: 0xF38181,
        content: 'Campaign content here'
    },
    {
        name: 'Trophy',
        icon: '🏆',
        iconColor: 0xFFD93D,
        content: 'Trophy content here'
    },
    {
        name: 'Chest',
        icon: '📦',
        iconColor: 0xC7CEEA,
        content: 'Chest content here'
    }
];
```

## Browser Compatibility

- **Pixi.js v8**: Required for FillGradient API
- **WebGPU/WebGL2**: Automatic fallback handled by framework
- **GSAP 3.x**: Required for smooth animations
- **Mobile Touch**: Full gesture support

## See Also

- [Pixi.js v8 Graphics Fill](https://pixijs.com/8.x/guides/components/scene-objects/graphics/graphics-fill)
- [GSAP Easing Visualizer](https://greensock.com/ease-visualizer/)
- [Mobile UI Best Practices](../guides/mobile-ui-patterns.md)

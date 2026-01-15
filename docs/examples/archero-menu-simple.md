# ArcheroMenu - Simple Integration Guide

## 5-Minute Setup

Add a beautiful Archero-style menu to your game in just 5 minutes!

### Step 1: Install Dependencies

```bash
npm install gamebyte-framework pixi.js@8 gsap @pixi/layout
```

### Step 2: Import and Create

```typescript
import * as PIXI from 'pixi.js';
import { ArcheroMenu, ARCHERO_COLORS } from 'gamebyte-framework';

// Create PixiJS app
const app = new PIXI.Application();
await app.init({
  width: 1080,
  height: 1920,
  backgroundColor: 0x1a1a2e
});
document.body.appendChild(app.canvas);

// Create menu
const menu = new ArcheroMenu({
  sections: [
    { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
    { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
    { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green }
  ],
  activeSection: 1, // Start on Campaign
  canvasWidth: 1080,
  canvasHeight: 1920,
  enableSwipe: true,
  callbacks: {
    onSectionChange: (index, section) => {
      console.log('Section:', section.name);
      // Load your section content here
    }
  }
});

// Add to stage
app.stage.addChild(menu);
```

### Step 3: Done! 🎉

That's it! You now have a fully functional, animated navigation menu.

## What You Get

✅ **Smooth animations** - GSAP-powered transitions
✅ **Mobile-friendly** - Touch & swipe support
✅ **Responsive** - Automatically centers on large screens
✅ **Beautiful gradients** - Gold shine effects
✅ **Zero configuration** - Works out of the box

## Common Customizations

### Change Colors

```typescript
const menu = new ArcheroMenu({
  sections: [
    {
      name: 'Shop',
      icon: '🛒',
      iconColor: 0xFF0000, // Custom red
      customStyle: {
        buttonGradient: {
          topColor: 0xFF6B6B,
          middleColor: 0xFF5252,
          bottomColor: 0xFF3B3B
        }
      }
    }
  ],
  // ... rest of options
});
```

### Adjust Sizes

```typescript
const menu = new ArcheroMenu({
  sections: [...],
  style: {
    buttonSize: 200,        // Inactive button size
    activeButtonSize: 350,  // Active button size
    navHeight: 300         // Navigation bar height
  }
});
```

### Add More Sections

```typescript
const sections = [
  { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
  { name: 'Gear', icon: '⚙️', iconColor: ARCHERO_COLORS.purple },
  { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
  { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
  { name: 'Chest', icon: '📦', iconColor: ARCHERO_COLORS.blue }
];
```

## Browser/CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; background: #000; }
  </style>
</head>
<body>
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script src="./dist/gamebyte.umd.js"></script>

  <script>
    (async () => {
      const { ArcheroMenu, ARCHERO_COLORS } = GameByteFramework;

      const app = new PIXI.Application();
      await app.init({ width: 1080, height: 1920, backgroundColor: 0x1a1a2e });
      document.body.appendChild(app.canvas);

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
    })();
  </script>
</body>
</html>
```

## Next Steps

- 📖 [Full Documentation](../ui/archero-menu.md)
- 🎨 [Advanced Styling Guide](../ui/archero-menu.md#styling)
- 🚀 [More Examples](./archero-menu-quick-start.md)
- 🎮 [Live Demo](../../dev/archero-simple.html)

## Troubleshooting

**Menu not visible?**
- Make sure `@pixi/layout` is installed
- Check that canvas width/height are set

**Animations not smooth?**
- Ensure GSAP is loaded
- Check browser console for errors

**Touch not working?**
- Set `enableSwipe: true` in options
- Test on actual mobile device (not just browser resize)

## Support

Need help? Check the [main documentation](../ui/archero-menu.md) or [open an issue](https://github.com/your-repo/issues).

# ArcheroMenu - Quick Start Examples

## Example 1: Minimal Setup (3 Lines)

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

const menu = new ArcheroMenu({
  sections: [
    { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
    { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
    { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green }
  ],
  activeSection: 1,
  canvasWidth: 1080,
  canvasHeight: 1920
});

app.stage.addChild(menu);
```

## Example 2: With Event Handling

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

const sections = [
  { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
  { name: 'Gear', icon: '⚙️', iconColor: ARCHERO_COLORS.purple },
  { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
  { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green },
  { name: 'Chest', icon: '📦', iconColor: ARCHERO_COLORS.blue }
];

const menu = new ArcheroMenu({
  sections,
  activeSection: 2, // Campaign
  canvasWidth: 1080,
  canvasHeight: 1920,
  enableSwipe: true,
  callbacks: {
    onSectionChange: (index, section) => {
      console.log(`Switched to: ${section.name}`);
      loadSectionContent(section.name);
    }
  }
});

app.stage.addChild(menu);

function loadSectionContent(sectionName: string) {
  // Your logic here
  console.log(`Loading ${sectionName} content...`);
}
```

## Example 3: Custom Styling

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

const menu = new ArcheroMenu({
  sections: [
    { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
    { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow }
  ],
  activeSection: 0,
  canvasWidth: 1080,
  canvasHeight: 1920,
  style: {
    // Customize sizes
    buttonSize: 200,
    activeButtonSize: 350,

    // Custom gradient
    buttonGradient: {
      topColor: 0xFF00FF,   // Magenta
      middleColor: 0xFF69B4, // Pink
      bottomColor: 0xFF1493  // Deep pink
    },

    // Animation timing
    transitionDuration: 0.6,
    elevationOffset: 50
  }
});

app.stage.addChild(menu);
```

## Example 4: Dynamic Section Updates

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

// Initial sections
const sections = [
  { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
  { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow }
];

const menu = new ArcheroMenu({
  sections,
  canvasWidth: 1080,
  canvasHeight: 1920
});

app.stage.addChild(menu);

// Later: Add new section dynamically
function unlockNewSection() {
  sections.push({
    name: 'Arena',
    icon: '⚔️',
    iconColor: ARCHERO_COLORS.purple
  });

  menu.rebuild(); // Recreate menu with new sections
  menu.setActiveSection(sections.length - 1); // Show new section
}
```

## Example 5: Responsive Mobile Menu

```typescript
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

// Calculate canvas size based on window
function getCanvasSize() {
  const ASPECT_RATIO = 9 / 16;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const windowAspect = width / height;

  if (windowAspect > ASPECT_RATIO) {
    return { width: height * ASPECT_RATIO, height };
  }
  return { width, height: width / ASPECT_RATIO };
}

const { width, height } = getCanvasSize();

const menu = new ArcheroMenu({
  sections: [
    { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red },
    { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow },
    { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green }
  ],
  canvasWidth: width,
  canvasHeight: height,
  enableSwipe: true
});

app.stage.addChild(menu);

// Handle resize
window.addEventListener('resize', () => {
  const { width, height } = getCanvasSize();
  menu.resize(width, height);
});
```

## Example 6: Complete Game Integration

```typescript
import * as PIXI from 'pixi.js';
import { ArcheroMenu, ARCHERO_COLORS } from '@gamebyte/framework';

// Game state
const gameState = {
  currentSection: 'Campaign',
  isLoading: false
};

// Create Pixi app
const app = new PIXI.Application();
await app.init({
  width: 1080,
  height: 1920,
  backgroundColor: 0x1a1a2e
});
document.body.appendChild(app.canvas);

// Define sections
const sections = [
  { name: 'Shop', icon: '🛒', iconColor: ARCHERO_COLORS.red, data: { scene: 'ShopScene' } },
  { name: 'Gear', icon: '⚙️', iconColor: ARCHERO_COLORS.purple, data: { scene: 'GearScene' } },
  { name: 'Campaign', icon: '🎯', iconColor: ARCHERO_COLORS.activeYellow, data: { scene: 'CampaignScene' } },
  { name: 'Trophy', icon: '🏆', iconColor: ARCHERO_COLORS.green, data: { scene: 'TrophyScene' } },
  { name: 'Chest', icon: '📦', iconColor: ARCHERO_COLORS.blue, data: { scene: 'ChestScene' } }
];

// Create menu
const menu = new ArcheroMenu({
  sections,
  activeSection: 2,
  canvasWidth: 1080,
  canvasHeight: 1920,
  enableSwipe: true,
  callbacks: {
    onBeforeTransition: (fromIndex, toIndex) => {
      // Prevent navigation during loading
      if (gameState.isLoading) {
        console.log('Cannot switch - game is loading');
        return false;
      }
      return true;
    },

    onSectionChange: async (index, section) => {
      gameState.isLoading = true;
      gameState.currentSection = section.name;

      // Load section content
      await loadScene(section.data.scene);

      gameState.isLoading = false;
    },

    onAfterTransition: (index, section) => {
      // Analytics
      console.log(`User navigated to ${section.name}`);
    }
  }
});

app.stage.addChild(menu);

async function loadScene(sceneName: string) {
  console.log(`Loading ${sceneName}...`);
  // Your scene loading logic
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`${sceneName} loaded!`);
}
```

## Example 7: HTML/CDN Usage

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArcheroMenu Example</title>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; background: #000; }
  </style>
</head>
<body>
  <!-- Load dependencies -->
  <script src="https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script src="./dist/gamebyte.umd.js"></script>

  <script>
    (async () => {
      const { ArcheroMenu, ARCHERO_COLORS } = GameByteFramework;

      // Create Pixi app
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
        activeSection: 1,
        canvasWidth: 1080,
        canvasHeight: 1920,
        enableSwipe: true,
        callbacks: {
          onSectionChange: (index, section) => {
            console.log('Section:', section.name);
          }
        }
      });

      app.stage.addChild(menu);
    })();
  </script>
</body>
</html>
```

## Tips

1. **Always provide canvas dimensions** - Required for proper layout
2. **Enable swipe for mobile** - Set `enableSwipe: true`
3. **Use ARCHERO_COLORS** - Pre-defined colors match the Archero style
4. **Add callbacks** - Handle section changes in your game logic
5. **Test on different screens** - Use `menu.resize()` for responsiveness

## Next Steps

- Read the [full documentation](../ui/archero-menu.md)
- Check out `demo-archero-simple.html` for a complete example
- Explore [custom styling options](../ui/archero-menu.md#styling)

---
id: presets
title: Layout Presets
description: Pre-defined layout configurations for common game UI patterns
sidebar_position: 2
keywords: [layout, presets, flexbox, ui-patterns, game-ui]
llm_summary: "LayoutPresets provides pre-defined flexbox configurations. GameLayoutPresets has game-specific layouts. Helper functions create custom layouts easily."
---

# Layout Presets

GameByte provides pre-defined layout configurations for common UI patterns.

## LayoutPresets

General-purpose layout presets:

```typescript
import { LayoutPresets } from 'gamebyte-framework';

// Center content both horizontally and vertically
container.layout = LayoutPresets.center;

// Horizontal row with centered items
container.layout = LayoutPresets.row;

// Vertical column
container.layout = LayoutPresets.column;
```

### Available Presets

| Preset | Description |
|--------|-------------|
| `center` | Center content both axes |
| `centerHorizontal` | Center horizontally only |
| `centerVertical` | Center vertically only |
| `row` | Simple horizontal row |
| `column` | Simple vertical column |
| `topBar` | Fixed top bar, full width |
| `bottomBar` | Fixed bottom bar, full width |
| `sidebar` | Vertical sidebar, full height |
| `fullscreen` | 100% width and height |
| `card` | Card-like container with padding |
| `grid` | Flex wrap for grid layout |
| `stack` | Overlapping children (position: relative) |
| `hud` | Full screen HUD container |
| `modal` | Centered modal/dialog |
| `menu` | Vertical menu list |
| `scrollList` | Scrollable list |
| `levelGrid` | Level select grid |
| `buttonGroup` | Horizontal button group |
| `buttonGroupVertical` | Vertical button group |
| `resourceBar` | Coins/gems display bar |
| `iconButton` | Square icon button |
| `textButton` | Button with icon + text |

### Preset Details

```typescript
// Top bar - typically for score, coins, settings
LayoutPresets.topBar = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  paddingHorizontal: 16,
  paddingVertical: 8
};

// Grid layout with wrapping
LayoutPresets.grid = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  alignContent: 'flex-start',
  gap: 8
};

// Modal overlay
LayoutPresets.modal = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  justifyContent: 'center',
  alignItems: 'center'
};
```

## GameLayoutPresets

Game-specific layout presets:

```typescript
import { GameLayoutPresets } from 'gamebyte-framework';

// Main game screen
container.layout = GameLayoutPresets.gameScreen;

// Touch-friendly button (min 44pt)
button.layout = GameLayoutPresets.touchButton;
```

### Available Game Presets

| Preset | Description |
|--------|-------------|
| `gameScreen` | Main game screen with HUD areas |
| `safeArea` | Respects notches/home indicators |
| `touchButton` | Min 44pt for touch targets |
| `currencyDisplay` | Icon + value display |
| `progressBar` | Progress bar container |
| `levelButton` | Level select button (80x80) |
| `shopItem` | Shop item card |
| `rewardPopup` | Achievement/reward popup |
| `settingsMenu` | Settings panel |
| `leaderboardRow` | Leaderboard entry |
| `tabBar` | Bottom tab navigation |
| `fab` | Floating action button |
| `bannerAd` | Banner ad placeholder |

### Game Preset Details

```typescript
// Game screen with top/bottom HUD
GameLayoutPresets.gameScreen = {
  width: '100%',
  height: '100%',
  flexDirection: 'column',
  justifyContent: 'space-between'
};

// Safe area for notched devices
GameLayoutPresets.safeArea = {
  width: '100%',
  height: '100%',
  paddingTop: 44,    // iOS notch
  paddingBottom: 34  // iOS home indicator
};

// Touch-friendly button
GameLayoutPresets.touchButton = {
  minWidth: 44,
  minHeight: 44,
  justifyContent: 'center',
  alignItems: 'center'
};

// Floating action button
GameLayoutPresets.fab = {
  position: 'absolute',
  right: 20,
  bottom: 80,
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: 'center',
  alignItems: 'center'
};
```

## Helper Functions

Create custom layouts with helper functions:

### createFlexRow

```typescript
import { createFlexRow } from 'gamebyte-framework';

container.layout = createFlexRow({
  gap: 20,
  justify: 'space-between',
  align: 'center',
  wrap: true,
  reverse: false
});
```

### createFlexColumn

```typescript
import { createFlexColumn } from 'gamebyte-framework';

container.layout = createFlexColumn({
  gap: 10,
  justify: 'flex-start',
  align: 'stretch',
  reverse: false
});
```

### createCentered

```typescript
import { createCentered } from 'gamebyte-framework';

container.layout = createCentered({
  width: 400,
  height: 300
});
```

### createGrid

```typescript
import { createGrid } from 'gamebyte-framework';

container.layout = createGrid({
  gap: 8,
  rowGap: 12,
  columnGap: 8
});
```

### createAbsolute

```typescript
import { createAbsolute } from 'gamebyte-framework';

// Top-right corner
element.layout = createAbsolute({
  top: 20,
  right: 20,
  width: 100,
  height: 40
});

// Centered overlay
overlay.layout = createAbsolute({
  centerX: true,
  centerY: true,
  width: 300,
  height: 200
});
```

### mergeLayouts

Combine multiple layout configs:

```typescript
import { mergeLayouts, LayoutPresets } from 'gamebyte-framework';

container.layout = mergeLayouts(
  LayoutPresets.center,
  { padding: 20, gap: 16 }
);
```

## Responsive Layouts

Create responsive layouts that adapt to screen size:

```typescript
import { createResponsiveLayout, LayoutPresets } from 'gamebyte-framework';

const responsiveMenu = createResponsiveLayout(
  // Base layout
  {
    flexDirection: 'column',
    gap: 20,
    padding: 40
  },
  // Breakpoint overrides
  {
    '480': { gap: 12, padding: 20 },  // Small screens
    '768': { gap: 16, padding: 30 },  // Medium screens
    '1024': { gap: 20, padding: 40 }  // Large screens
  }
);

// Get layout for current screen
const layout = responsiveMenu(window.innerWidth);
container.layout = layout;
```

## Scaling Layouts

Scale layouts for different screen densities:

```typescript
import { scaleLayout, LayoutPresets } from 'gamebyte-framework';

// Scale all numeric values by 1.5x
const scaledLayout = scaleLayout(LayoutPresets.card, 1.5);
container.layout = scaledLayout;
```

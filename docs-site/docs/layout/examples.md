---
id: examples
title: Layout Examples
description: Common layout patterns for mobile game UI
sidebar_position: 4
keywords: [layout, examples, game-ui, patterns, flexbox]
llm_summary: "Common game UI layout patterns: Game HUD with top/bottom bars, level select grid, settings menu, shop screen, leaderboard. All use flexbox via @pixi/layout."
---

# Layout Examples

Common layout patterns for mobile game UI using the GameByte layout system.

## Game HUD

Typical game screen with top bar, content area, and bottom navigation:

```typescript
import { LayoutPresets, GameLayoutPresets } from 'gamebyte-framework';

// Main game container
app.stage.layout = {
  width: screenWidth,
  height: screenHeight,
  flexDirection: 'column',
  justifyContent: 'space-between'
};

// Top HUD bar
const topBar = new Container();
topBar.layout = {
  width: '100%',
  height: 60,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 12
};

// Add coins display
const coinsDisplay = createResourceDisplay('coins', 1234);
coinsDisplay.layout = GameLayoutPresets.currencyDisplay;

// Add level indicator
const levelBadge = createBadge('Lv.12');

// Add settings button
const settingsBtn = createIconButton('settings');
settingsBtn.layout = GameLayoutPresets.touchButton;

topBar.addChild(coinsDisplay);
topBar.addChild(levelBadge);
topBar.addChild(settingsBtn);

// Game content area (grows to fill space)
const content = new Container();
content.layout = {
  flexGrow: 1,
  justifyContent: 'center',
  alignItems: 'center'
};

// Bottom navigation
const bottomNav = new Container();
bottomNav.layout = {
  width: '100%',
  height: 80,
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: 8
};

['home', 'shop', 'play', 'profile'].forEach(icon => {
  const btn = createNavButton(icon);
  btn.layout = { width: 60, height: 60 };
  bottomNav.addChild(btn);
});

app.stage.addChild(topBar);
app.stage.addChild(content);
app.stage.addChild(bottomNav);
```

## Level Select Grid

Grid of level buttons with automatic wrapping:

```typescript
const levelSelect = new Container();
levelSelect.layout = {
  width: '100%',
  height: '100%',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignContent: 'flex-start',
  gap: 16,
  padding: 20
};

// Create 20 level buttons
for (let i = 1; i <= 20; i++) {
  const levelBtn = new Container();
  levelBtn.layout = GameLayoutPresets.levelButton; // 80x80

  const bg = new Graphics();
  bg.roundRect(0, 0, 80, 80, 12);
  bg.fill({ color: i <= unlockedLevel ? 0x4ecca3 : 0x666666 });

  const text = new Text({
    text: String(i),
    style: { fontSize: 24, fill: 0xffffff }
  });
  text.anchor.set(0.5);
  text.position.set(40, 40);

  levelBtn.addChild(bg);
  levelBtn.addChild(text);
  levelSelect.addChild(levelBtn);
}
```

## Settings Menu

Vertical menu with toggle options:

```typescript
const settingsPanel = new Container();
settingsPanel.layout = {
  width: 350,
  flexDirection: 'column',
  alignItems: 'stretch',
  padding: 24,
  gap: 16
};

// Title
const title = createText('Settings', { fontSize: 28 });
title.layout = { alignSelf: 'center', marginBottom: 20 };

// Setting rows
const settings = [
  { label: 'Music', type: 'toggle', value: true },
  { label: 'Sound Effects', type: 'toggle', value: true },
  { label: 'Vibration', type: 'toggle', value: false },
  { label: 'Notifications', type: 'toggle', value: true }
];

settings.forEach(setting => {
  const row = new Container();
  row.layout = {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  };

  const label = createText(setting.label, { fontSize: 18 });
  const toggle = createToggle(setting.value);

  row.addChild(label);
  row.addChild(toggle);
  settingsPanel.addChild(row);
});

// Close button
const closeBtn = createButton('Close');
closeBtn.layout = {
  width: '100%',
  height: 50,
  marginTop: 20
};
settingsPanel.addChild(closeBtn);
```

## Shop Screen

Grid of purchasable items:

```typescript
const shopScreen = new Container();
shopScreen.layout = {
  width: '100%',
  height: '100%',
  flexDirection: 'column'
};

// Header with currency
const header = new Container();
header.layout = {
  width: '100%',
  height: 70,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16
};

const shopTitle = createText('Shop', { fontSize: 24, fontWeight: 'bold' });
const coinsDisplay = createCurrencyDisplay('coins', playerCoins);

header.addChild(shopTitle);
header.addChild(coinsDisplay);

// Item grid
const itemGrid = new Container();
itemGrid.layout = {
  flexGrow: 1,
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignContent: 'flex-start',
  gap: 12,
  padding: 16
};

shopItems.forEach(item => {
  const card = new Container();
  card.layout = {
    width: 140,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
    gap: 8
  };

  // Item icon
  const icon = createSprite(item.icon);
  icon.layout = { width: 64, height: 64 };

  // Item name
  const name = createText(item.name, { fontSize: 14 });

  // Price button
  const priceBtn = createPriceButton(item.price);
  priceBtn.layout = { width: '100%', height: 36 };

  card.addChild(icon);
  card.addChild(name);
  card.addChild(priceBtn);
  itemGrid.addChild(card);
});

shopScreen.addChild(header);
shopScreen.addChild(itemGrid);
```

## Leaderboard

Scrollable list of ranked players:

```typescript
const leaderboard = new Container();
leaderboard.layout = {
  width: 400,
  height: 500,
  flexDirection: 'column',
  gap: 4,
  overflow: 'scroll'
};

players.forEach((player, index) => {
  const row = new Container();
  row.layout = {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12
  };

  // Rank
  const rank = createText(`#${index + 1}`, {
    fontSize: 18,
    fontWeight: 'bold'
  });
  rank.layout = { width: 40 };

  // Avatar
  const avatar = createAvatar(player.avatar);
  avatar.layout = { width: 40, height: 40 };

  // Name (grows to fill space)
  const name = createText(player.name, { fontSize: 16 });
  name.layout = { flexGrow: 1 };

  // Score
  const score = createText(formatNumber(player.score), {
    fontSize: 16,
    fill: 0xffd700
  });

  row.addChild(rank);
  row.addChild(avatar);
  row.addChild(name);
  row.addChild(score);
  leaderboard.addChild(row);
});
```

## Modal Dialog

Centered popup with backdrop:

```typescript
// Backdrop (fills screen)
const backdrop = new Container();
backdrop.layout = {
  position: 'absolute',
  top: 0, left: 0, right: 0, bottom: 0,
  justifyContent: 'center',
  alignItems: 'center'
};

// Semi-transparent background
const bg = new Graphics();
bg.rect(0, 0, screenWidth, screenHeight);
bg.fill({ color: 0x000000, alpha: 0.7 });
backdrop.addChild(bg);

// Dialog box
const dialog = new Container();
dialog.layout = {
  width: 320,
  flexDirection: 'column',
  alignItems: 'center',
  padding: 24,
  gap: 16
};

// Title
const title = createText('Level Complete!', { fontSize: 24 });

// Stars
const starsRow = new Container();
starsRow.layout = {
  flexDirection: 'row',
  gap: 8
};
[1, 2, 3].forEach(i => {
  const star = createStar(i <= earnedStars);
  star.layout = { width: 48, height: 48 };
  starsRow.addChild(star);
});

// Score
const score = createText(`Score: ${finalScore}`, { fontSize: 18 });

// Buttons
const buttons = new Container();
buttons.layout = {
  flexDirection: 'row',
  gap: 12,
  marginTop: 16
};

const retryBtn = createButton('Retry', 'secondary');
retryBtn.layout = { width: 120, height: 44 };

const nextBtn = createButton('Next Level', 'primary');
nextBtn.layout = { width: 140, height: 44 };

buttons.addChild(retryBtn);
buttons.addChild(nextBtn);

dialog.addChild(title);
dialog.addChild(starsRow);
dialog.addChild(score);
dialog.addChild(buttons);

backdrop.addChild(dialog);
```

## Responsive Main Menu

Menu that adapts to screen size:

```typescript
import { createResponsiveLayout } from 'gamebyte-framework';

const getMenuLayout = createResponsiveLayout(
  // Base layout (desktop)
  {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24,
    padding: 40
  },
  // Breakpoint overrides
  {
    '480': { gap: 12, padding: 16 },  // Phone
    '768': { gap: 16, padding: 24 },  // Tablet
    '1024': { gap: 24, padding: 40 }  // Desktop+
  }
);

const menu = new Container();
menu.layout = getMenuLayout(screenWidth);

// Logo
const logo = createSprite('logo');
logo.layout = {
  width: screenWidth < 480 ? 200 : 300,
  aspectRatio: 2 // width:height ratio
};

// Buttons
const buttonWidth = screenWidth < 480 ? '90%' : 280;

const playBtn = createButton('Play', 'primary');
playBtn.layout = { width: buttonWidth, height: 56 };

const shopBtn = createButton('Shop', 'secondary');
shopBtn.layout = { width: buttonWidth, height: 48 };

const settingsBtn = createButton('Settings', 'tertiary');
settingsBtn.layout = { width: buttonWidth, height: 48 };

menu.addChild(logo);
menu.addChild(playBtn);
menu.addChild(shopBtn);
menu.addChild(settingsBtn);

// Update on resize
window.addEventListener('resize', () => {
  menu.layout = getMenuLayout(window.innerWidth);
});
```

## Live Demo

See all these patterns in action:

import LiveDemo from '@site/src/components/LiveDemo';

<LiveDemo src="/demos/layout-demo.html" height="800" title="Layout Examples Demo" />

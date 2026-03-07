# Game Card Components + Flat Modern Theme — Design Document

**Date:** 2026-03-07
**Status:** Approved
**Branch:** `feature/game-cards-and-flat-theme`

## Overview

Add 4 new game card UI components (GameCard, CharacterCard, RewardCard, ItemCard) with dual-style support (GameStyle vibrant + FlatModern clean) and a new FlatModernUITheme. This is part of a broader UI expansion initiative.

## Approach

**Standalone Cards (Approach 1)** — Each card is an independent component extending `EventEmitter`, using `IGraphics`/`IContainer` abstraction (Pixi.js v8). Each has a `style: 'game' | 'flat'` config option. Follows existing GameStyleButton pattern.

## Rarity System

| Rarity    | Color    | Border | Effects              |
|-----------|----------|--------|----------------------|
| common    | #9E9E9E  | Gray   | None                 |
| rare      | #4DA6FF  | Blue   | Subtle glow          |
| epic      | #B388FF  | Purple | Pulse glow           |
| legendary | #FFD700  | Gold   | Shine sweep + glow   |

## Components

### 1. CardColors (`src/ui/components/cards/CardColors.ts`)
- `CardRarityColors` — per-rarity border/glow/background colors
- `GameCardColors` — game-style card color schemes (like `GameStyleColors`)
- `FlatCardColors` — flat-style card color schemes

### 2. GameCard (`src/ui/components/cards/GameCard.ts`)
Generic card container with optional header/footer.
- Config: `width, height, style, rarity, headerText, colorScheme, borderRadius, showHeader, showFooter`
- Game style: multi-layer border, gradient background, rarity glow
- Flat style: single thin border, solid bg, subtle shadow

### 3. CharacterCard (`src/ui/components/cards/CharacterCard.ts`)
Character/hero display card.
- Config: `name, stars, stats[], rarity, avatarSize, avatarColor, style, colorScheme`
- Star rating row (filled/empty stars)
- Avatar placeholder area (colored rect, user can add sprite)
- Stats bars (HP, ATK, etc.)
- Rarity border glow

### 4. RewardCard (`src/ui/components/cards/RewardCard.ts`)
Loot/reward reveal card.
- Config: `iconText, quantity, name, rarity, style, flipOnReveal, shineEffect`
- Large centered icon area
- Quantity badge
- Flip animation (Y-axis 180°) via scaleX tween
- Shine effect (diagonal light sweep) for epic/legendary

### 5. ItemCard (`src/ui/components/cards/ItemCard.ts`)
Compact inventory grid cell.
- Config: `iconText, level, quantity, equipped, rarity, style, size`
- Sizes: small (64x64), medium (80x80), large (96x96)
- Level badge (top-right corner)
- Equipped indicator border
- Quantity badge (bottom-right)

### 6. FlatModernUITheme (`src/ui/themes/FlatModernUITheme.ts`)
New `UITheme` implementation with clean, minimal aesthetics.
- Light variant: white surfaces, light gray background
- System font stack
- Lighter weights (400/600)
- Subtle shadows, no gradients
- Registered in UIThemeManager

## File Structure

```
src/ui/
├── components/
│   ├── cards/
│   │   ├── CardColors.ts
│   │   ├── GameCard.ts
│   │   ├── CharacterCard.ts
│   │   ├── RewardCard.ts
│   │   ├── ItemCard.ts
│   │   └── index.ts
├── themes/
│   ├── FlatModernUITheme.ts
```

## Exports

- `src/ui/components/cards/index.ts` — all card exports
- `src/ui/components/index.ts` — re-export cards
- `src/ui/themes/index.ts` — re-export FlatModernUITheme
- `src/index.ts` — re-export all new public APIs
- `package.json` exports — add `./cards` sub-path

## Demo

`docs-site/static/demos/game-cards-demo.html` — All 4 card types, both styles, all rarities, flip animation showcase.

## Implementation Order

1. CardColors (foundation)
2. FlatModernUITheme (needed by flat style)
3. GameCard (base card)
4. CharacterCard
5. RewardCard (with flip/shine)
6. ItemCard
7. Exports & package.json
8. Demo HTML
9. Build verification & tests

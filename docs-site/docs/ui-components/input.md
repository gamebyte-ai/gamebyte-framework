---
id: input
title: Input
description: Game-style text input component with jellybean styling
sidebar_position: 6
keywords: [input, text-input, form, text-field, game-style, pixi-ui]
llm_summary: "GameInput: Game-style text input wrapping @pixi/ui Input with jellybean styling, focus states, placeholder support. GameInputColors provides DEFAULT, DARK, LIGHT color schemes."
---

<!-- llm-context: game-input, text-field, form-input, pixi-ui-integration -->

import LiveDemo from '@site/src/components/LiveDemo';

# Input

GameInput is a game-style text input component with jellybean styling, wrapping the [@pixi/ui](https://github.com/pixijs/ui) Input component.

## Live Demo

<LiveDemo
  src="/demos/pixi-ui-components-demo.html"
  height={600}
  title="@pixi/ui Components - Input"
/>

## Features

- **Jellybean styling** with black outer border and inner shadow
- **Focus state highlighting** with selection color outline
- **Placeholder text** support
- **Touch-friendly height** (minimum 44px)
- **Event callbacks** for change and enter

## Basic Usage

```typescript
import { GameInput } from '@gamebyte/framework';

const nameInput = new GameInput({
  placeholder: 'Enter your name',
  width: 250,
  onChange: (value) => console.log('Changed:', value),
  onEnter: (value) => console.log('Submitted:', value)
});

nameInput.setPosition(50, 100);
stage.addChild(nameInput.getContainer());
```

## Configuration Options

```typescript
interface GameInputConfig {
  width?: number;           // Default: 200
  height?: number;          // Default: 44 (minimum 44 for touch)
  placeholder?: string;     // Placeholder text
  value?: string;           // Initial value
  maxLength?: number;       // Default: 100
  fontSize?: number;        // Default: 18
  colorScheme?: GameInputColorScheme;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
}

interface GameInputColorScheme {
  background: number;
  backgroundFocus: number;
  border: number;
  borderInner: number;
  shadow: number;
  text: number;
  placeholder: number;
  cursor: number;
  selection: number;
  highlight: number;
}
```

## Color Schemes

GameInput provides pre-defined color schemes:

```typescript
import { GameInput, GameInputColors } from '@gamebyte/framework';

// Default (blue-gray)
const defaultInput = new GameInput({
  colorScheme: GameInputColors.DEFAULT
});

// Dark theme
const darkInput = new GameInput({
  colorScheme: GameInputColors.DARK
});

// Light theme
const lightInput = new GameInput({
  colorScheme: GameInputColors.LIGHT
});
```

## Methods

### Value

```typescript
// Get current value
const value = input.getValue();

// Set value programmatically
input.setValue('John Doe');
```

### State

```typescript
// Disable/enable
input.setDisabled(true);
input.setDisabled(false);

// Check if disabled
if (input.isDisabled()) { /* ... */ }

// Focus (visual state only)
input.focus();
input.blur();
```

### Position

```typescript
input.setPosition(100, 200);
```

## Events

```typescript
// Value changed
input.on('change', (value) => {
  console.log('New value:', value);
});

// Enter key pressed
input.on('enter', (value) => {
  console.log('Submitted:', value);
});

// Focus events
input.on('focus', () => console.log('Input focused'));
input.on('blur', () => console.log('Input blurred'));
```

## Form Example

```typescript
import { GameInput, GameStyleButton, GameStyleColors } from '@gamebyte/framework';

// Create form fields
const usernameInput = new GameInput({
  placeholder: 'Username',
  width: 300
});

const emailInput = new GameInput({
  placeholder: 'Email',
  width: 300
});

// Submit button
const submitBtn = new GameStyleButton({
  text: 'Submit',
  width: 160,
  colorScheme: GameStyleColors.GREEN_BUTTON
});

// Handle submit
submitBtn.on('click', () => {
  const username = usernameInput.getValue();
  const email = emailInput.getValue();
  submitForm({ username, email });
});
```

## Notes

- GameInput wraps `@pixi/ui` Input which uses an actual HTML input element
- The native input handles text editing, cursor positioning, and selection
- Visual styling is rendered in Pixi.js for consistent game aesthetics
- Focus states are tracked both visually and in the underlying HTML input

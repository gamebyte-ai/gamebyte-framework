# UI Showcase Example

Demonstrates all UI components with responsive scaling and mobile optimization.

<!-- keywords: ui, showcase, components, button, menu, responsive, mobile, touch -->

---

## Features

- UIButton with gradients, glow, shadows
- ArcheroMenu bottom navigation
- UIPanel backgrounds
- UIProgressBar animations
- Responsive scaling
- Touch-friendly (44px minimum)

---

## Files

- `index.html` - Full showcase (~200 lines)

---

## Key Concepts

**Button Creation:**
```typescript
const button = new UIButton({
  text: 'PLAY',
  width: 200,
  height: 60,
  gradient: { enabled: true }
});
```

**Menu Navigation:**
```typescript
const menu = new ArcheroMenu({
  sections: [...],
  callbacks: {
    onSectionChange: (index, section) => { }
  }
});
```

**Responsive Scaling:**
```typescript
const calculator = new ResponsiveScaleCalculator({
  baseWidth: 1080,
  baseHeight: 1920
});
button.width = calculator.scale(200);
```

---

## Related Guides

- `docs/guides/ui-components-mobile-first.md` - Mobile UI patterns
- `docs/guides/ui-responsive-scaling.md` - Responsive design
- `docs/agent-guide/CORE_API.md` - Core API reference

---

# Game Feel Recipes

> Every game is different. This guide offers suggestions, not rules.
> Pick the tools you need, skip the rest.

## How to Use This Guide

Each recipe lists framework tools that work well together for a specific genre.
You don't have to use all of them. Start with the essentials (marked with ★),
add extras as needed.

---

## Puzzle / Casual

Focus: Satisfying feedback without overwhelming the player.

| When | Use | Why |
|------|-----|-----|
| ★ Tile/item collected | `Juice.collect(parent, x, y)` | Float text + sparkle |
| ★ Button pressed | `Juice.pop(button)` | Scale bounce feels responsive |
| ★ Level complete | `Juice.celebrate(parent, x, y, { text: 'Clear!' })` | Confetti burst |
| ★ Reward earned | `RewardFly.play({ from, to, count: 5 })` | Coins fly to HUD |
| UI feedback | `Toast.show(parent, 'Saved!')` | Auto-dismiss notification |
| Mobile feel | `Haptics.light()` | Subtle tap confirmation |
| DON'T | `screenShake()` | Shaking distracts in puzzle games |
| DON'T | `Juice.freeze()` | Hitstop feels wrong for casual |

---

## Action / Shooter

Focus: Every hit must feel powerful. Maximum juice.

| When | Use | Why |
|------|-----|-----|
| ★ Hit enemy | `Juice.impact(enemy)` | Shake + squash + hitstop + haptic |
| ★ Hit enemy | `SFXHelper.play('hit')` | Pitch-varied hit sound |
| ★ Hit enemy | `FloatingText2D.damage(parent, x, y, dmg)` | Damage numbers |
| ★ Enemy dies | `ParticleEmitter.explosion(x, y)` | Death explosion |
| ★ Enemy dies | `Juice.slowMo(300)` | Last kill slow-mo |
| Shooting | `Camera.kick(-dir, 0, 10, 150)` | Recoil opposite to fire |
| Moving | `Camera.setLookAhead(50, 0)` | Look ahead in move direction |
| Combo | `ComboTracker` → `Juice.combo()` | Escalating feedback |
| Big hit | `ScreenEffects.flash(0xFF0000, 0.3, 150)` | Red damage flash |
| Power-up | `ScreenEffects.powerFlash(300)` | White flash |

---

## Platformer

Focus: Responsive controls, satisfying movement.

| When | Use | Why |
|------|-----|-----|
| ★ Jump input | `InputBuffer` (buffer 'jump') | Forgiveness for early presses |
| ★ Leave ground | `InputBuffer.setGrounded(false)` | Coyote time starts |
| ★ Jump | `SquashStretch.stretch(player)` | Elongate on launch |
| ★ Land | `SquashStretch.land(player)` | Compress on impact |
| ★ Camera | `Camera.follow(player, { lerp: 0.08, deadZone: {w:40,h:60} })` | Smooth + stable |
| Double jump | `Juice.pop(player)` | Scale pop + haptic |
| Wall jump | `Camera.kick(wallDir, 0, 8, 100)` | Push away from wall |
| Collect coin | `Juice.collect(parent, x, y)` | Float text + sparkle |
| Die | `Juice.damage(player, parent, 0)` | Flash + shake |

---

## Idle / Tycoon

Focus: Satisfying progression, calm atmosphere.

| When | Use | Why |
|------|-----|-----|
| ★ Income tick | `FloatingText2D.coin(parent, x, y, amount)` | Show earnings |
| ★ Purchase | `Juice.pop(button)` + `Haptics.medium()` | Buy confirmation |
| ★ Milestone | `Juice.celebrate(parent, x, y, { score })` | Confetti + text |
| ★ Reward | `RewardFly.play({ from, to })` | Coins fly to counter |
| Upgrade | `Toast.show(parent, { text: 'Speed +1', type: 'success' })` | Notification |
| Big milestone | `Haptics.success()` | Satisfying vibration |
| DON'T | `screenShake()` | Idle games should feel calm |
| DON'T | `Juice.freeze()` | No sudden interruptions |

---

## RPG / Action RPG

Focus: Weight, impact, progression feedback.

| When | Use | Why |
|------|-----|-----|
| ★ Take damage | `Juice.damage(player, parent, amount)` | Float text + flash + shake |
| ★ Deal damage | `Juice.impact(enemy)` | Full impact feedback |
| ★ Low health | `ScreenEffects.damageVignette(400)` | Red vignette warning |
| ★ Level up | `Juice.celebrate(parent, x, y, { text: 'Level Up!' })` | Celebration |
| Combo attack | `ComboTracker.hit()` → `Juice.combo(parent, x, y, count)` | Escalating |
| Critical hit | `Juice.freeze(80)` + `Camera.kick()` | Extra emphasis |
| Heal | `FloatingText2D.spawn({ text: '+50', style: 'heal' })` | Green heal number |
| Loot drop | `RewardFly.play(...)` + `Haptics.medium()` | Satisfying pickup |
| Stats | `StatsSystem` | Base + bonus stats |
| Inventory | `InventorySystem` | Equip/unequip |
| Dialogue | `DialogueSystem` | Branching conversations |

---

## Tower Defense

Focus: Strategic feedback, wave progression.

| When | Use | Why |
|------|-----|-----|
| ★ Tower fires | `Juice.impact(enemy)` (mild: intensity 0.3) | Hit feedback |
| ★ Enemy dies | `FloatingText2D.score(parent, x, y, points)` | Score popup |
| ★ Wave complete | `Juice.celebrate(parent, x, y, { text: 'Wave Clear!' })` | Celebration |
| ★ Enemy path | `PathFollower` | Smooth waypoint following |
| ★ Tower place | `TowerManager.place(...)` + `Juice.pop(tower)` | Placement feedback |
| Tower upgrade | `Toast.show(parent, { text: 'Range +1', type: 'success' })` | Upgrade notice |
| Boss spawn | `Juice.freeze(100)` + `screenShake(stage, 12, 400)` | Dramatic entrance |
| Wave management | `WaveManager` | Data-driven wave system |

---

## Card / Deck Builder

Focus: Tactile card interactions, strategic rhythm.

| When | Use | Why |
|------|-----|-----|
| ★ Play card | `Juice.pop(card)` + `Haptics.medium()` | Card snap |
| ★ Draw card | `Tween.to(card, { x, y }, { ease: Ease.backOut })` | Overshoot draw |
| ★ Deal damage | `FloatingText2D.damage(parent, x, y, dmg)` | Damage numbers |
| Shuffle | `Haptics.double()` | Shuffle feel |
| Turn start | `Toast.show(parent, 'Your Turn')` | Turn notification |
| Win | `Juice.celebrate(...)` + `Haptics.success()` | Victory |
| Deck management | `DeckManager` | Draw/discard/shuffle |
| Turn management | `TurnEngine` | Round-based turns |

---

## Game Feel Decision Guide

For EVERY player interaction, ask yourself:

1. **Player TOUCHES something** → `Juice.pop()` + `Haptics.light()`
2. **Player HITS something** → `Juice.impact()` + `SFXHelper.play()`  
3. **Player TAKES DAMAGE** → `Juice.damage()` + `ScreenEffects.flash()`
4. **Player EARNS something** → `Juice.collect()` + `RewardFly` + `Toast`
5. **Player COMPLETES a level** → `Juice.celebrate()` + `Haptics.success()`

**Rule of thumb:** Every player action needs AT LEAST 2 feedback channels
(visual + audio, OR visual + haptic). One channel alone feels flat.

---

## Customize Everything

Every Juice method accepts optional overrides:

```typescript
// Override freeze duration on impact
Juice.impact(target, { freezeMs: 0 });  // skip hitstop

// Override shake intensity
screenShake(container, 4, 200);  // gentle shake

// Disable haptics globally
Haptics.setEnabled(false);

// Disable particles/shake in Juice
Juice.configure({ particlesEnabled: false, shakeEnabled: false });
```

The framework offers tools. You decide which ones to use.

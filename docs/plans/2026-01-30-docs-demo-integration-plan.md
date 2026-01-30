# Documentation Demo Integration Plan

> **Goal:** Her doküman sayfasında en az 1 interaktif demo iframe olacak

## Executive Summary

- **Toplam Sayfa:** 48 (+ 11 yeni oluşturulacak = 59)
- **Mevcut Demo:** 27
- **Oluşturulacak Demo:** ~15-20
- **Demo Eksik Sayfa:** ~25

---

## Mevcut Demolar (27)

| Demo Dosyası | Açıklama |
|--------------|----------|
| game-button-demo.html | GameStyleButton tüm varyantları |
| ui-panel-basic.html | Temel panel kullanımı |
| ui-panel-variants.html | Panel varyantları |
| ui-progress-bar.html | Progress bar animasyonları |
| game-topbar-demo.html | TopBar component |
| bottom-nav-demo.html | Bottom navigation |
| hexagon-level-demo.html | Hexagon level selector |
| game-tooltip-demo.html | Tooltip component |
| game-modal-panel-demo.html | Modal panel |
| game-bottom-sheet-demo.html | Bottom sheet |
| pixi-ui-components-demo.html | @pixi/ui components (Input, CheckBox, Radio, Select, List) |
| screen-manager-demo.html | Screen geçişleri |
| hub-screen-demo.html | Hub screen örneği |
| result-screen-demo.html | Result screen |
| archero-menu-demo.html | Archero tarzı menü |
| game-hud-demo.html | HUD overlay |
| game-settings-panel.html | Settings panel |
| game-ui-showcase.html | Genel UI showcase |
| virtual-joystick-demo.html | 2D joystick |
| virtual-joystick-3d-demo.html | 3D joystick |
| dual-joystick-demo.html | İkili joystick |
| layout-demo.html | Layout system |
| reactive-state-demo.html | Reactive state |
| no-ads-popup-demo.html | Popup örneği |
| no-ads-popup-css-demo.html | CSS popup |
| ui-button-effects.html | Button efektleri |
| native-gradient-test.html | Gradient test |

---

## Sayfa → Demo Eşleştirme Planı

### 1. Overview
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | game-ui-showcase.html | ✅ Mevcut |

### 2. Getting Started
| Sayfa | Demo | Durum |
|-------|------|-------|
| installation.md | - | ❌ Demo gerekli değil (kurulum) |
| quick-start.md | game-button-demo.html | ✅ Mevcut |
| first-game-tutorial.html | **first-game-demo.html** | 🔨 Oluşturulacak |

### 3. Core Concepts
| Sayfa | Demo | Durum |
|-------|------|-------|
| architecture.md | game-ui-showcase.html | ✅ Mevcut |
| game-loop.md | **game-loop-demo.html** | 🔨 Oluşturulacak |
| configuration.md | game-ui-showcase.html | ✅ Mevcut |

### 4. Rendering
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | game-ui-showcase.html | ✅ Mevcut |
| 2d-pixi.md | game-button-demo.html | ✅ Mevcut |
| 3d-three.md | virtual-joystick-3d-demo.html | ✅ Mevcut |
| hybrid-mode.md | **hybrid-rendering-demo.html** | 🔨 Oluşturulacak |

### 5. Layout System
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | layout-demo.html | ✅ Mevcut |
| presets.md | layout-demo.html | ✅ Mevcut |
| layout-manager.md | layout-demo.html | ✅ Mevcut |
| examples.md | layout-demo.html | ✅ Mevcut |

### 6. Scenes
| Sayfa | Demo | Durum |
|-------|------|-------|
| scene-management.md | screen-manager-demo.html | ✅ Mevcut |
| transitions.md | screen-manager-demo.html | ✅ Mevcut |

### 7. UI Components

#### 7.1 Basic Components
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | game-ui-showcase.html | ✅ Mevcut |
| button.md | game-button-demo.html | ✅ Mevcut |
| panel.md | ui-panel-variants.html | ✅ Mevcut |
| text.md | **text-styles-demo.html** | 🔨 Oluşturulacak |
| progress-bar.md | ui-progress-bar.html | ✅ Mevcut |

#### 7.2 Form Components (YENİ SAYFALAR)
| Sayfa | Demo | Durum |
|-------|------|-------|
| input.md (YENİ) | pixi-ui-components-demo.html | ✅ Mevcut |
| checkbox.md (YENİ) | pixi-ui-components-demo.html | ✅ Mevcut |
| radio-group.md (YENİ) | pixi-ui-components-demo.html | ✅ Mevcut |
| select.md (YENİ) | pixi-ui-components-demo.html | ✅ Mevcut |
| toggle.md (YENİ) | **toggle-demo.html** | 🔨 Oluşturulacak |
| slider.md (YENİ) | **slider-demo.html** | 🔨 Oluşturulacak |

#### 7.3 Layout Components
| Sayfa | Demo | Durum |
|-------|------|-------|
| list.md (YENİ) | pixi-ui-components-demo.html | ✅ Mevcut |
| scrollbox.md (YENİ) | **scrollbox-demo.html** | 🔨 Oluşturulacak |
| topbar.md | game-topbar-demo.html | ✅ Mevcut |
| navigation.md | bottom-nav-demo.html | ✅ Mevcut |
| responsive-layout.md | layout-demo.html | ✅ Mevcut |

#### 7.4 Game Components
| Sayfa | Demo | Durum |
|-------|------|-------|
| level-selector.md | hexagon-level-demo.html | ✅ Mevcut |
| tooltip.md (YENİ) | game-tooltip-demo.html | ✅ Mevcut |
| modal.md (YENİ) | game-modal-panel-demo.html | ✅ Mevcut |
| bottom-sheet.md (YENİ) | game-bottom-sheet-demo.html | ✅ Mevcut |

### 8. Screens & Panels
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | screen-manager-demo.html | ✅ Mevcut |
| screen-manager.md | screen-manager-demo.html | ✅ Mevcut |
| simple-screen.md | hub-screen-demo.html | ✅ Mevcut |
| screens.md | result-screen-demo.html | ✅ Mevcut |
| panels.md | game-settings-panel.html | ✅ Mevcut |

### 9. Physics
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | **physics-overview-demo.html** | 🔨 Oluşturulacak |
| 2d-matter.md | **physics-2d-demo.html** | 🔨 Oluşturulacak |
| 3d-cannon.md | **physics-3d-demo.html** | 🔨 Oluşturulacak |

### 10. Audio
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | **audio-demo.html** | 🔨 Oluşturulacak |
| music-sfx.md | **audio-demo.html** | 🔨 Oluşturulacak |
| spatial-audio.md | **spatial-audio-demo.html** | 🔨 Oluşturulacak |

### 11. Input
| Sayfa | Demo | Durum |
|-------|------|-------|
| overview.md | dual-joystick-demo.html | ✅ Mevcut |
| keyboard-mouse.md | **keyboard-demo.html** | 🔨 Oluşturulacak |
| touch.md | virtual-joystick-demo.html | ✅ Mevcut |
| virtual-joystick.md | virtual-joystick-demo.html | ✅ Mevcut |
| gamepad.md | **gamepad-demo.html** | 🔨 Oluşturulacak |

### 12. Assets
| Sayfa | Demo | Durum |
|-------|------|-------|
| loading-caching.md | **asset-loading-demo.html** | 🔨 Oluşturulacak |

### 13. API Reference
| Sayfa | Demo | Durum |
|-------|------|-------|
| index.md | game-ui-showcase.html | ✅ Mevcut |

### 14. AI Agent Guide
| Sayfa | Demo | Durum |
|-------|------|-------|
| index.md | - | ❌ Demo gerekli değil |
| core-api.md | - | ❌ Demo gerekli değil |
| quick-reference.md | - | ❌ Demo gerekli değil |

---

## Oluşturulacak Demolar Listesi (17)

### Öncelik 1 - Kritik (Form Components)
1. **toggle-demo.html** - GameToggle component showcase
2. **slider-demo.html** - GameSlider component showcase
3. **scrollbox-demo.html** - GameScrollBox ayrı demo

### Öncelik 2 - Önemli (Core Features)
4. **first-game-demo.html** - İlk oyun tutorial'ı için
5. **game-loop-demo.html** - Game loop visualizer
6. **text-styles-demo.html** - Text stilleri ve typography
7. **hybrid-rendering-demo.html** - 2D+3D birlikte

### Öncelik 3 - Physics & Audio
8. **physics-overview-demo.html** - Physics tanıtım
9. **physics-2d-demo.html** - Matter.js demo
10. **physics-3d-demo.html** - Cannon.js demo
11. **audio-demo.html** - Music ve SFX playback
12. **spatial-audio-demo.html** - 3D spatial audio

### Öncelik 4 - Input
13. **keyboard-demo.html** - Keyboard input visualizer
14. **gamepad-demo.html** - Gamepad tester

### Öncelik 5 - Assets
15. **asset-loading-demo.html** - Asset loading progress

---

## Oluşturulacak Doküman Sayfaları (11)

UI Components altında:
1. `ui-components/input.md`
2. `ui-components/checkbox.md`
3. `ui-components/radio-group.md`
4. `ui-components/select.md`
5. `ui-components/toggle.md`
6. `ui-components/slider.md`
7. `ui-components/list.md`
8. `ui-components/scrollbox.md`
9. `ui-components/tooltip.md`
10. `ui-components/modal.md`
11. `ui-components/bottom-sheet.md`

---

## Özet

| Kategori | Toplam | Mevcut Demo | Oluşturulacak |
|----------|--------|-------------|---------------|
| Getting Started | 3 | 1 | 1 |
| Core Concepts | 3 | 2 | 1 |
| Rendering | 4 | 3 | 1 |
| Layout | 4 | 4 | 0 |
| Scenes | 2 | 2 | 0 |
| UI Basic | 5 | 4 | 1 |
| UI Form | 6 | 4 | 2 |
| UI Layout | 5 | 4 | 1 |
| UI Game | 4 | 4 | 0 |
| Screens | 5 | 5 | 0 |
| Physics | 3 | 0 | 3 |
| Audio | 3 | 0 | 3 |
| Input | 5 | 3 | 2 |
| Assets | 1 | 0 | 1 |
| **TOPLAM** | **53** | **36** | **16** |

---

## Uygulama Sırası

### Fase 1: Doküman Sayfaları (önce)
11 yeni UI component sayfası oluştur

### Fase 2: Kritik Demolar
- toggle-demo.html
- slider-demo.html
- scrollbox-demo.html

### Fase 3: Core Demolar
- text-styles-demo.html
- game-loop-demo.html
- first-game-demo.html

### Fase 4: Physics & Audio
- physics-2d-demo.html
- physics-3d-demo.html
- audio-demo.html
- spatial-audio-demo.html

### Fase 5: Input & Assets
- keyboard-demo.html
- gamepad-demo.html
- asset-loading-demo.html

### Fase 6: Integration
Tüm doküman sayfalarına iframe ekle

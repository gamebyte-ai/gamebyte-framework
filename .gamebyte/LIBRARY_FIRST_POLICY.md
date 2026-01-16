# GameByte Framework: Library-First Policy

## 🎯 Temel İlke

**"Önce araştır, sonra yaz. Tekeri yeniden icat etme."**

Yeni bir özellik eklemeden önce:

1. ✅ Resmi PixiJS ekosisteminde mevcut mu kontrol et
2. ✅ Güncel ve aktif bakımda mı kontrol et
3. ✅ PixiJS v8 ile uyumlu mu kontrol et
4. ✅ Varsa ve uygunsa: Kullan (adapter pattern ile)
5. ❌ Yoksa veya uygun değilse: Kendin yaz

---

## 📚 Resmi PixiJS Ecosystem Libraries

### ZORUNLU Kütüphaneler (Kullanılması Şart)

| Kütüphane | Amaç | Versiyon | NPM Package | Durum |
|-----------|------|----------|-------------|-------|
| **@pixi/layout** | Flexbox layout system | v3.2.0+ | `@pixi/layout` | ✅ Entegre edildi (v2.0.0) |
| **@pixi/ui** | UI components (Button, ProgressBar, Slider, etc.) | v2.2.7+ | `@pixi/ui` | ✅ Entegre edildi (v2.0.0) |
| **@pixi/sound** | Audio system with WebAudio API | v6.0.1+ | `@pixi/sound` | ✅ Entegre edildi (v2.0.0) |
| **@pixi/particle-emitter** | GPU-accelerated particle effects | v5.0.8+ | `@pixi/particle-emitter` | ✅ Entegre edildi (v2.0.0) |

### OPTIONAL Kütüphaneler (İhtiyaç Halinde)

| Kütüphane | Amaç | Versiyon | NPM Package | Durum |
|-----------|------|----------|-------------|-------|
| **pixi-filters** | 60+ visual effects filters | v6.1.4+ | `pixi-filters` | ⚠️ Optional dependency |
| **@pixi/react** | React integration | v8.0.3+ | `@pixi/react` | 📝 Not yet integrated |
| **@assetpack/core** | Asset optimization tooling | v1.0.0+ | `@assetpack/core` | 📝 Dev tooling |

### DEPRECATED (Artık Kullanılmayan)

| Component | Replacement | Migration Guide |
|-----------|-------------|-----------------|
| `ResponsiveLayoutManager` | `@pixi/layout` | [Migration Guide](#migration-from-responsiveLayoutmanager) |
| Custom `UIPanel` | `@pixi/ui` + `@pixi/layout` | [Migration Guide](#migration-from-uipanel) |
| Custom `ParticleSystem` (visual only) | `@pixi/particle-emitter` | [Migration Guide](#migration-from-particlesystem) |

---

## 🔍 Kontrol Süreci

### 1. Yeni Özellik Eklerken

```bash
# Step 1: NPM Search
npm search @pixi/<feature-name>

# Step 2: GitHub'da ara
# https://github.com/pixijs
# https://github.com/topics/pixijs

# Step 3: Versiyon kontrolü
npm view @pixi/<package-name> versions --json

# Step 4: Bakım durumu kontrol
# - GitHub commit activity (son 6 ay)
# - NPM publish tarihi (son 6 ay)
# - Open issues vs closed issues ratio
# - Stars ve community activity

# Step 5: PixiJS v8 uyumluluk
# - package.json peerDependencies kontrol
# - CHANGELOG veya Migration Guide oku
```

### 2. Karar Ağacı

```
Özellik gerekli mi?
│
├─ EVET
│  │
│  └─ PixiJS kütüphanesi var mı?
│     │
│     ├─ VAR
│     │  │
│     │  └─ Güncel ve bakımda mı? (son 6 ay)
│     │     │
│     │     ├─ EVET
│     │     │  │
│     │     │  └─ PixiJS v8 uyumlu mu?
│     │     │     │
│     │     │     ├─ EVET → ✅ KULLAN (adapter ile)
│     │     │     └─ HAYIR → ❌ CUSTOM YAZ
│     │     │
│     │     └─ HAYIR → ❌ CUSTOM YAZ
│     │
│     └─ YOK → ❌ CUSTOM YAZ
│
└─ HAYIR → ❌ EKLEME
```

---

## ⚠️ Custom Code Yazma Kriterleri

Sadece şu durumlarda custom kod yaz:

1. ❌ **Resmi kütüphane yok**
   - Önce community kütüphanelerine bak
   - Varsa ve güvenilirse kullan

2. ❌ **Kütüphane deprecated/unmaintained**
   - Son 6 ayda commit yok
   - Maintainer cevap vermiyor
   - Critical bugs fix edilmiyor

3. ❌ **PixiJS v8 ile uyumsuz**
   - Breaking changes var
   - Migration path yok

4. ❌ **Performans kritik ve optimize edilmemiş**
   - Benchmark sonuçları kötü
   - Bundle size çok büyük (>200KB gzipped)
   - Mobile'da problem çıkarıyor

5. ✅ **GameByte-specific functionality**
   - Physics-based particles (Matter.js/Cannon.js integration)
   - Laravel-inspired architecture
   - Framework-specific abstractions

---

## 🏗️ Adapter Pattern Kullanımı

### ❌ YANLIŞ - Direkt Export

```typescript
// ASLA BÖYLE YAPMA
export { Button } from '@pixi/ui';
export { Emitter } from '@pixi/particle-emitter';
```

**Neden yanlış?**
- API kontrolü kaybedersin
- Breaking changes'den korunmazsın
- GameByte-style API consistency kaybolur

### ✅ DOĞRU - Adapter Pattern

```typescript
import { Button as PixiButton } from '@pixi/ui';

/**
 * GameByte Button Component
 *
 * Wraps @pixi/ui Button (v2.2.7+) with GameByte-style API.
 *
 * @example
 * ```typescript
 * const button = new GameByteButton({
 *   label: 'Click Me',
 *   onClick: () => console.log('Clicked!')
 * });
 * stage.addChild(button.view);
 * ```
 *
 * @see https://github.com/pixijs/ui - @pixi/ui documentation
 * @since GameByte v2.0.0
 */
export class GameByteButton {
  private _pixiButton: PixiButton;

  constructor(config: GameByteButtonConfig) {
    // GameByte API → PixiJS API mapping
    this._pixiButton = new PixiButton({
      defaultView: this.createBackground(config.background),
      hoverView: config.hoverBackground ? this.createBackground(config.hoverBackground) : undefined,
      text: config.label,
      textStyle: config.textStyle
    });

    // Event mapping
    if (config.onClick) {
      this._pixiButton.onPress.connect(() => config.onClick!());
    }
  }

  // GameByte-style API
  public onClick(callback: () => void): void {
    this._pixiButton.onPress.connect(callback);
  }

  public get view(): PIXI.Container {
    return this._pixiButton.view;
  }

  private createBackground(color: number | string): PIXI.Graphics {
    // Background creation logic
    const bg = new PIXI.Graphics();
    // ...
    return bg;
  }
}
```

**Neden doğru?**
- ✅ API kontrolü elimizde
- ✅ Breaking changes'i handle edebiliriz
- ✅ GameByte-style consistency korunur
- ✅ Documentation tutarlı
- ✅ Migration kolaylaşır

---

## 📝 Dokümantasyon Gereksinimleri

Her adapter için **ZORUNLU**:

1. **JSDoc ile API dokümantasyonu**
   ```typescript
   /**
    * Component açıklaması
    *
    * Wraps <library-name> <ComponentName> (v<version>+)
    *
    * @example
    * ```typescript
    * // Kullanım örneği
    * ```
    *
    * @see <library-docs-url>
    * @since GameByte v<version>
    */
   ```

2. **Kullanılan kütüphane ve versiyon bilgisi**
   - JSDoc `@see` tag'i ile link
   - Minimum required version belirt

3. **Örnek kullanım**
   - En az 1 basic example
   - Complex use case için ayrı example file

4. **Migration guide** (eğer eski API'den geçiş varsa)
   - Before/After kod örnekleri
   - Breaking changes listesi
   - Deprecation timeline

---

## 🔄 Breaking Changes Yönetimi

### Kütüphane Güncellemelerinde

1. **CHANGELOG.md'ye yaz**
   ```markdown
   ## [2.0.0] - 2025-10-16

   ### BREAKING CHANGES
   - Migrated to @pixi/layout v3.2.0
   - Deprecated ResponsiveLayoutManager (use @pixi/layout instead)

   ### Migration Guide
   See [MIGRATION.md](./MIGRATION.md) for details.
   ```

2. **Migration guide oluştur**
   - `MIGRATION.md` file
   - Before/after examples
   - Step-by-step instructions

3. **Deprecation warning ver**
   ```typescript
   /**
    * @deprecated Since v2.0.0. Use @pixi/layout instead.
    * Will be removed in v3.0.0.
    *
    * @see FlexLayoutHelper for replacement
    */
   export class ResponsiveLayoutManager {
     constructor() {
       console.warn(
         'ResponsiveLayoutManager is deprecated. ' +
         'Use @pixi/layout instead. ' +
         'See migration guide: https://docs.gamebyte.dev/migration'
       );
     }
   }
   ```

4. **Tests yaz**
   - Regression prevention
   - Backward compatibility tests (deprecation period)
   - New API tests

### Deprecation Timeline

```
v2.0.0 (Release)
├── New API available
├── Old API deprecated (warnings)
└── Documentation updated

v2.x.x (6 months)
└── Deprecation warnings continue

v3.0.0 (Breaking release)
└── Old API removed
```

---

## 🤝 Topluluk Katkısı

### Yeni Kütüphane Önerisi

GitHub Issue aç: **"Library Suggestion: \<name\>"**

Template:

```markdown
## Library Suggestion: <Library Name>

### Basic Info
- **Name**: <name>
- **NPM Package**: <package>
- **GitHub**: <repo-url>
- **Version**: <version>

### Maintenance Status
- Last commit: <date>
- Last release: <date>
- Open issues: <count>
- Stars: <count>

### PixiJS v8 Compatibility
- [ ] Peer dependency check
- [ ] Migration guide available
- [ ] Tested with PixiJS v8

### Use Case
Describe what problem this library solves and how it would benefit GameByte Framework.

### Alternatives
List alternative solutions (if any) and why this is better.

### Proposed Integration
- Adapter pattern design
- API surface area
- Bundle size impact
```

---

## 🔄 Güncellik Kontrolü

### Her 3 Ayda Bir (Quarterly)

```bash
# Check outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Update dependencies (one by one)
npm update @pixi/layout
npm update @pixi/ui
# ... etc
```

### Outdated Kütüphaneler İçin

1. **Release notes oku**
   - Breaking changes var mı?
   - New features ne?
   - Bug fixes önemli mi?

2. **Test environment'da dene**
   - All tests pass mi?
   - Visual regression var mı?
   - Performance impact var mı?

3. **Production'a al**
   - Staged rollout
   - Monitor errors
   - Rollback plan hazır

---

## 📊 Entegre Edilmiş Kütüphaneler (Current Status)

### @pixi/layout v3.2.0

**Nerede Kullanılıyor:**
- `ArcheroMenu` - Flexbox button layout
- `FlexLayoutHelper` - Utility functions
- All new UI components

**Adapter:**
- `src/adapters/LayoutAdapter.ts`

**Migration:**
- `ResponsiveLayoutManager` deprecated
- See `MIGRATION.md` for details

---

### @pixi/ui v2.2.7

**Nerede Kullanılıyor:**
- `GameByteButton` - Button wrapper
- `GameByteProgressBar` - ProgressBar wrapper
- `GameByteSlider` - Slider wrapper
- `GameByteScrollBox` - ScrollBox wrapper

**Adapter:**
- `src/adapters/UIAdapter.ts`

**Components:**
- Button, FancyButton
- ProgressBar
- Slider
- CheckBox, Switcher
- Input, Select
- List, ScrollBox
- RadioGroup

---

### @pixi/sound v6.0.1

**Nerede Kullanılıyor:**
- `GameByteAudioSource` - Audio playback wrapper
- `GameByteMusicSystem` - Music management
- `GameByteSFXSystem` - Sound effects

**Adapter:**
- `src/adapters/SoundAdapter.ts`

**Features:**
- WebAudio API playback
- Audio sprites
- Filters (reverb, distortion, eq)
- Volume, mute, pause, loop

---

### @pixi/particle-emitter v5.0.8

**Nerede Kullanılıyor:**
- `ArcheroMenu` - Particle effects on interaction
- `ParticleEmitter` - General particle system

**Adapter:**
- `src/adapters/ParticleAdapter.ts`

**Features:**
- GPU-accelerated rendering
- Flexible emitter configuration
- Particle behaviors
- Visual editor support

---

### pixi-filters v6.1.4 (Optional)

**Status:** Optional dependency

**Nerede Kullanılıyor:**
- `FilterLibrary` - Facade for easy filter usage

**Available Filters:**
- Blur, Glow, Bloom
- ColorMatrix, ColorOverlay
- Pixelate, Noise
- OldFilm, CRT
- DropShadow, Bevel
- 60+ filters total

---

## 🎓 Best Practices

### 1. Adapter Naming Convention

```typescript
// Pattern: GameByte<ComponentName>
GameByteButton
GameByteLayout
GameByteSoundManager
```

### 2. File Organization

```
src/
├── adapters/
│   ├── LayoutAdapter.ts      # @pixi/layout
│   ├── UIAdapter.ts           # @pixi/ui
│   ├── SoundAdapter.ts        # @pixi/sound
│   └── ParticleAdapter.ts     # @pixi/particle-emitter
├── ui/
│   ├── components/
│   │   └── GameByteButton.ts  # Uses UIAdapter
│   └── layouts/
│       └── FlexLayoutHelper.ts # Uses LayoutAdapter
└── audio/
    └── core/
        └── GameByteAudioSource.ts # Uses SoundAdapter
```

### 3. Testing Strategy

```typescript
// Test both adapter and underlying library
describe('GameByteButton', () => {
  it('should wrap @pixi/ui Button correctly', () => {
    const button = new GameByteButton({ label: 'Test' });
    expect(button.view).toBeInstanceOf(PIXI.Container);
  });

  it('should handle onClick events', () => {
    const onClick = jest.fn();
    const button = new GameByteButton({ label: 'Test', onClick });

    // Simulate click
    button.view.emit('pointertap');

    expect(onClick).toHaveBeenCalled();
  });
});
```

### 4. Performance Monitoring

```typescript
// Track bundle size impact
// Before: 850KB (gzipped)
// After: 920KB (gzipped) - +70KB acceptable

// Runtime performance
// @pixi/layout: ~0.5ms per layout calculation
// @pixi/particle-emitter: 60fps with 1000 particles
```

---

## 🚨 Common Pitfalls

### ❌ Pitfall 1: Direkt Import

```typescript
// YANLIŞ
import { Button } from '@pixi/ui';
export { Button };

// DOĞRU
import { Button as PixiButton } from '@pixi/ui';
export class GameByteButton { /* wrapper */ }
```

### ❌ Pitfall 2: Versiyonsuz Dependency

```json
// YANLIŞ
{
  "dependencies": {
    "@pixi/layout": "*"
  }
}

// DOĞRU
{
  "dependencies": {
    "@pixi/layout": "^3.2.0"
  }
}
```

### ❌ Pitfall 3: Dokümantasyonsuz Adapter

```typescript
// YANLIŞ
export class GameByteButton {
  // No documentation
}

// DOĞRU
/**
 * GameByte Button Component
 *
 * @see https://github.com/pixijs/ui
 * @since GameByte v2.0.0
 */
export class GameByteButton { /* ... */ }
```

---

## 📞 İletişim ve Destek

### Kütüphane ile İlgili Sorunlar

1. **Önce kütüphane dokümantasyonunu kontrol et**
   - Official docs
   - GitHub README
   - API reference

2. **GitHub Issues'da ara**
   - Benzer problem var mı?
   - Solution bulunmuş mu?

3. **GameByte adapter'ı kontrol et**
   - Bizim hatamız mı?
   - Upstream issue mu?

4. **Issue aç**
   - GameByte repo: Framework-specific sorunlar
   - PixiJS repo: Kütüphane sorunları

### Framework Geliştirme

- **GitHub**: https://github.com/gamebyte/framework
- **Discussions**: Yeni özellik önerileri
- **Issues**: Bug reports
- **Pull Requests**: Katkılar

---

## 📅 Versiyon History

| GameByte Version | PixiJS Libraries | Date |
|-----------------|------------------|------|
| v2.0.0 | @pixi/layout@3.2.0, @pixi/ui@2.2.7, @pixi/sound@6.0.1, @pixi/particle-emitter@5.0.8 | 2025-10-16 |
| v1.x.x | Custom implementations | 2025-01-01 |

---

## 🔮 Future Roadmap

### Planned Integrations

- [ ] **@pixi/react** - React support (v3.0.0)
- [ ] **@pixi/spine** - Skeletal animations (v3.1.0)
- [ ] **@assetpack/core** - Asset optimization (build tooling)

### Under Consideration

- [ ] **@pixi/3d** - Native 3D support (when stable)
- [ ] **@pixi/game-engine** - Full game engine integration (when released)

---

## ✅ Checklist (Yeni Kütüphane Entegrasyonu)

- [ ] Research yapıldı
- [ ] Bakım durumu kontrol edildi
- [ ] PixiJS v8 uyumluluğu doğrulandı
- [ ] Adapter tasarlandı
- [ ] Documentation yazıldı
- [ ] Tests yazıldı
- [ ] Examples oluşturuldu
- [ ] Migration guide hazırlandı (eğer gerekiyorsa)
- [ ] CHANGELOG.md güncellendi
- [ ] Bundle size impact değerlendirildi
- [ ] Performance profiling yapıldı
- [ ] Code review yapıldı
- [ ] Production'a deploy edildi

---

**Last Updated:** 2025-10-16
**Maintainer:** GameByte Framework Team
**License:** MIT

# Common Mistakes Guide for Agents

Bu doküman, GameByte Framework geliştirmesinde yapılan yaygın hataları ve doğru çözümlerini içerir.

---

## 1. UMD Bundle'da Dynamic Import Kullanımı

### ❌ YANLIŞ
```typescript
// UMD bundle'da çalışmaz!
private async loadSomething(): Promise<void> {
  const PIXI = await import('pixi.js');  // ERROR: Failed to resolve module specifier
  const texture = await PIXI.Assets.load(url);
}
```

### ✅ DOĞRU
```typescript
// Static import kullan (dosyanın başında)
import * as PIXI from 'pixi.js';

// VEYA framework abstraction'ını kullan (tercih edilen)
import { graphics } from '../../graphics/GraphicsEngine';
```

### Neden?
UMD bundle'lar tarayıcıda çalışırken `import()` ile modül specifier'ları çözümlenemez. Dynamic import sadece ES modules ortamında çalışır.

---

## 2. PIXI Yerine Framework Abstraction Kullanımı

### ❌ YANLIŞ
```typescript
import * as PIXI from 'pixi.js';

// Doğrudan PIXI kullanımı
const sprite = new PIXI.Sprite(texture);
const container = new PIXI.Container();
const text = new PIXI.Text('Hello');
```

### ✅ DOĞRU
```typescript
import { graphics } from '../../graphics/GraphicsEngine';

// Framework factory kullanımı
const gfx = graphics();
const sprite = gfx.createSprite(texture);
const container = gfx.createContainer();
const text = gfx.createText('Hello', { fontSize: 24 });
```

### Neden?
- Framework, PIXI ve Three.js arasında abstraction sağlar
- Gelecekte renderer değişikliği kolaylaşır
- Tutarlı API kullanımı sağlanır

---

## 3. Texture/Sprite Yüklemede Asenkron İşlem

### ❌ YANLIŞ
```typescript
// Texture yüklenmeden boyut ayarlamak çalışmaz
const sprite = gfx.createSprite('image.png');
sprite.width = 800;   // Texture henüz yüklenmemiş, boyut 0x0 olabilir
sprite.height = 600;
container.addChild(sprite);
```

### ✅ DOĞRU
```typescript
// Image element ile önce yükle, sonra sprite oluştur
private loadBackgroundImage(): void {
  const gfx = graphics();
  const img = new Image();

  img.onload = () => {
    // Image yüklendikten sonra texture oluştur
    const texture = gfx.createTexture(img);
    const sprite = gfx.createSprite(texture);

    // Şimdi boyut ayarlanabilir
    sprite.width = this.config.width;
    sprite.height = this.config.height;

    container.addChild(sprite);
  };

  img.onerror = (e) => {
    console.warn('Failed to load image', e);
  };

  img.src = imageUrl;  // Base64 data URI veya URL
}
```

### Neden?
`PIXI.Texture.from()` ve `createSprite()` senkron çalışır ama texture arka planda yüklenir. Texture yüklenmeden boyut ayarlamak beklenmeyen sonuçlar verir.

---

## 4. Base64 Image Optimizasyonu

### ❌ YANLIŞ
```typescript
// 1.2MB PNG doğrudan base64'e çevirmek
const bg = 'data:image/png;base64,...';  // ~1.6MB base64 string
```

### ✅ DOĞRU
```bash
# 1. JPEG'e çevir ve sıkıştır (boyut değişmez)
sips -s format jpeg -s formatOptions 60 image.png --out image.jpg

# 2. Base64'e çevir
base64 -i image.jpg | tr -d '\n' > image-base64.txt

# Sonuç: 1.2MB PNG → 163KB JPEG → ~220KB base64
```

### Neden?
- PNG genellikle JPEG'den çok daha büyük
- Kalite 60 görsel olarak kabul edilebilir ve dosya boyutunu önemli ölçüde düşürür
- Base64, orijinal dosyadan ~33% daha büyük olur

---

## 5. IContainer Interface Metodları

### ❌ YANLIŞ
```typescript
// IContainer'da bulunmayan metodlar
container.sortableChildren = true;  // IContainer'da yok
container.addChildAt(sprite, 1);    // IContainer'da yok
```

### ✅ DOĞRU
```typescript
// Type assertion ile kullan (gerektiğinde)
const pixiContainer = container as any;
if (pixiContainer.addChildAt) {
  pixiContainer.addChildAt(sprite, 1);
} else {
  container.addChild(sprite);
}

// VEYA sadece addChild kullan ve z-ordering için farklı yaklaşım
```

### Neden?
`IContainer` interface'i tüm renderer'lar için ortak metodları tanımlar. PIXI-specific metodlar interface'de olmayabilir.

---

## 6. CSS Animation Kaldırma

### ❌ YANLIŞ
```typescript
// Sadece kaynak dosyayı değiştirmek
// src/ui/splash/GameSplash.ts değişti ama demo hala eski CSS kullanıyor
```

### ✅ DOĞRU
```bash
# 1. Kaynak dosyayı değiştir
# 2. Demo dosyalarında inline CSS varsa onları da değiştir
grep -r "animation-name" docs-site/static/demos/

# 3. Build yap ve UMD kopyala
npm run build && cp dist/gamebyte.umd.js docs-site/static/gamebyte.umd.js
```

### Neden?
Demo dosyaları genellikle inline CSS içerir. Kaynak dosyayı değiştirmek, demo'daki inline CSS'i otomatik değiştirmez.

---

## Özet Checklist

Yeni özellik eklerken:

- [ ] Framework abstraction kullan (`graphics()`, `gfx.createX()`)
- [ ] Dynamic import kullanma (UMD'de çalışmaz)
- [ ] Async image loading için Image.onload pattern kullan
- [ ] IContainer'da olmayan metodlar için type assertion + fallback
- [ ] Demo dosyalarındaki inline CSS/JS'i de güncelle
- [ ] Base64 için optimize edilmiş JPEG kullan
- [ ] Build sonrası UMD'yi docs-site'a kopyala

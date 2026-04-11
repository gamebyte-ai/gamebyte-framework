# Review Findings To Investigate

Bu dosya, son PR incelemesinde tespit edilen ve ayrıca doğrulanması gereken davranışsal riskleri toplar.

## 1. CharacterCard rerender memory leak

- Dosya: `src/ui/components/cards/CharacterCard.ts`
- Satırlar: `127-129`
- Öncelik: `P1`

### Problem

`setStars()`, `setRarity()` ve `updateStats()` metotları `render()` çağırıyor. Ancak `render()` içinde eski yıldız/stat/name node'ları sadece container'dan çıkarılıyor; destroy edilmiyor.

Pixi tarzı display list yapısında `removeChildren()` ve `removeChild()` node'ları sadece sahneden ayırır, kaynakları serbest bırakmaz. Bu da özellikle sık stat güncelleyen kartlarda zamanla memory/GPU leak oluşturabilir.

### İncelenecek

- `removeChildren()` sonrası dönen child'lar explicit `destroy()` edilmeli mi?
- `nameText` yeniden yaratılmak yerine reuse edilebilir mi?
- Dynamic render yerine persistent node update yaklaşımı daha doğru mu?

## 2. ItemCard rerender memory leak

- Dosya: `src/ui/components/cards/ItemCard.ts`
- Satırlar: `125-135`
- Öncelik: `P1`

### Problem

`ItemCard` her `render()` çağrısında icon, badge ve text node'larını yeniden oluşturuyor. Temizlik aşamasında bu child'lar sadece `removeChild()` ile ayrılıyor, destroy edilmiyor.

`setSelected()`, `setEquipped()` ve `setRarity()` sık çağrılabilen API'ler olduğu için uzun ömürlü inventory/grid ekranlarında detached display object birikmesi ve memory leak riski var.

### İncelenecek

- Render öncesi çıkarılan dynamic child'lar destroy edilmeli mi?
- Badge/text/icon node'ları recreate yerine update edilerek reuse edilebilir mi?
- `Graphics` ve `Text` objeleri için net lifecycle standardı tanımlanmalı mı?

## 3. RewardCard animation cleanup eksik

- Dosya: `src/ui/components/cards/RewardCard.ts`
- Satırlar: `261-313`
- Öncelik: `P2`

### Problem

`tweenScaleX()` ve `playShineEffect()` recursive `requestAnimationFrame` kullanıyor; ancak frame id'leri saklanmıyor ve `reset()` / `destroy()` sırasında iptal edilmiyor.

Kart animasyon ortasında resetlenir ya da destroy edilirse callback'ler çalışmaya devam edip teardown sonrası `container` ve `shineGraphics` üzerinde mutation yapabilir. Bu da gereksiz frame işi, görsel bug ve teardown sonrası erişim riskleri doğurur.

### İncelenecek

- Aktif RAF id'leri tutulup `reset()` ve `destroy()` içinde cancel edilmeli mi?
- `disposed` / `isActive` guard eklenmeli mi?
- Aynı anda birden fazla shine veya flip animasyonu başlamasını engelleyen ek lifecycle kontrolü gerekli mi?

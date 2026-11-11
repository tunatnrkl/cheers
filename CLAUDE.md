# Proje notları

## El ekleme kuralı (zamanlanmış "cheers" görevi)

Her el ekleme turunda, alıştırma masasındaki spot filtresinde **en az ele sahip konuya 100 yeni el** ekle
(`src/data/hands.ts` içindeki `TOPICS`; sayım `HANDS` üzerinden konu başına yapılır).
- 100 el elle yazılamayacağı için `scripts/` altında doğrulanabilir bir üretici yaz
  (örnek: `scripts/generate-defense.mts` → `src/data/defense.json`), çıktıyı `HANDS`'e ekle.
- Sınıra yakın, tartışmalı elleri dışarıda bırak; cevabı `src/lib/poker/hands.test.ts` içinde yeniden kontrol et.
- `npm test` ve `npm run typecheck` geçmeden commit etme; README'deki spot sayısını güncelle.
- Id önekleri diğer dallarla çakışmamalı (kullanılanlar: c, t, cz, tz, cv, tv, x, n, r-, p, s, o-, d-).

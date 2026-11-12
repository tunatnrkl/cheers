# Karar günlüğü (Onay Ajanı)

Ürün sahibi 2026-11-12'de aşama onaylarını ve açık kararları Onay Ajanı'na devretti. Görev tanımı: [`ONAY-AJANI.md`](ONAY-AJANI.md). Her kapı kararı buraya eklenir.

## 2026-11-12 · Kapı 1: repo analizi ve altı açık karar · PLAN: ONAY

| # | Konu | Karar | Koşullar |
|---|---|---|---|
| 1 | Derleme aracı | Next.js'te kal | **Brif sapması** (aşağıda). `out/` üzerinde "harici istek yok" testi. Yeni çalışma anı bağımlılığı yok. |
| 2 | Koç canlı sitede | Pages'te yazılı ve kural tabanlı koç; sunuculu kurulumda aynı pencere yapay zekaya bağlanır | Pages'te pencere kendini "yapay zeka" diye tanıtmaz. Yalnızca spot verisindeki doğrulanmış sayılar. Çıktıda anahtar ya da API adresi olmadığı testle doğrulanır. |
| 3 | Rakip eli | 70 pot odds spotu rakip aralığına karşı yeniden üretilir; rakip eli veride durmaz, showdown'da türetilir | Kimlikler değişmez. Aralık "varsayım" olarak yazılır. Cevabı değişen spotlar önce/sonra tablosuyla raporlanır. Ayrı kapıdan geçer. O kapı geçilmeden pot odds spotlarına dokunan özellik yayınlanmaz. |
| 4 | XP, günlük seri, kutlama | Brif uygulanır, sınırlarla | XP, günlük seri, seviye yalnızca Öğren'de. Alıştırmada yalnızca 5 ve 10'luk seride "Şerefe!". XP sabit; rastgele ödül, sandık, çarpan, can, rozet, liderlik tablosu, bildirim, geri sayım yok. Seri kopunca nötr dil. Ara kartı korunur. |
| 5 | Zamanlanmış ekip çalışmaları | `HAFIZA.md` başına kural: yeniden tasarım süresince yalnızca `docs/` | Uygulayan ajan her aşama başında varsayılan dalda `src/` altında yabancı commit arar; kural çiğnenirse ürün sahibine bildirir. |
| 6 | Yayın | Aşama aşama | Yayın iş akışına derlemeden önce `npm test` ve `npm run typecheck` eklenir. Bitmemiş bölüm bağlantısız kalır. |

### Brif sapmaları

- **Karar 1.** Brif "derleme aracı yok, saf HTML/CSS/JS" diyor. Site Next.js ile derlenmeye devam ediyor; yayınlanan çıktı saf statik HTML/CSS/JS ve çalışma anında harici kütüphane yok. Gerekçe: 577 spot ve 631 testi elle yazılmış koda taşımak veri ve doğruluk için en yüksek risk. Son söz ürün sahibinde.
- **Karar 4, kalıcı sayaç.** Brif alıştırma üst çubuğunda bira ikonlu seri sayacı istiyor; ajan kalıcı sayacın geri gelmemesini koşul koydu. Uygulama: sayaç yalnızca seri 5'e ulaştığında görünür.

### Ek kurallar

1. Her kapıda kanıt: `npm test`, `npm run typecheck`, statik derleme, ekran görüntüsü.
2. Brif metninden her sapma bu dosyada "brif sapması" olarak yazılır.
3. İlerleme şemasına dokunan her değişiklikte eski `pd-…` anahtarlarını okuyan geçiş testi; XP ve seri yeni anahtarlarda.
4. Yeni poker sayıları üreticiden gelir ve testle sabitlenir; emin olunmayan "doğrulama gerekli".
5. Sızıntı testi ve "harici istek yok" testi her yayında zorunlu kapı.

Ajanın denetim notu: depo salt okunur incelendi; test ve derleme ajan tarafından çalıştırılmadı, spot ve test sayıları uygulayan ajanın beyanıdır.

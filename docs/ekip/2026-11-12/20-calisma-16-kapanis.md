# 16. çalışma: dal onarımı, 60 river blöf spotu, blöf yazısı, koç sohbeti yedeği (F-1)

**Tarih:** 2026-11-12 · **Dal:** `claude/wizardly-meitner-p4oajz` (15. çalışmanın dalı `stm5g6` üzerine kuruldu, 13'ün ek commit'i `b211215` eklendi)

## Başlangıç durumu

- Bu çalışmanın dalı varsayılan dalla aynı yerdeydi (`8ffc135`). En yüksek "Son güncelleme" `stm5g6`'da (15. çalışma).
- **Bulgu (P-5):** `56jps3` dalında 13. çalışmaya sonradan eklenmiş bir commit var (`b211215`): kullanıcının **kalıcı talimatı** ("her çalışmada en az spotlu konuya en az 50 alıştırma") ve 60 river value spotu. 14. ve 15. çalışmalar bu commit'ten önceki `ac8c3d7`'den dallandığı için talimatı görmedi ve uygulamadı. `b211215` bu zincire alındı (README, `hands.test.ts`, `HAFIZA.md` çakışmaları elle çözüldü; `npm run ranges` çıktısı commit'tekiyle bayt bayt aynı).
- `hou5l2` dalı 9. çalışmanın paralel, eski bir kopyası (varsayılan daldan dallanmış); içeriği zincirde farklı biçimde var, birleştirilmemeli.
- Sağlık (birleştirme sonrası): `npm test` 770/770.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Dal onarımı (P-5) | Kalıcı talimatı ve 60 value spotunu zincire almak | Çakışmasız birleşme, testler yeşil, üretim tekrarlanabilir | CEO, QA |
| 2 | Kalıcı talimat | En az spotlu konuya ≥ 50 doğrulanmış spot | Konu ölçüldü; cevap kesin sayımla; varsayım `note`'ta; sınırda olan yok; üreteçten bağımsız test; eski spotlar bayt bayt aynı | Poker Uzmanı, QA |
| 3 | Blöf yazısı | Yeni spotların mantığını öğretmek | Terimler ilk geçtiği yerde açıklanmış; sayılar spotlardan ve testte yeniden hesaplanıyor; varsayımlar ve sorumlu oyun notu var | Content, Poker Uzmanı, QA |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok), **Davranış Bilimleri** (yeni mekanik yok), **UI/UX, Backend** (yeni ekran ya da uç nokta yok), **Poker Eğitim** (quiz gerekmedi; 60 spot + yazı bu çalışmanın yükü). QA sırasında bulunan F-1 küçük bir Frontend düzeltmesiyle kapatıldı.

## 1. Konu ölçümü ve seçim

Başlangıç: `3bet` 5, `cbet` 5, `blof` 5, `savunma` 6, `spr` 6, `icm` 12, `value` 63, `odds` 75, `acilis` 122, `callshove` 122, `pushfold` 222. En az spotlu üç konu eşit. Doğrulanabilir bir model kurulabilen `blof` seçildi: value bölümüyle aynı river senaryosu ve aynı kombinasyon sayımı, yalnızca kahramanın elinde çift yok. `3bet` ve `cbet` için tek sokakta kesin sayılabilen bir model bu çalışmada kurulmadı (öneriler hafızada).

## 2. 60 river blöf spotu (Poker Uzmanı)

**Senaryo:** BTN 2,5 BB açtı, BB call etti; flop ve turn check-check; river'da BB check etti. Pot 5,5 BB. Seçenekler: Check / Bahis 1,8 BB.

**Varsayım (`note`'ta):** BB'nin aralığı sitedeki buton açılış aralığı, AA, KK, QQ ve AK hariç; önceki check'lerle daralmamış; bahse çift ve üstüyle call eder, çiftsiz ellerle (as yüksek dahil) fold eder; check-raise yok. **Solver çıktısı değildir.**

**Karar:** BB'nin her kombinasyonu sayılır (kahramanın ve board'un kartları çıkarılır). Bahsin check'e göre farkı: call eden elde 1,8 × (2s − 1), fold eden elde 5,5 × (1 − s); s = kahramanın showdown sonucu (1 / 0,5 / 0). Temel senaryoda call edenlerin hepsi kahramanı yendiği için bu, tek orana iner: (fold edip seni yenecek) / (call eden) > 1,8 / 5,5 ≈ 0,33 ise bahis. Kahraman showdown'da hiç kazanamıyorsa bu, bilinen "%24,7 fold yeter" kuralıyla aynıdır.

**Sağlamlık:** üç senaryo — temel (çift+ call), sıkı (üst çift, overpair ve üstü), geniş (çift+ ve elinde as olan her el). Üçünde aynı cevap ve kombinasyon başına en az 0,07 × bahis fark yoksa spot alınmadı.

**Çıktı:** `bl-<kahraman>-<board>`, 30 bahis, 30 check; üreteçte 6. bölüm, tohum 20261116. Gerekçe her spotta call payını, fold edip kahramanı yenecek payı, oranı ve hangi senaryoda sonucun değişmediğini yazıyor. Check spotlarında iki farklı ders ayrıldı: "elin fold edecek ellerin çoğunu zaten yeniyor (showdown değeri)" ve "fold edecek el neredeyse yok (bağlantılı board)".

**Yazım kontrolü:** ilk taslakta "%3'ü yenersin", "%75'i elin zaten yeniyor" gibi hatalı ekler ve fold payı %14 iken "neredeyse yok" ifadesi vardı; yayından önce düzeltildi (eşik %10, yüzde ekleri `pctWithSuffix`).

## 3. Testler (QA)

`hands.test.ts` → "river blöf spotları" (3 test):
- En az 50 spot, iki tarafta en az 15, konu `blof`.
- Üreteçten bağımsız yeniden hesap: pot 5,5, call yok, board ve kahraman çiftsiz; üç senaryoda işaret cevapla aynı ve fark ≥ 0,07; gerekçedeki oran ±0,006; oran eşik karşılaştırması cevapla aynı.
- Blog örnekleri: yazıdaki 15 sayı (yüzdeler, oranlar, %24,7) spotlardan yeniden hesaplanıyor.
- **Mutasyon denemesi:** `bl-Kd9c-5sQc2d4s3h`'nin cevabı ters çevrildi → test başarısız oldu ("base: expected false to be true"). Geri alındı.
- Önceki 578 üretilmiş spot `drills.json`'da bayt bayt aynı (karşılaştırıldı).

## 4. Blog: `river-blof-mu-check-mi` (Content)

Bölümler: üç terim (blöf, showdown değeri, aralık), bilinen %24,7 kuralı ve neyi atladığı, "fold ettirdiğin eller kimdi?" oranı, üç örnek (J9o blöf, oran ≈ 0,71; K9o check, ≈ 0,09; 86s bağlantılı board'da check, %98 call), akılda kalacak üç nokta, varsayımlar ve sınırlar, alıştırma masası bağlantısı ve sorumlu oyun notu. Kazanç vaadi yok.

## 5. F-1: koç sohbetinde gerekçe görünmüyordu (Frontend, QA)

Tarayıcı denemesinde bulundu: sunuculu kurulumda `ANTHROPIC_API_KEY` yokken "Neden?" yalnızca "Yapay zeka asistanı bu kurulumda etkin değil" hatası veriyordu; spotun yazılı gerekçesi hiçbir yerde görünmüyordu (statik sürümde görünüyordu). Düzeltme: `CoachChat.tsx`'te 503 yanıtında, cevap verilmişse ve soru "neden" içeriyorsa `hand.reasoning` gösteriliyor. Anahtar tanımlıyken davranış değişmez.

## 6. Tarayıcı denemesi (QA)

`npm run build && next start`, Playwright (Chromium), 390 ve 1366 px:

| Kontrol | Sonuç |
|---|---|
| `/blog/river-blof-mu-check-mi` açılıyor, başlık doğru, yatay taşma | ✅ 0 px |
| `?el=bl-Jh9d-4d8c6c2d5s`: not görünüyor, "Bahis" → "Doğru!", "Check" → yanlış geri bildirimi | ✅ |
| `?el=bl-Kd9c-5sQc2d4s3h`: "Check" → "Doğru!" | ✅ |
| "Neden?" → gerekçe metni (F-1 sonrası) | ✅ iki boyutta, iki spotta |
| Filtre "Blöf ve bluff catch (65)" | ✅ |
| Konsol hatası, 4xx/5xx | ✅ yok |

Denenmeyen: açık tema, GitHub Pages statik derleme, gerçek ekran okuyucu.

## 7. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| Dal onarımı | Çakışmasız, yeşil, tekrarlanabilir | ✅ |
| 60 blöf spotu | Ölçüm, kesin sayım, not, sınırda yok, bağımsız test, eski spotlar aynı | ✅ |
| Blöf yazısı | Terimler açıklanmış, sayılar testli, varsayımlar ve sorumlu oyun notu | ✅ |
| F-1 | Gerekçe anahtarsız kurulumda görünüyor | ✅ |

Poker iddiaları yeniden okundu:
- "Blöf için en iyi eller genellikle showdown'da hiç kazanamayacak ellerdir" — bu rakip modelinde ölçülen eğilim (bahis cevaplı spotlarda check'te kazanma payı %0–14; check cevaplıların çoğunda K/A yüksek). Genel bir solver sonucu olarak sunulmadı.
- Karar, rakip modeline karşı **en iyi cevaptır**; denge (GTO) stratejisi değildir. Yazıda ve hafızada "solver ile karşılaştırılmadı" diye yazılı.
- Kart çakışması (blocker) sayımda kendiliğinden var; ayrıca bir blocker iddiası yapılmadı.

Sağlık: `npm test` **833/833**, `npm run typecheck` temiz, `npm run build` temiz.

## Kullanıcı kararı gerekenler

1. **Dal:** `claude/wizardly-meitner-p4oajz` (bu dal) 9–16 ve 13'ün ek commit'ini içerir; yalnızca bunu varsayılan dala almak yeterli. `56jps3`, `hou5l2` ayrıca birleştirilmemeli.
2. **B-1:** karışık stratejili spotlar için `acceptable` alanı.
3. Görev metnindeki `[HAFIZA_DOSYASI_ADI]` hâlâ yer tutucu; öneri `HAFIZA.md`.

# 21. çalışma — kapanış raporu (2026-11-12)

## CEO önceliklendirme

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Kalıcı talimat: en az spotlu konu `icm` (12) | `icm`'ye ≥ 50 doğrulanabilir spot | Cevap ICM eşiğiyle belirleniyor, testte üreteçten bağımsız yeniden hesaplanıyor; eşiğe 3,5 puandan yakın spot yok; ödül yapısı ve aralık `note`'ta; önceki 878 üretilmiş spot bayt bayt aynı | Poker Uzmanı, QA |
| 2 | SPR içerik boşluğu (20'den açık) | `sp` spotlarına dayanan SPR yazısı, quiz'e bağlı | Yazıdaki her sayı testte spotların gerekçesiyle ya da formülle karşılaştırılıyor; varsayımlar ve sınırlar yazılı | Content, Poker Uzmanı, QA |
| 3 | Yeni ICM spotlarını öğretime bağlama | Bubble call/fold quiz'ine 2 soru | Sorular spotlarla aynı sayıları kullanıyor, testli; quiz ≤ 10 soru | Poker Eğitim, QA |

Dal: `0vqn8r` (20) ana dala alınmamıştı; çalışma onun üzerine kuruldu. Yan dallarda zincir dışı yeni commit yok (`05x26x`, `56jps3`, `cg0oun`, `hou5l2`, `w5y8as` bilinen durumda).

## 1. Bubble ICM call/fold spotları (`ic-…`, 60 spot) — Poker Uzmanı, QA

**Model** (`scripts/generate-ranges.mts`, 11. bölüm, tohum 20261210 seçim / 20261211 ölçüm):
- Sit & go bubble'ı, 4 oyuncu (CO, BTN, SB, BB), ilk 3 ödül alır. **Varsayım:** ödüller %50 / %30 / %20. Toplam ante 1 BB (ölü para).
- CO, BTN ya da SB sitedeki referans push aralığıyla (6/10/15 BB) all-in yapar, aradakiler fold eder. Kahraman BB'de ve all-in yapanı kapsıyor ya da eşit (iade modellenmez).
- Tek el ICM (Malmuth-Harville, `src/lib/poker/math.ts`): gereken equity = (F − L) / (W − L). Beraberlik yarım sayılır (yaklaşım; 3,5 puan payın çok altında).
- Equity Monte Carlo, ayrı üreteçle 80.000 deneme. Cevap ICM eşiğinden ≥ 3,5 puan uzak; all-in yapan ≈ 0,7 kat ve ≈ 1,4 kat genişlikteki referans aralıkla (> %80 ise her el) iterse de aynı ve eşikten ≥ 1 puan uzak.
- "Chip hesabıyla call kârlı olurdu" / "chip hesabıyla bile yetmezdi" cümleleri yalnızca chip eşiğinden ≥ 2 puan uzaktaysa seçiliyor.
- 8 stack dağılımı; risk primi (ICM eşiği − chip eşiği) 2,6 puan (SB 6 BB vs BB 25) ile 16,4 puan (BTN 15 vs BB 15, SB 10 BB'yle masada) arasında.

**Sonuç:** 60 spot, **30 call / 30 fold**; fold'ların 26'sı "chip'e göre call, ICM'e göre fold", 4'ü "chip'e göre de fold". Aynı elin dağılıma göre değişmesi öğretiliyor: 22 (10/10'da fold, SB 6'ya karşı 25 BB'de call), KQo (15/15'te fold, BTN 6'ya karşı 14 BB'de call), 77, 44.

**QA:**
- Üreteçten bağımsız test (`hands.test.ts`, "ICM bubble call/fold spotları (ic-)"): stack'ler ve pot `replay`'den, eşikler `icm()` ile, equity testin kendi Monte Carlo'suyla (40.000, ayrı tohum), komşu aralık seçimi yeniden yazıldı. Cevap, iki komşu aralıkta cevap, gerekçedeki chip eşiği / ICM eşiği / fold payı (±0,05), equity ve komşu equity'ler (±1 puan), call payı, nottaki yüzde, "ödülsüz 4. olursun" cümlesi.
- Mutasyon denemesi: `ic-SB15-15-KsQh`'nin cevabı ters çevrildi → yakalandı; `ic-SB6-25-2s2h` gerekçesinde ICM eşiği 1 puan değiştirildi → yakalandı.
- QA bulgusu (yayından önce düzeltildi, IC-1): ilk test sürümü call payını testin kendi equity'siyle ±0,3 puan karşılaştırıyordu; Monte Carlo farkı (W − L ≈ 0,3 ile çarpılıyor) bir spotta sınırı aştı. Call payı artık gerekçedeki equity'den hesaplanıyor (±0,07); equity ayrıca ±1 puanla sınırlı.
- `drills.json`'un ilk 878 kaydı eskisiyle bayt bayt aynı; `ranges.json` değişmedi. Boş kalan 9. dağılım kaldırıldı, çıktı aynı.

## 2. Blog: `spr-ve-all-in-fiyati` (13. yazı) — Content, Poker Uzmanı, QA

- "SPR ve flop all-in'i: fiyat az değişir, aralık çok". Terimler (efektif stack, SPR, gereken equity, aralık) ilk geçtiği yerde açıklandı.
- Fiyat tablosu: 12 BB → %39,2 … 40 BB → %46,6; eşik hiçbir derinlikte %50'yi geçmez.
- Dört örnek, hepsi `sp` spotu: Q5s 12 BB (%70,1, call) ile A8o 40 BB (%10, fold) aynı "üst çift"; 99 board A-10-7 (%18,7, geniş aralıkta bile %39,2 < %44); QQ 40 BB (%53, call).
- Aralık daralmasının **varsayım** olduğu, ICM yokluğu, 12–16 BB basitleştirmesi "Varsayımlar ve sınırlar"da. Sorumlu oyun cümlesi var.
- `spr-ve-value` quiz'inin ilk `posts` girdisi bu yazı (yazıdaki "Quiz ile tekrarla" düğmesi bu quiz'i açıyor).
- Test (`hands.test.ts`, "blog: spr-ve-all-in-fiyati"): beş fiyat ve SPR formülden; örnek sayıları spotların gerekçesinde ve yazıda, cevaplar.

## 3. Bubble call/fold quiz'i 7–8. sorular — Poker Eğitim, QA

- 7: aynı dağılımda (SB 15 / BB 15, CO 35) AKo call, KQo fold; chip eşiği %45,2, ICM eşiği %58,2, risk primi 13 puan → `ic-SB15-15-KsQh`.
- 8: BB 25 BB, SB 6 BB all-in; risk primi yalnızca ≈ 2,6 puan, çünkü kaybetsen de 19 BB kalıyor; 22 call → `ic-SB6-25-2s2h`.
- Quiz artık 8 soru. Test (`quizzes.test.ts`): sorulardaki sayılar spot gerekçeleriyle aynı, cevaplar spotlarla tutarlı.

## Sağlık

- `npm test` **1154/1154** (20 sonunda 1089), `npm run typecheck` temiz, `npm run build` temiz.
- `npm run ranges` ≈ 4,1 dk (ICM bölümü ≈ 50 sn ekledi). Tekrarlanabilir.
- Playwright 390/1366 px (yerel `next start`): `ic-SB15-15-KsQh` ve `ic-SB6-25-2s2h` `?el=` ile açılıyor, "Call (14 BB)" / "Call (5 BB)", masada pot 8 BB ve stack'ler doğru, doğru cevapta "Doğru!"; "ICM ve bubble (72)" filtresi; yazı ve quiz düğmesi; quiz 7–8 ve spot bağlantıları masada açılıyor; blog listesinde yazı. Taşma 0, konsol/4xx 0. (Açık tema, Pages `basePath`, ekran okuyucu denenmedi.)

## CEO kalite kontrolü

| İş | Başarı kriteri | Durum |
|---|---|---|
| 1 | 60 ≥ 50 spot, ICM eşiği, bağımsız test, 3,5 puan payı, önceki çıktı aynı | ✅ |
| 2 | Yazıdaki sayılar testli, varsayımlar yazılı | ✅ |
| 3 | Sorular spotlarla aynı ve testli, ≤ 10 soru | ✅ |

**Revizyon notu (iş 1, kalite):** 30 call spotunun 14'ü AA–JJ ya da AK; öğretici değeri düşük (bariz call). Kriter karşılandı, ama bir sonraki ICM çalışmasında call tarafında premium el sınırı (ör. dağılım başına en fazla 1) konmalı.

Poker iddialarının gözden geçirilmesi:
- ICM eşiği formülü ve chip eşiği kesin matematik (verilen stack'ler ve ödüllerle). "Kazanırsan bubble biter" doğru: all-in yapan kahramandan büyük değil.
- "Risk primi" ifadesi sitenin `risk-primi-hesabi` yazısıyla aynı anlamda (ICM eşiği − chip eşiği).
- **Doğrulanamadı:** %50/%30/%20 ödül yapısı varsayım; referans push aralıkları sitenin kendi sıralamasından, Nash ya da solver değil; bubble'da gerçek oyuncuların bu aralıklarla itip itmediği bilinmiyor (bu yüzden iki komşu aralık ölçüldü). Tek el ICM, gelecek el oyunu (FGS) yok; bağımsız bir ICM aracıyla karşılaştırılmadı (yalnızca sitenin `icm()` fonksiyonu, `math.test.ts`'te bilinen değerlerle testli).

## Atlanan roller

- **Data Analyst:** kullanıcı verisi yok.
- **Davranış Bilimleri, UI/UX, Frontend, Backend:** yeni mekanik, ekran ya da uç nokta yok; değişiklik veri, yazı, quiz ve test.

## Sonraki öncelikler

1. **Kalıcı talimat:** konu sayıları (21 sonu): `value` 63, `3bet`/`blof`/`cbet` 65, `savunma`/`spr` 66, `icm` 72, `odds` 75, `acilis`/`callshove` 122, `pushfold` 222. En az: **`value` (63)**. Aday: river value'nun ikinci bahis boyutu (2/3 pot) ya da turn value bet; 5. bölümün kombinasyon sayımı yeniden kullanılabilir.
2. ICM call tarafında premium el sınırı (revizyon notu) ve SB push tarafının üreteçte bölüm olarak kurulması (`ip` yöntemi).
3. B-1 kararı geldiyse `acceptable` alanı + c39.

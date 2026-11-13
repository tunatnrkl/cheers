# Ünite c10 · Value ve blöf: öz denetim

Kaynak: `scripts/mufredat/icerik/c10.json`. 8 ders (6 normal + kontrol + tekrar; iskelet gereği bu ünitede seviye testi yok, "Seviye 6-8 testi" c11'de), 86 alıştırma. Üç spot alıştırması `kabulEdilebilir` ve `dogrulamaGerekli: true` taşır (c23, c24, c26); geri kalanlar `dogrulamaGerekli: false`.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | Spot | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `c10-d1` Value bet | ders | 3 | 11 | dogruYanlis 2, eslestirme 1, sayi 4, secmeli 4 | 1–5 | 4 | — | Value bet, Top pair, Kicker, Set, İki per, Kombinasyon (combo), Calling station |
| `c10-d2` Value boyutlandırma | ders | 3 | 11 | dogruYanlis 2, eslestirme 1, sayi 4, secmeli 3, spot 1 | 1–5 | 4 | c20 | Value bet, Bahis boyutu (sizing), Calling station, Equity, Range (aralık) |
| `c10-d3` Blöf seçimi | ders | 3 | 11 | dogruYanlis 2, eslestirme 1, sayi 3, secmeli 3, spot 2 | 1–5 | 3 | c32, c28 | Blöf, Saf blöf, Semi-blöf, Fold equity, Equity, Showdown değeri, Blocker, Calling station |
| `c10-d4` Check-raise | ders | 3 | 11 | dogruYanlis 2, eslestirme 1, sayi 3, secmeli 3, spot 2 | 1–5 | 3 | c23 (k.e.), c26 (k.e.) | Check-raise, Value bet, Semi-blöf, Set, İki per, Combo draw, Slow play, Islak board, Kuru board |
| `c10-d5` Donk bet | ders | 3 | 11 | dogruYanlis 3, eslestirme 1, sayi 2, secmeli 5 | 1–5 | 3 | — | Agresör, Donk bet, C-bet (continuation bet), Range avantajı, Nut avantajı, Check-raise |
| `c10-d6` Pot kontrolü | ders | 3 | 11 | dogruYanlis 2, eslestirme 1, sayi 3, secmeli 3, spot 2 | 1–5 | 3 | c30, c24 (k.e.) | Pot kontrolü, SPR, Showdown değeri, Cep çifti, Top pair, Overpair, IP (pozisyonda) |
| `c10-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, eslestirme 1, sayi 4, secmeli 3, spot 2 | 1–5 | 4 | c20, c32 | — |
| `c10-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 3, secmeli 2, spot 1 | 2–5 | 3 | c28 | — |

(k.e.: `kabulEdilebilir` + `dogrulamaGerekli: true`.)

**Toplam tip dağılımı:** seçmeli 26, sayı 26, doğru/yanlış 17, spot 10, eşleştirme 7.

**Betik sonucu:** 86 alıştırmanın 27'si `denetle.mts` ile denetlendi, hata 0. Türler: gerekenEquity 5, basabasFold 5, blokerKombo 4, oranYuzde 3, toplam 3, carpim 2, spr 2, outs 1, tutma 1, boardSec 1. Bu ünitede yeni denetim türü yok.

## Betik neyi doğruluyor

- **Value merdiveni (`blokerKombo`, 4):** river board'u ve elindeki kartlar desteden çıkarılarak rakibin daha kötü (KQ 8) ve daha iyi (K8 6) ellerinin kombinasyonları; blöf blokeri (A♣ varken AK 9; board'da da as varken 8).
- **"Görüldüğünde önde olma payı" (`oranYuzde`, 3):** öğretim örneklerinde verilen kombinasyon sayılarından (12 / 16 = %75, 6 / 14 ≈ %42,9, 9 / 12 = %75). Kombinasyon sayıları soruda verilir; betik bölmeyi doğrular. "%50 ölçüsü" yalnızca river'da ve rakibin raise etmeyeceği varsayımıyla yazıldı.
- **Boyut ve ortalama kazanç (`gerekenEquity`, `carpim`):** river'da 10 / 40 = %25, 20 / 60 ≈ %33,3; öğretim örneğinde 12 / 20 × 10 = 6 BB ve 5 / 20 × 20 = 5 BB. Görme sıklıkları (12, 5) öğretim varsayımıdır, ölçülmüş değer değildir; soruda öyle yazılı.
- **Blöf ve check-raise başabaşı (`basabasFold`, 5):** 8 / 20 = %40 (c32 gerekçesiyle aynı), check-raise 8 / 16 = %50, donk bet 3 / 9 ≈ %33,3, 15 / 35 ≈ %42,9, 5 / 15 ≈ %33,3.
- **Pot büyümesi ve SPR (`toplam`, `spr`):** üç sokak yarım pot bahisle 10 → 80 BB; stack'te 80 − 35 = 45 BB kalır; turn SPR 94 / 12,5 ≈ 7,5; 45 / 30 = 1,5. Girdiler senaryodan elle girilir.
- **Combo draw (`outs`, `tutma`):** 9♥ 8♥ / T♥ 7♥ 2♣ → 15 out; flop'tan river'a kesin 1 − C(32, 2) / C(47, 2) ≈ %54,1.
- **`boardSec` (1):** c10-d5/a5'te seçeneklerden yalnızca birinin tanıma göre ıslak olduğu denetlenir; donk bet'in o board'da anlamlı olduğu ilkesi betikte değildir.

## Betikle denetlenmeyenler

59 alıştırma ilke ve tanım sorusudur: value bet'in sorusu, boyutun rakip tipine göre yönü, saf/yarı blöf ayrımı, blöf adayında showdown değeri ve bloker, check-raise aday grupları ve seyrekliği, donk bet'in tanımı ve seyrekliği, pot kontrolü ve SPR ilişkisi. Hepsi "genellikle / çoğunlukla" diliyle; boyutlar "yaygın başlangıç noktası" (check-raise "bahsin 3–4 katı civarı"). **Value ya da blöf sıklığı, value/blöf oranı ya da alpha verilmedi**; MDF anılmadı (c12-d3).

## Spot seçimi ve karışık stratejiler

- **c23** (ıslak board'da set): docs/ekip/2026-11-11/01-spot-denetimi.md, B-1; slow play call `kabulEdilebilir`.
- **c24** (düşük SPR'de AA): docs/ekip/2026-11-11/01-spot-denetimi.md, B-1; call `kabulEdilebilir`. c8-d6/a11'deki aynı spot da artık böyle işaretli; c09 (c7) de.
- **c26** (combo draw): spot gerekçesi "Call da kârlıdır" diyor; call `kabulEdilebilir`.
- Hepsi `dogrulamaGerekli: true`; neden metinleri "savunulabilir bir seçenek, karar kesin değil" der.
- c21, c22, c33 (river bluff catch ve ince value) c12'ye, c25 ve c27 c11'e bırakıldı. Donk bet için uygun spot yok (bkz. 02).

## Onay Ajanı düzeltmeleri (2026-11-13)

- c10-d1 anlatımı: seni yenen eller arasına river'daki 6 ile tamamlanan kentler (75, 53) eklendi.
- c10-d2/a10 ve c10-k/a12: iki cevaba açık durum metni "rakibin aralığı geniş ve zayıf; büyük bahse çoğunlukla fold eder" diye daraltıldı; anlatıma calling station ile farkı eklendi.
- c10-d6 anlatımı: "stack'lerin önemli bir kısmı (80 BB'lik stack'te üç yarım pot bahis 35 BB)".
- hands.ts gerekçeleri (c20, c23, c26, c28, c32) Onay Ajanı'nın metinleriyle düzeltildi; c7 ve c8'deki c09 ve c24 alıştırmaları `kabulEdilebilir` ile işaretlendi.

# Ünite c7 · 3-bet ve ötesi: öz denetim

Kaynak: `scripts/mufredat/icerik/c7.json`. 10 ders (8 normal + kontrol + tekrar), 107 alıştırma; hepsi `dogrulamaGerekli: false`. Cash varsayımları: 6-max, 100 BB, 2,5 BB açılış (SB'den 3 BB), rake yok.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | Spot | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `c7-d1` 3-bet nedir, neden yapılır | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, sayi 3, secmeli 4 | 1–5 | 4 | — | 3-bet, Value bet, Fold equity, Blöf |
| `c7-d2` Value 3-bet ve blöf 3-bet | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, sayi 2, secmeli 4, spot 1 | 1–5 | 4 | c05 | 3-bet, Value bet, Blöf, Lineer aralık, Polarize aralık, Cold call |
| `c7-d3` Blokerler | ders | 3 | 11 | dogruYanlis 3, sayi 4, secmeli 3, spot 1 | 1–5 | 7 | c08 | Blocker, Kombinasyon (combo), 3-bet |
| `c7-d4` 3-bet boyutları | ders | 4 | 11 | dogruYanlis 1, sayi 6, secmeli 3, spot 1 | 1–5 | 6 | c07 | 3-bet, IP (pozisyonda), OOP (pozisyon dışı), Bahis boyutu (sizing) |
| `c7-d5` 3-bet'e karşı oynamak | ders | 3 | 10 | dogruYanlis 2, eslestirme 1, sayi 3, secmeli 3, spot 1 | 1–5 | 4 | c10 | 3-bet, 4-bet, Dominasyon, OOP (pozisyon dışı) |
| `c7-d6` 4-bet ve 5-bet | ders | 3 | 11 | dogruYanlis 2, sayi 5, secmeli 2, siralama 1, spot 1 | 1–5 | 5 | c09 | 4-bet, 5-bet, All-in, Polarize aralık, Blocker |
| `c7-d7` Squeeze | ders | 3 | 11 | dogruYanlis 2, sayi 5, secmeli 3, spot 1 | 1–5 | 5 | c12 | Squeeze, 3-bet, Fold equity, OOP (pozisyon dışı) |
| `c7-d8` Iso-raise | ders | 3 | 11 | dogruYanlis 2, sayi 5, secmeli 3, spot 1 | 1–5 | 5 | c11 | İzolasyon, Limp, IP (pozisyonda) |
| `c7-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, sayi 5, secmeli 3, spot 2 | 1–5 | 6 | c08, c12 | — |
| `c7-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 3, secmeli 1, spot 2 | 2–5 | 4 | c10, c09 | — |

**Toplam tip dağılımı:** sayı 41, seçmeli 29, doğru/yanlış 22, spot 11, eşleştirme 3, sıralama 1.

**Betik sonucu:** 107 alıştırmanın 50'si `denetle.mts` ile denetlendi, hata 0. Türler: toplam 17, blokerKombo 10, basabasFold 8, carpim 4, gerekenEquity 4, kombo 3, bolum 1, oranYuzde 1, equityAraliga 1, konusmaSirasi 1.

## Betik neyi doğruluyor

- **Bloker kombinasyonları (`blokerKombo`, 10; yeni):** elindeki kartları içeren iki kartlık eller desteden tek tek çıkarılarak rakibin kalan kombinasyonları sayılır (A♠ varken AA 3, AK 12; A♠ K♦ varken AK 9, AA + KK 6). Bozuk cevap testi: bloker etkisini unutan 6 ve 16 yakalanır.
- **Boyut ve pot (`carpim`, `toplam`):** 3x / 4x / 2,5x boyutlar ve 3-bet, 4-bet, squeeze, iso-raise sonrası potlar. Terimler senaryodan elle girilir; betik işlemi doğrular.
- **Başabaş fold oranı (`basabasFold`, 8):** risk / (risk + pot); risk, blind'de zaten konan miktar düşülerek eklenen miktardır. "Görülürse hiç kazanmama" varsayımı her soruda yazılı; c7-d1/a11 bunun kesin eşik olmadığını sorar.
- **3-bet'e karşı fiyat (`gerekenEquity`, 4):** ör. 5,5 / 17,5 ≈ %31,4; 5 / 16,5 ≈ %30,3; 7,5 / 21,5 ≈ %34,9.
- **Öğretim örneği oranı:** "AA, KK, QQ, AK" (34 kombinasyon) ve "A5s–A2s" (16) için 34 / 16 = 2,125. Bu bir sayım örneğidir; soru metninde "önerilen bir aralık değildir" diye yazılı.
- **Spotlar (11):** c05, c07, c08, c09, c10, c11, c12. Seçenek ve doğru cevap spotla birebir (test). Rakip eli hiçbir yerde yok.

## Betikle denetlenmeyenler

57 alıştırma ilke ve tanım sorusudur: value/fold equity ayrımı, lineer ve polarize aralık, blöf 3-bet adayının özellikleri, value/blöf dengesinin gerekçesi, 3-bet'e karşı offsuit ellerin sorunları, 100 BB'de 4-bet/5-bet aralıklarının darlığı, squeeze'de call edenin sınırlı aralığı, limp aralığının zayıflığı. Hepsi "genellikle / çoğunlukla / yaygın" diliyle. **Hiçbir 3-bet, 4-bet ya da squeeze aralığı yüzde ya da tam liste olarak verilmedi** (ranges.json'da yok); örnek eller yalnızca yön için (AA, KK value; A5s blöf adayı; AJo 3-bet'e karşı sorunlu).

## Boyut kuralları (yaygın başlangıç noktası olarak yazıldı)

- 3-bet: IP ~3x, OOP ~4x açılış (spotlarda SB'den 11 BB de var).
- 4-bet: 3-bet'in kabaca 2–2,5 katı, OOP genellikle biraz daha büyük (c09: 8 → 20).
- Squeeze: normal 3-bet + call eden başına bir açılış (c12: 4 × 2,5 + 2,5 = 12,5 ≈ 13).
- Iso-raise: "basit bir başlangıç kuralı" olarak ~3 BB + limp başına 1 BB (c11: 4 BB).

## Terim düzeni

Value, blöf ve fold equity c7-d1'de; cold call, lineer ve polarize aralık c7-d2'de; bloker c7-d3'te; 4-bet c7-d5'te; 5-bet ve all-in c7-d6'da tanımlanır. Sözlüğe "5-bet" eklendi (bkz. 02).

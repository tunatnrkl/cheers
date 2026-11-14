# Ünite t5 · Push/fold: öz denetim

Kaynak: `scripts/mufredat/icerik/t5.json`. 9 ders (7 normal + kontrol + tekrar), 97 alıştırma; hepsi `dogrulamaGerekli: false`. Varsayımlar: 6 kişilik masa, BB ante 1 BB (el başında pot 2,5 BB), ICM yok, herkes sana kadar fold etti.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Betikli | Sözlük terimleri |
|---|---|---|---|---|---|---|
| `t5-d1` Neden all-in ya da fold | ders | 4 | 11 | dogruYanlis 3, sayi 4, secmeli 3, spot 1 | 5 | Push/fold, Shove, All-in, Kısa stack, Min-raise, SPR |
| `t5-d2` Fold equity | ders | 4 | 11 | dogruYanlis 3, secmeli 4, sayi 4 | 4 | Fold equity, Equity, Başabaş noktası, Pot odds, Kısa stack |
| `t5-d3` 10 BB: pozisyona göre push | ders | 4 | 11 | dogruYanlis 2, siralama 1, secmeli 3, spot 3, range 1, eslestirme 1 | 8 | Push aralığı, Range, Range matrisi, Erken/Geç pozisyon, Connector |
| `t5-d4` 6 BB ve altı | ders | 4 | 11 | sayi 3, siralama 1, dogruYanlis 2, spot 3, secmeli 2 | 9 | Kısa stack, M oranı, Fold equity, Başabaş noktası |
| `t5-d5` 15 BB: push mu, açılış mı | ders | 4 | 11 | dogruYanlis 2, sayi 3, secmeli 2, spot 4 | 6 | Open, Resteal, Push/fold, Fold equity, 3-bet |
| `t5-d6` SB'den BB'ye karşı | ders | 4 | 11 | dogruYanlis 3, secmeli 2, sayi 2, eslestirme 1, spot 3 | 7 | SB, BB, OOP, Fold equity, Push aralığı |
| `t5-d7` Nash mantığı | ders | 4 | 11 | dogruYanlis 5, secmeli 5, eslestirme 1 | 0 | Nash dengesi, Call aralığı, Push aralığı, GTO, Exploit, Chip EV, ICM |
| `t5-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 3, sayi 1, siralama 1, secmeli 3, spot 3, range 1 | 7 | — |
| `t5-r` Tekrar | tekrar | 1 | 8 | sayi 1, dogruYanlis 2, secmeli 3, spot 2 | 4 | — |

**Toplam tip dağılımı:** seçmeli 27, doğru/yanlış 25, spot 19, sayı 18, sıralama 3, eşleştirme 3, range 2. **Betikle denetlenen:** 50 / 97.

## Betik neyi doğruluyor

- **Push aralığı okumaları (yeni `push`, `pushAraligi`, `pushKosul`, `pushEsleme`, `pushYuzde`, `pushSirasi`, `pushKapsar`):** `src/data/ranges.json` "push" (6, 10, 15 BB; UTG–SB) listelerini okur; hangi elin aralıkta olduğunu, aralık yüzdesini (kombinasyon / 1326), koltuklar ve stack'ler arası genişlik sırasını ve aralıkların birbirini kapsadığını yeniden hesaplar. Açılıştaki gibi aralığın son ~%4'ü (53 kombinasyon) ve hemen dışı "sınır" sayılır; sınırdaki el yalnızca `dogrulamaGerekli`/`kabulEdilebilir` ile sorulabilir. Bu derste sınırdaki el hiç sorulmadı. 8 BB gibi tablo dışı stack'te (t02, K6o SB) hem 6 hem 10 BB'de aynı karar çıkmalı. Betik aralıkların kendisini doğrulamaz; okur. Aralıklar sitenin kendi hesabıdır.
- **Spotlar (19):** `p6-…`, `p10-…`, `p15-…` spotları ve t01, t02, t04, t12; seçenek ve cevap spotla birebir (test); karar push aralığına göre okunur (211 p-spotunun hepsi betiğin okumasıyla tutarlı, 2'si sınırda; bunlar kullanılmadı).
- **Başabaş fold, gereken equity, oran, M, SPR, pot toplamı:** girdiler senaryodan elle girilir, işlem betikte.

## Betikle denetlenmeyenler

Nash ve fold equity kavram soruları, "push'ta oynanabilirlik neden önemsiz", "15 BB'de küçük açılış ne zaman" gibi ilke soruları (hepsi "çoğunlukla / genellikle" diliyle). 15 BB'de hangi ellerin push, hangilerinin küçük açılış olduğuna dair **sayısal liste verilmedi**; yalnızca yön.

## Tasarım

- Aralıkların "temkinli, yaklaşık çalışma aralıkları; Nash tablosu değil" olduğu t5-d3, d7 ve kontrol/tekrarda yazılı. Nash dersi (t5-d7) kavramsaldır: denge, sömürülemezlik, varsayımlar (ICM yok, rakip de dengede, ante yapısı, yalnızca all-in/fold) ve sınırlar; kesin Nash yüzdesi verilmedi. ICM'e t7'ye atıfla bırakıldı.
- Push aralığı, Call aralığı ve Nash dengesi sözlüğe eklendi.

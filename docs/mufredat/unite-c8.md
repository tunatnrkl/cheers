# Ünite c8 · Postflop matematiği: öz denetim

Kaynak: `scripts/mufredat/icerik/c8.json`. 9 ders (6 normal + kontrol + tekrar + `c8-t` Seviye 5 testi, kapsam "pist": cash pistinde o1–o4, c5–c8), 107 alıştırma; biri (c8-d6/a11, c24) `kabulEdilebilir` [Call] ve `dogrulamaGerekli: true`, geri kalanı `dogrulamaGerekli: false`.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | Spot | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `c8-d1` Equity nedir | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 1, secmeli 6, spot 1 | 1–5 | 7 | o-Qc4c-3cTh7h8c | Equity, Range (aralık), Monte Carlo, Dominasyon |
| `c8-d2` Outs saymak | ders | 3 | 11 | dogruYanlis 1, eslestirme 1, sayi 6, secmeli 3 | 1–5 | 7 | — | Outs, Draw (çekiş), Floş çekişi, Çift uçlu kent çekişi (OESD), Gutshot, Combo draw, Kirli out |
| `c8-d3` 2 ve 4 kuralı | ders | 3 | 11 | dogruYanlis 2, sayi 7, secmeli 2 | 1–5 | 7 | — | 2 ve 4 kuralı, Outs, All-in |
| `c8-d4` Pot odds | ders | 3 | 11 | dogruYanlis 2, sayi 4, secmeli 2, spot 3 | 1–5 | 7 | c18, o-7hAc-QsTc9c8d, o-AsKs-ThTsJs2c | Pot odds, Equity, Outs, Range (aralık) |
| `c8-d5` Implied ve reverse implied odds | ders | 4 | 12 | dogruYanlis 2, sayi 4, secmeli 3, spot 3 | 1–5 | 4 | c13, c38, c17 | Implied odds, Ters implied odds, Pot odds, Set, Dominasyon |
| `c8-d6` SPR | ders | 3 | 11 | dogruYanlis 1, eslestirme 1, sayi 6, secmeli 2, spot 1 | 1–5 | 6 | c24 | SPR, Efektif stack, Top pair, Overpair, 3-bet |
| `c8-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, sayi 8, secmeli 1, spot 1 | 1–5 | 10 | o-5cTh-KdJc4d8h | — |
| `c8-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 4, secmeli 1, spot 1 | 2–5 | 6 | o-6c3c-8c2d7d8h | — |
| `c8-t` Seviye 5 testi | test | 1 | 20 | dogruYanlis 2, sayi 11, secmeli 5, spot 2 | 1–5 | 17 | c07, o-2h3c-Ad9dAsJh | — |

**Toplam tip dağılımı:** sayı 51, seçmeli 25, doğru/yanlış 16, spot 12, eşleştirme 3.

**Betik sonucu:** 107 alıştırmanın 71'i `denetle.mts` ile denetlendi, hata 0. Türler: outs 11, tutma 10, gerekenEquity 9, spr 8, spotFiyat 6, equityEle 5, impliedBasabas 5, equityAraliga 3, toplam 3, blokerKombo 2, kazandiranKart 1, tutmaKart 1 ve test tekrarlarında birer (kazanan, konusmaSirasi, kombo, aralikYuzde, carpim, basabasFold, bolum).

## Betik neyi doğruluyor (yeni türler)

- **`outs` (11):** görülmeyen her kart (52 − el − board) el değerlendiriciyle tek tek eklenir; eli en az hedef el çeşidine (Floş ya da Kent; "Kent" hedefi floşu da kapsar) çıkaran kartlar sayılır. Çifte sayım böylece kendiliğinden ayıklanır (9 + 8 − 2 = 15; K♠ J♠ / Q♠ 9♠ 4♦ 2♥ → 12). Eli zaten hedefte olan soru reddedilir. **Sınır:** "out" burada "floş ya da kent yapan kart" demektir; kartın kazandırıp kazandırmadığını denetlemez (bunu yalnızca aşağıdaki öğretim örneği yapar).
- **`kazandiranKart` (1, öğretim örneği):** rakibin eli soru metninde açıkça "öğretim örneği" diye verilir; river kartları tek tek denenir ve kahramanı öne geçirenler sayılır (kirli out: 8 kent kartından J♥ ve 6♥ rakibe floş verir → 6). Spot alıştırmasında kullanılmaz.
- **`tutma` (10):** görülmeyen kart flop'ta 47, turn'de 46. Gerçek: iki kart 1 − C(47 − outs, 2) / C(47, 2), tek kart outs / görülmeyen. Kural: outs × 4 ya da × 2. Fark: kural − gerçek (15 out'ta ≈ 5,9 puan). Pay 0,06.
- **`tutmaKart` (1):** 1081 turn–river ikilisi tek tek sayılarak aynı oranın (A♥ 5♥ / K♥ 9♥ 3♣ → %35,0) formülle aynı çıktığı gösterilir.
- **`equityEle` (5, öğretim örneği):** iki somut el. Board 3 kartsa 990 turn–river ikilisi tek tek sayılır (A♥ 5♥ – K♠ Q♦ / K♥ 9♥ 3♣ → %45,86); preflop'ta sabit tohumlu Monte Carlo (40.000 deneme), metindeki değer en fazla 1,5 puan sapabilir ve yalnızca seçmeli sorularda kullanılır (AA–KK, QQ–AKo, AKo–AJo, 88–AKo). Metinde bu değerler ondalıksız yazılır (≈ %81, ≈ %57, ≈ %74, ≈ %56); Onay Ajanı'nın tam sayımı (%81,26; %57,2; %73,69; %55,57) ile 1 puan içinde.
- **`impliedBasabas` (5):** X = call × (1 / eq − 1) − pot; türetme denetle.mts'te yazılı (eq × (pot + X) = (1 − eq) × call; tutunca hep kazanma, tutmayınca eli bırakma varsayımı). Örnekler: 3,7 × (47/9 − 1) − 9,2 ≈ 6,4; set için eq = 2304/19600 ≈ %11,76 ile 14,8 ve 18,0 BB. **Bu bir eşiktir; rakibin ne ödeyeceğine dair sayı verilmedi.**
- **`spotFiyat` (6):** o-… spotlarında gereken equity drills.json'daki pot ve "Call (… BB)" seçeneğinden yeniden hesaplanır ve gerekçedeki sayıyla (±0,06 puan; gerekçedeki değer bir ondalıkla yazılır) karşılaştırılır. Spotun aralığa karşı equity'si (ör. %27, %51) betikte yeniden hesaplanmadı; Kapı B'de doğrulanan spot gerekçesinden alındı ve öyle yazıldı.
- `gerekenEquity`, `spr`, `equityAraliga` (QQ'nun AA/KK/AK aralığına karşı ≈ %39,7) önceki ünitelerdeki gibi.

## Betikle denetlenmeyenler

36 alıştırma tanım ve ilke sorusudur: ele karşı / aralığa karşı equity ayrımı, kirli outs'un masada kesin bilinemeyişi, 4 kuralının yalnızca iki kart garantiyken geçerli olması, implied odds'u artıran ve azaltan durumlar, ters implied odds, düşük ve yüksek SPR'de el gücü. SPR eşikleri (kabaca 3 ve altı, ör. 10 ve üstü) yön bildirir.

## Kapı B ile tutarlılık

Spot alıştırmalarında rakip eli yok; o-… spotlarında soru "kartlarını görmüyorsun; aralık spotun notunda varsayım olarak yazılı" der. Somut rakip eli yalnızca c8-d1, c8-d2 ve c8-k'daki "öğretim örneği" sorularında (seçmeli, sayı, eşleştirme) ve anlatımda geçer; her birinde "öğretim örneği" yazılıdır.

## Spot verisinde fark edilen tutarsızlık (müfredatta kullanılmadı)

`c19` gerekçesi river'da tutma oranını "8 / 44" ile veriyordu; doğrusu 8 / 46 ≈ %17,4. **Düzeltildi (31593ed).** Karar (call, gereken %16,7) değişmedi. Spot c8'de kullanılmadı.

## Onay Ajanı düzeltmeleri (2026-11-13)

- Preflop el ele equity'ler ondalıksız yazıldı (≈ %81, %57, %74, %56); c8-d1/a3'ün doğru seçeneği %82 → %81.
- c8-d1 anlatımında "top pair" ilk geçtiği yerde tanımlandı.
- c8-d3/a11 gerekçesi: "turn ve river'ın ikisinin de out olduğu durumlar kuralda iki kez sayılır".
- `spotFiyat` payı 0,6 → 0,06; gevşek ya da yuvarlanmış değeri yakalayan test eklendi.
- Sözlükte "2 ve 4 kuralı" tanımına koşul eklendi (iki kartı da ödeme yapmadan göreceksen × 4).
- c8-t/a13–a14: HJ/CO ve BTN'nin fold ettiği yazıldı.

## Tutarlılık düzeltmesi (2026-11-13, c9–c10 kapısı)

- c8-d6/a11 (c24, düşük SPR'de AA): docs/ekip/2026-11-11/01-spot-denetimi.md, B-1 gereği call `kabulEdilebilir`, alıştırma `dogrulamaGerekli: true`; nedene "call da savunulabilir (kalan stack turn'de çoğunlukla ortaya girer)" eklendi. c10-d6'daki aynı spotla tutarlı.

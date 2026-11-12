# Ünite o3 · Pozisyon: öz denetim

Kaynak: `scripts/mufredat/icerik/o3.json` → `python3 scripts/mufredat/iskelet.py` → `src/data/mufredat.json`.
7 ders (5 normal + kontrol + tekrar), 75 alıştırma; hepsi `dogrulamaGerekli: false`. Spot tipi kullanılmadı.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|
| `o3-d1` Koltuk adları | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 1, secmeli 4, siralama 3 | 1–5 | 9 | 6-max, UTG (Under the Gun), HJ (Hijack), CO (Cutoff), BTN (Buton), Full ring |
| `o3-d2` Pozisyonda ve pozisyonsuz | ders | 3 | 11 | dogruYanlis 3, eslestirme 1, sayi 1, secmeli 5, siralama 1 | 1–5 | 7 | IP (pozisyonda), OOP (pozisyon dışı), Pozisyon, Postflop |
| `o3-d3` Son konuşmanın değeri | ders | 4 | 11 | dogruYanlis 4, eslestirme 1, secmeli 6 | 1–5 | 1 | IP (pozisyonda), OOP (pozisyon dışı), Bedava kart, Pot kontrolü |
| `o3-d4` Erken, geç pozisyon ve blind'ler | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 2, secmeli 5, siralama 1 | 1–5 | 4 | Erken pozisyon, Geç pozisyon, Pozisyon, Blind |
| `o3-d5` BB cinsinden düşünmek | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 7, secmeli 1 | 1–5 | 9 | Stack, Efektif stack, BB (Big Blind) |
| `o3-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, sayi 4, secmeli 5, siralama 1 | 1–5 | 7 | — |
| `o3-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 2, secmeli 4 | 2–5 | 5 | — |

**Toplam tip dağılımı:** seçmeli 30, doğru/yanlış 17, sayı 17, sıralama 6, eşleştirme 5.

**Betik sonucu:** 75 alıştırmanın 42'si `denetle.mts` ile denetlendi, hata 0.
- Konuşma sırası, koltuk ve "bir sonraki elde hangi koltuk" (27 soru): betikteki 6-max koltuk modeline göre hesaplanır (butondan sola BTN, SB, BB, UTG, HJ, CO; preflop UTG'den, postflop SB'den başlar). Model elle yazılmış kuraldır; betik cevapların bu modelle tutarlı olduğunu doğrular, modelin kendisini değil.
- Efektif stack ve BB'ye çevirme (14 soru): stack'ler ve büyük blind elle girilir; betik küçük olanı seçip bölmeyi yeniden yapar ve "12.000 chip" gibi binlik yazımları okur.
- Pot toplamı (1 soru, sarmal).
- Denetimsiz 33 soru kavram sorusudur (bilgi avantajı, bedava kart, pot kontrolü, erken pozisyonda seçicilik); `03-kaynak-guven-raporu.md` ile elle karşılaştırıldı.

## Tasarım

- Terimler ilk geçtikleri derste tanımlanır: koltuk adları d1, IP/OOP d2, bedava kart ve pot kontrolü d3, erken/geç pozisyon d4, stack ve efektif stack d5. "Açılış" o4-d4'te öğretildiği için o3'te "raise yaptı" denir.
- Sarmal: o2'den konuşma sırası, blind ve pot hesabı; o3-d3/a8 ve o3-d4/a11 doğrudan o2 hesabı içerir. o3-r/a3 beraberlikte potun bölünmesini (o2-d4) yoklar.
- Tipik yanılgılar çeldirici ve tekrar sorusu olarak: preflop sırasını postflop'a taşımak, "erken pozisyon" adından UTG'nin her zaman pozisyon dışı olduğunu sanmak, buton kayınca koltuk adının yanlış yöne ilerlediğini sanmak, raise yapanın pozisyonu kazandığını sanmak, efektif stack'i büyük stack ya da toplam sanmak, binlik ayırıcıyı ondalık okumak.
- Strateji iddiaları yön olarak verilir ("genellikle daha kolay", "daha az ve daha güçlü elle"); hangi ellerin oynanacağı söylenmez (c5, t3).

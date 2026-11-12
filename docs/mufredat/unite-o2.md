# Ünite o2 · Masa ve el akışı: öz denetim

Kaynak: `scripts/mufredat/icerik/o2.json`. 8 ders (5 normal + kontrol + tekrar + `o2-t` Temel testi), 95 alıştırma; hepsi `dogrulamaGerekli: false`.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Betikle denetlenen | Sözlük terimleri |
|---|---|---|---|---|---|---|---|
| `o2-d1` Buton ve blind'ler | ders | 4 | 11 | dogruYanlis 2, sayi 4, secmeli 4, siralama 1 | 1–5 | 5 | BTN (Buton), Blind, SB (Small Blind), BB (Big Blind) |
| `o2-d2` Aksiyonlar | ders | 4 | 11 | dogruYanlis 3, eslestirme 2, secmeli 6 | 1–5 | 1 | Fold, Check, Call, Bet, Raise, Check-raise |
| `o2-d3` Sokaklar: preflop'tan river'a | ders | 3 | 11 | dogruYanlis 1, eslestirme 1, sayi 2, secmeli 5, siralama 2 | 1–5 | 2 | Preflop, Flop, Turn, River, Postflop, Board |
| `o2-d4` Showdown ve kazanan | ders | 4 | 11 | dogruYanlis 2, sayi 2, secmeli 7 | 1–5 | 8 | Showdown, Pot, Kicker, Board |
| `o2-d5` Pot nasıl büyür | ders | 4 | 11 | dogruYanlis 2, sayi 7, secmeli 2 | 1–5 | 9 | Pot, Blind, Call, Bet, Raise, BB (Big Blind) |
| `o2-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, eslestirme 1, sayi 4, secmeli 5 | 1–5 | 6 | — |
| `o2-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 3, secmeli 3 | 2–5 | 5 | — |
| `o2-t` Temel testi: kartlar ve masa | test | 1 | 20 | dogruYanlis 3, eslestirme 1, sayi 5, secmeli 9, siralama 2 | 1–5 | 13 | — |

**Toplam tip dağılımı:** seçmeli 41, sayı 27, doğru/yanlış 17, sıralama 5, eşleştirme 5.

**Betik sonucu:** 95 alıştırmanın 49'u yeniden hesaplandı, hata 0. Türler: pot ve blind aritmetiği 27 (toplam 22, bölme 5), kazanan 14, el çeşidi 4, diğer 4. Denetimsiz 46 soru konuşma sırası, aksiyon ve terim sorusudur; `03-kaynak-guven-raporu.md` içindeki kural listesiyle elden karşılaştırıldı.

## Kurallar ve tasarım

- **Sarmal:** her normal derste o1'den kısa bir tekrar sorusu var (d1/a8 full house, d2/a4 iki per, d3/a7 flop'ta floş, d4 tamamen o1 el karşılaştırması üzerine, d5/a7 kicker). Kontrol ve test de o1 sorusu içerir; `o2-t` 20 sorunun 8'i doğrudan o1 konusu (deste, el sıralaması, en iyi beşli, nuts), 3'ü iki üniteyi birleştiren showdown sorusu.
- **Pot hesapları** adım adım yazılır ve "neden" metninde toplama gösterilir (ör. 0,5 + 2,5 + 2,5 + 2,5 = 8 BB). Raise'ler "X BB'ye raise" biçiminde, yani oyuncunun o turdaki toplamı olarak verilir; en sık hata (küçük blind'i ya da büyük blind'in 1 BB'sini iki kez saymak, fold edenin chip'ini pottan düşmek, önceki sokağı yeni bahisten düşmek) çeldirici ve tekrar sorusu olarak kullanıldı.
- **Ondalık:** virgül ("2,5 BB"); JSON'da sayı olarak 2.5.
- **Basitleştirmeler** (ante yok, heads-up istisnası yok, all-in/yan pot yok, SB = BB/2 "genellikle"): `03-kaynak-guven-raporu.md`.
- `o2-t` doğrulayıcının test türü için "en az 8" kuralını geçer; brif sapması olarak kayıtlı 20 soru hedefi karşılanır.

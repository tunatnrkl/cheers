# Ünite c6 · Blind savunması: öz denetim

Kaynak: `scripts/mufredat/icerik/c6.json`. 8 ders (5 normal + kontrol + tekrar + `c6-t` Seviye 4 testi, kapsam "pist": cash pistinde o1–o4, c5, c6), 90 alıştırma. Cash varsayımları: 6-max, 100 BB, 2,5 BB açılış (SB'den 3 BB), rake yok.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | dogrulamaGerekli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `c6-d1` Fiyat: gereken equity | ders | 4 | 10 | dogruYanlis 2, sayi 5, secmeli 3 | 1–5 | 7 | 0 | Equity, Pot odds |
| `c6-d2` BB savunması ve açanın pozisyonu | ders | 3 | 10 | dogruYanlis 2, sayi 1, secmeli 7 | 1–5 | 4 | 0 | Range (aralık), Equity, Dominasyon, Solver, Monte Carlo |
| `c6-d3` Equity realization | ders | 4 | 10 | dogruYanlis 3, eslestirme 1, sayi 1, secmeli 5 | 1–5 | 2 | 0 | Equity, OOP (pozisyon dışı), Suited, Connector |
| `c6-d4` SB stratejisi | ders | 3 | 10 | dogruYanlis 3, eslestirme 1, sayi 2, secmeli 4 | 1–5 | 4 | 0 | 3-bet, SB (Small Blind), OOP (pozisyon dışı) |
| `c6-d5` Çok oyunculu potta BB | ders | 3 | 10 | dogruYanlis 2, eslestirme 1, sayi 2, secmeli 4, spot 1 | 1–5 | 4 | 0 | Multiway, Blind savunması, Dominasyon |
| `c6-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, sayi 3, secmeli 5, spot 2 | 1–5 | 8 | 0 | — |
| `c6-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 2, secmeli 3, spot 1 | 2–5 | 3 | 0 | — |
| `c6-t` Seviye 4 testi | test | 1 | 20 | dogruYanlis 3, range 1, sayi 6, secmeli 8, spot 2 | 1–5 | 17 | 0 | — |

**Toplam tip dağılımı:** seçmeli 39, sayı 22, doğru/yanlış 19, spot 6, eşleştirme 3, range 1.

## Betik neyi doğruluyor

- **Gereken equity (16 soru):** `gerekenEquity` = ödenecek / (call öncesi pot + ödenecek). Pot ve ödenecek miktar senaryodan elle girilir; betik oranı yeniden hesaplar. Senaryonun bu iki sayıya doğru çevrildiği elle kontrol edildi. Rehberdeki (docs/ekip/2026-11-11/06) bütün fiyatlar betikle aynı çıktı: %27,3 (1,5/5,5), %22,2 (1/4,5), %18,8 (1,5/8), %30,8 (2/6,5).
- **Aralığa karşı equity (7 soru):** `equityAraliga`, projenin el değerlendiricisiyle sabit tohumlu Monte Carlo (40.000 deneme) çalıştırır. Rakip aralığı ranges.json'daki açılış aralığıdır. Metindeki "yaklaşık" değer en fazla 1,5 puan sapabilir; seçmeli sorularda yalnızca bir seçenek bu aralığa düşmelidir. Sonuçlar: J4o UTG'ye karşı 29,0, BTN'ye karşı 34,8; 72o BTN'ye karşı 29,9; T8s 40,8; K4o 41,0; 65s CO'ya karşı 37,5. Rehberdeki ve quizdeki (02) değerlerle 0,6 puan içinde uyuşuyor.
- **Gerekli pay (3 soru):** gereken equity / ham equity (72o ≈ %91, T8s ≈ %67, J4o BTN'ye karşı ≈ %78). Bu bir aritmetik orandır, elin gerçekte ne kadar gerçekleştirdiğine dair bir iddia değildir. **Equity realization için hiçbir sayı verilmedi.**
- Pot toplamları (9), konuşma sırası (4), açılış aralığı soruları (4) ve o1–o4 tekrarları (kazanan, kombinasyon, matris, efektif stack) c5 ve önceki ünitelerdeki gibi denetlenir.
- **Spotlar (6):** c05, c34, c35, c36 (savunma) ve r-CO-A5s, r-BTN-A2o (açılış). Test, seçenek ve doğru cevabın bağlanan spotla aynı olduğunu doğrular. c05, c34 ve c35 seçeneklerinde "3-bet" geçtiği için bu spotlar yalnızca 3-bet'in tanımlandığı c6-d4'ten sonra (kontrol, tekrar, test) kullanıldı; c36 ise c6-d5'te. Rakip eli hiçbir yerde yok.

## Betikle denetlenmeyenler

41 alıştırma kavram ve ilke sorusudur: equity ve realization tanımları; açanın pozisyonuna göre savunmanın daralması; SB'de "çoğunlukla 3-bet ya da fold"; multiway potta el tipinin önemi. Hepsi "genellikle / çoğunlukla" diliyle yazıldı. Hangi ellerin savunulacağına dair kesin bir liste verilmedi. Spot cevapları sitedeki spotların kendi gerekçelerine dayanır.

## Terim düzeni

Equity c6-d1'de, 3-bet c6-d4'te tanımlanır ve bu derslerden önce geçmez. Equity realization c6-d3'te metinde tanımlanır, sözlükte terimi yok (bkz. 02).

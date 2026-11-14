# Ünite t6 · All-in'e call: öz denetim

Kaynak: `scripts/mufredat/icerik/t6.json`. 9 ders (6 normal + kontrol + tekrar + `t6-t` Turnuva seviye 5-6 testi, kapsam "pist"), 106 alıştırma; hepsi `dogrulamaGerekli: false`. Varsayımlar: BB ante 1 BB (her soruda yazılı), ICM yok.

| Ders | Tür | Alıştırma | Tipler | Betikli | Sözlük terimleri |
|---|---|---|---|---|---|
| `t6-d1` Fiyat: gereken equity | ders | 11 | dogruYanlis 3, sayi 5, secmeli 1, spot 2 | 7 | Equity, Pot odds, BB ante, All-in, Başabaş noktası |
| `t6-d2` Rakibin itme aralığı | ders | 11 | dogruYanlis 3, siralama 1, sayi 1, secmeli 3, eslestirme 1, spot 2 | 6 | Push aralığı, Call aralığı, Range, Kısa stack |
| `t6-d3` Aralığa karşı equity | ders | 11 | dogruYanlis 3, secmeli 7, siralama 1 | 7 | Equity, Monte Carlo, Dominasyon, Range, Push aralığı |
| `t6-d4` BB'den call | ders | 11 | dogruYanlis 2, sayi 1, secmeli 2, spot 6 | 7 | Pot odds, Equity, BB, Chip EV |
| `t6-d5` Arkanda oyuncu varken | ders | 11 | dogruYanlis 3, sayi 2, secmeli 4, eslestirme 1, spot 1 | 3 | Multiway, Dominasyon, Call aralığı, BB |
| `t6-d6` Açılışına all-in gelirse | ders | 11 | dogruYanlis 3, secmeli 4, sayi 3, spot 1 | 5 | Resteal, Pot odds, Equity, Call aralığı |
| `t6-k` Kontrol | kontrol | 12 | dogruYanlis 3, sayi 4, siralama 1, secmeli 2, spot 2 | 8 | — |
| `t6-r` Tekrar | tekrar | 8 | sayi 1, dogruYanlis 2, secmeli 3, spot 2 | 5 | — |
| `t6-t` Seviye 5-6 testi | test | 20 | secmeli 5, sayi 9, siralama 1, spot 2, dogruYanlis 3 | 15 | — |

**Toplam tip dağılımı:** seçmeli 31, sayı 26, doğru/yanlış 25, spot 18, sıralama 4, eşleştirme 2. **Betikle denetlenen:** 63 / 106.

## Betik neyi doğruluyor

- **Gereken equity (`gerekenEquity`):** call / (pot + call); pot ve call elle girilir, ante türü (BB ante) soru metninde yazılı. Örnekler: %38,5 (6 BB), %42,9 (10 BB), %45,2 (15 BB), BTN %41,9 (SB'nin 0,5 BB'si ölü para), BTN'den call %44,4, açılışına all-in %39,3 ve %41,6.
- **Aralığa karşı equity (`equityAraliga` itme aralığıyla):** push aralığına karşı sabit tohumlu Monte Carlo (40.000 deneme); metindeki değer en fazla 1,5 puan sapabilir ve yalnızca seçmeli sorularda kullanıldı (seçenekler birbirinden en az ~9 puan uzak). `equitySirasi` ve `equityEnIyi`: komşu eller en az 3 puan aralıklı olmalı.
- **`callShove`:** drills.json'daki s-… spotlarına bağlar. Spot kimliğinden stack ve itme koltuğunu okur; aralık = ranges.json push aralığı; gereken equity = call / (spot potu + call); kahramanın somut kartlarıyla equity (Monte Carlo); eşiğe 3,5 puandan yakınsa ya da cevap spotla çelişirse hata verir; seçenek ve cevap spotla birebir aynı olmalı. **Gerekçesi "rakibin aralığı belirliyor" diyen (aralığa duyarlı) 19 spot kullanılmadı** (duyarli işareti olmadan betik reddeder). Kullanılan spotlar: s6-SB-33, s6-SB-T9o, s10-SB-QJo, s10-SB-82o (yalnız kontrol), s10-SB-54s, s10-SB-A3s, s10-BTN-J7o, s10-BTN-A7o, s10-CO-98o, s10-CO-KQs, s15-SB-55, s15-SB-K3o ve t13 (88 resteal, notun aralığı betikle %55). Rakip eli hiçbir yerde yok.
- **Resteal aralığı yüzdesi (t6-d6/a8):** notta yazan aralık 226 kombinasyon, %17,0. Spot t13'ün notu "yaklaşık %16" diyor; bu hafif tutarsızlık 02 raporunda.

## Betikle denetlenmeyenler

Dominasyon ve multiway kavram soruları, "arkanda oyuncu varken call aralığı çoğunlukla daha dar" yönü (çok oyunculu equity sayısı verilmedi; betikte çok oyunculu hesap yok), batık maliyet soruları. t6-d3'teki bazı karşılaştırmalar (22'nin SB ve UTG aralığına karşı düşüşü, A5o'nun 15 puan düşmesi) yalnızca tek tek MC değerleriyle ders yazılırken ölçüldü; denetimli olanlar tek tek equity değerleridir.

## Tasarım

- Aralıkların temkinli ve yaklaşık olduğu t6-d2, d3 ve test girişinde yazılı. Rakip push aralığı hep "varsayım".
- Yakın kararlar (eşiğe < 3,5 puan) spot olarak kullanılmadı; t6-d4/a11 bunu bir ilke olarak anlatır.

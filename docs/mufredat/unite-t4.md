# Ünite t4 · Orta stack oyunu: öz denetim

Kaynak: `scripts/mufredat/icerik/t4.json`. 8 ders (5 normal + kontrol + tekrar + `t4-t` Turnuva seviye 3-4 testi, kapsam "pist": turnuva pistinde o1, o2, t1, o3, t2, o4, t3, t4), 95 alıştırma; hepsi `dogrulamaGerekli: false`.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | dogrulamaGerekli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `t4-d1` Stack kısaldıkça ne değişir | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, sayi 3, secmeli 4 | 1–5 | 4 | 0 | Implied odds, Set, Connector, Broadway, Equity |
| `t4-d2` 3-bet ya da fold | ders | 4 | 11 | dogruYanlis 3, sayi 5, secmeli 3 | 1–5 | 5 | 0 | 3-bet, 4-bet, OOP (pozisyon dışı) |
| `t4-d3` Resteal: 3-bet all-in | ders | 4 | 11 | dogruYanlis 3, sayi 3, secmeli 4, spot 1 | 1–5 | 3 | 0 | Resteal, Steal (blind çalma), All-in, Başabaş noktası, Equity |
| `t4-d4` Açılışa call mı, all-in mi | ders | 4 | 11 | dogruYanlis 3, sayi 4, secmeli 3, spot 1 | 1–5 | 5 | 0 | All-in, IP (pozisyonda), OOP (pozisyon dışı), Efektif stack |
| `t4-d5` Düşük SPR'de postflop | ders | 4 | 11 | dogruYanlis 3, sayi 5, secmeli 2, spot 1 | 1–5 | 5 | 0 | SPR, Top pair, Efektif stack, Pot odds |
| `t4-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 3, sayi 5, secmeli 3, spot 1 | 1–5 | 7 | 0 | — |
| `t4-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 3, sayi 3, secmeli 2 | 2–5 | 3 | 0 | — |
| `t4-t` Turnuva seviye 3-4 testi | test | 1 | 20 | dogruYanlis 3, range 1, sayi 9, secmeli 6, spot 1 | 1–5 | 15 | 0 | — |

**Toplam tip dağılımı:** sayı 37, seçmeli 27, doğru/yanlış 24, spot 5, eşleştirme 1, range 1.

**Betik sonucu:** 95 alıştırmanın 47'si `denetle.mts` ile denetlendi, hata 0. Türler: spr 8, antePot 7, basabasFold 6, bolum 3, equityAraliga 3, gerekenEquity 3, oranYuzde 3, toplam 3, bolge 2; testte o1–t3 tekrarları (yazim, kombo, kazanan, sonrakiEl, acilisAraligi, mOrani, efektif, ortalamaStack, flopTutma) birer.

## Betik neyi doğruluyor

- **SPR (`spr`, 8):** kalan efektif stack (küçük olan) / flop'taki pot. Kalan stack'ler ve pot elle girilir (preflop'ta konanlar elle düşüldü); betik küçük olanı seçip böler.
- **Resteal başabaş fold oranı (`basabasFold`, 6):** risk = all-in için eklenen miktar (blind'de koyulan düşülür), pot = all-in öncesi pot. "Call edildiğinde hiç kazanmama" varsayımı her soruda yazılı; t4-d3/a10 bunun kesin eşik olmadığını sorar.
- **3-bet/fold bedeli (`oranYuzde`, 3)**, implied odds oranı (`bolum`, 3; yuvarlanmış cevaplar tolerans 0,1 ile).
- **Aralığa karşı equity (3):** t25'te K4o BTN'ye karşı 41; t4-k'daki t13 spotunda 88, spotun notunda yazan varsayılan resteal aralığına (22+, A2s+, A8o+, KTs+, KQo, QJs) karşı 54,9 (spotun gerekçesindeki "%55 civarı" ile aynı).
- **Spotlar (5):** t11 (resteal, iki kez), t25 (call mı all-in mi), t26 (düşük SPR), t13 (açılışa all-in gelince). Seçenek ve cevaplar spotla birebir. t26'nın soru metnine kartlar yazılmadı (spot ekranı gösterir); t26'daki equity iddiası betikle hesaplanmadı (board'lu aralık equity'si betikte yok), spotun kendi gerekçesine dayanır ve öyle yazıldı.

## Betikle denetlenmeyenler

48 alıştırma ilke sorusudur: spekülatif ellerin orta stack'te değer kaybı, call'un zorlaşması, 3-bet/fold, SB'de çoğunlukla all-in ya da fold, düşük SPR'de top pair. **Resteal ve 3-bet/fold için hiçbir aralık verilmedi**; yalnızca uç karşılaştırmalar (A9s / 72o, AJo / 54s / 22) ve "genellikle / çoğunlukla" ile ilkeler.

## Tasarım

- "Fold equity" terimi t5-d2'de öğretileceği için kullanılmadı; "rakibin fold etmesiyle kazanma" denildi. "İnisiyatif" sözlük tanımı c-bet'e atıf yaptığı için `terimler`e bağlanmadı ("son bahsi yapan sen olursun" denildi).
- BB'nin istisna olduğu (iyi fiyatla orta stack'te de sık call) t4-d2'de açıkça yazıldı; t3-d5 ile çelişmesin diye.
- SPR eşikleri ("kabaca 3 ve altı", "ör. 10 ve üstü") yön bildirir; sözlükteki SPR tanımıyla uyumlu.

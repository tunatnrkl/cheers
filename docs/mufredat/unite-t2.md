# Ünite t2 · Stack'i ölçmek: öz denetim

Kaynak: `scripts/mufredat/icerik/t2.json`. 8 ders (5 normal + kontrol + tekrar + `t2-t` Turnuva seviye 1-2 testi, kapsam "pist": turnuva pistinde o1, o2, t1, o3, t2), 95 alıştırma; hepsi `dogrulamaGerekli: false`. Spot tipi kullanılmadı.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | dogrulamaGerekli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `t2-d1` Stack kaç BB | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 4, secmeli 4 | 1–5 | 10 | 0 | Stack, BB (Big Blind), Derin stack, Kısa stack, All-in |
| `t2-d2` M oranı | ders | 4 | 11 | dogruYanlis 3, sayi 5, secmeli 3 | 1–5 | 7 | 0 | M oranı, Stack, Ante, BB ante |
| `t2-d3` Efektif stack turnuvada | ders | 4 | 11 | dogruYanlis 3, sayi 5, secmeli 3 | 1–5 | 6 | 0 | Efektif stack, Kapsamak (cover), All-in, Stack |
| `t2-d4` Ortalama stack ve aşamalar | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, sayi 3, secmeli 4 | 1–5 | 7 | 0 | Ortalama stack, Geç kayıt, Bubble, Ödül sıçraması, Final masası |
| `t2-d5` Chip'in değeri sabit değil | ders | 4 | 11 | dogruYanlis 4, sayi 2, secmeli 5 | 1–5 | 3 | 0 | Cash game, Bubble, Final masası |
| `t2-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, sayi 7, secmeli 3 | 1–5 | 8 | 0 | — |
| `t2-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 3, sayi 2, secmeli 3 | 2–5 | 5 | 0 | — |
| `t2-t` Turnuva seviye 1-2 testi | test | 1 | 20 | dogruYanlis 4, sayi 8, secmeli 8 | 1–5 | 16 | 0 | — |

**Toplam tip dağılımı:** sayı 36, seçmeli 33, doğru/yanlış 24, eşleştirme 2.

**Betik sonucu:** 95 alıştırmanın 62'si `denetle.mts` ile denetlendi, hata 0. Türler: mOrani 13, efektif 8, bolum 7, ortalamaStack 7, bolge 6, toplam 5, antePot 3, bbErime 3, odul 3, konusmaSirasi 2, bolumEsleme 1, carpim 1, kategori 1, kazanan 1, koltuk 1.

## Betik neyi doğruluyor

- **M oranı (`mOrani`, 13):** M = stack / (küçük blind + büyük blind + bir eldeki toplam ante); ante kuralı (BB ante tek, klasik ante oyuncu × ante) betikte. Stack ve blind'ler elle girilir; betik işlemi doğrular, senaryonun sayılara çevrilmesi elle kontrol edildi. Yuvarlama payı 0,05; sayı sorusunda tolerans en fazla 0,1.
- **Stack bölgesi (`bolge`, 6):** stack / büyük blind hesaplanır ve müfredatın sınırlarıyla (derin ≥ 40, orta 20–40, kısa < 20 BB) okunur. Sınırların kendisi bir varsayımdır (kaynağa göre değişir); betik yalnızca bu varsayıma uyumu doğrular. `t2-d1/a9` tam 20 BB'yi bilerek sorar (orta).
- **Efektif stack ve çok oyunculu risk (`efektif`, 8):** küçük olan alınır, BB'ye bölünür. Çok oyunculu all-in sorularında "senin stack'in ile en büyük rakip stack'i" elle seçilip girilir (betik iki sayıdan küçüğünü alır); kuralın kendisi elle kontrol edildi.
- **Ortalama stack (`ortalamaStack`, 7):** başlangıç × giriş / kalan; isteğe bağlı BB'ye çevirme ya da stack'in ortalamaya oranı (%).
- **Ödül (`odul`, 3):** t1'deki gibi; tablo toplamı ve sırası da denetlenir.
- Test sorularındaki o1–o3 tekrarları mevcut türlerle denetlenir: el çeşidi ve kazanan (el değerlendirici), koltuk ve konuşma sırası (6-max modeli).
- Elle girilen değerler: `t2-d4/a2` ve `a3`'te seçeneklerin değerleri `degerler` ile verildi (eski `bolum`/`carpim` okuyucusu "20.000"i 20 okuduğu için). `t2-d1/a8`'de iddia "iki stack aynı BB" → fark 0 mı diye denetlenir.

## Betikle denetlenmeyenler

33 alıştırma kavram sorusudur: M'nin tanımı ve BB ile ilişkisi, kapsamak, aşamalar, chip değerinin sezgisi. t2-d5'te hiçbir ICM hesabı, formül ya da kesin yüzde yoktur; yalnızca ödül tablosunun kendisi (%50/%30/%20 gibi örnek paylar) ve chip ortalaması (0 BB) hesaplanır.

## Tasarım

- M oranı "Dan Harrington'ın turnuva kitaplarıyla yaygınlaşan bir ölçü" olarak tanıtılır; "bugün birçok oyuncu ve kaynak stack'i doğrudan BB ile ölçer" denir, kesinlik iddiası yok. BB ante 1 BB'de M = BB / 2,5, ante'siz M = BB / 1,5 dönüşümü öğretilir.
- Masa turu ("orbit") "bahis turu"yla karışmasın diye "masa turu" diye adlandırıldı.
- Çok oyunculu all-in'de kaybedilebilecek en fazla miktar, rakip stack'lerinin toplamı değil, en büyük rakip stack'idir (karşılanmayan kısım geri döner). Bu, yaygın bir yanılgı olarak çeldiricilerde kullanıldı.
- t2-d5 sezgiseldir: "kaybedilen chip çoğu zaman daha değerlidir", "etki başta genellikle küçük, bubble ve final masasında büyük, iki kişi kalınca ortadan kalkar". Hesap t7'ye bırakıldı.
- Test kapsamı: o1 (1), o2 (2), o3 (3; efektif stack dahil), t1 (6), t2 (8). o4 bu pistte t2'den sonra geldiği için sorulmadı.

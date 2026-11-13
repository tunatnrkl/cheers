# Ünite c9 · Flop: board ve c-bet: öz denetim

Kaynak: `scripts/mufredat/icerik/c9.json`. 8 ders (6 normal + kontrol + tekrar), 86 alıştırma. Bir spot alıştırması (c9-d5/a9, c26) `kabulEdilebilir` ve `dogrulamaGerekli: true` taşır; geri kalanlar `dogrulamaGerekli: false`. Cash varsayımları: 6-max, 100 BB, 2,5 BB açılış, rake yok.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | Spot | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `c9-d1` Board dokusu | ders | 4 | 11 | dogruYanlis 3, eslestirme 1, sayi 1, secmeli 6 | 1–5 | 10 | — | Board dokusu, Board, Kuru board, Islak board, Çiftli board, Monoton board, Gökkuşağı board, Floş çekişi, Çift uçlu kent çekişi (OESD), Backdoor, Outs |
| `c9-d2` Range avantajı ve nut avantajı | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 3, secmeli 5 | 1–5 | 3 | — | Range (aralık), Range avantajı, Nut avantajı, Set, İki per, Kent, Overpair, 3-bet, Kombinasyon (combo) |
| `c9-d3` C-bet: ne zaman | ders | 4 | 11 | dogruYanlis 2, eslestirme 1, sayi 1, secmeli 5, spot 2 | 1–5 | 2 | c16, c29 | C-bet (continuation bet), Agresör, İnisiyatif, Range avantajı, Kuru board, Islak board, Multiway, Fold equity, Blöf |
| `c9-d4` C-bet boyutu | ders | 4 | 11 | dogruYanlis 1, eslestirme 1, sayi 5, secmeli 3, spot 1 | 1–5 | 6 | c15 | Bahis boyutu (sizing), C-bet (continuation bet), Equity, Kuru board, Islak board, Range avantajı, Value bet |
| `c9-d5` C-bet'e karşı savunma | ders | 3 | 11 | dogruYanlis 2, sayi 3, secmeli 4, spot 2 | 1–5 | 4 | c17, c26 (k.e.) | Pot odds, Equity, Check-raise, Semi-blöf, Set, İki per, Floş çekişi, OOP (pozisyon dışı) |
| `c9-d6` Pozisyonun postflop değeri | ders | 3 | 11 | dogruYanlis 2, eslestirme 1, sayi 1, secmeli 5, spot 2 | 1–5 | 3 | c30, c16 | IP (pozisyonda), OOP (pozisyon dışı), Bedava kart, Equity, Outs, Islak board |
| `c9-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, eslestirme 1, sayi 3, secmeli 4, spot 2 | 1–5 | 6 | c29, c17 | — |
| `c9-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 3, secmeli 2, spot 1 | 2–5 | 5 | c16 | — |

(k.e.: `kabulEdilebilir` + `dogrulamaGerekli: true`.)

**Toplam tip dağılımı:** seçmeli 34, sayı 20, doğru/yanlış 16, spot 10, eşleştirme 6.

**Betik sonucu:** 86 alıştırmanın 39'u `denetle.mts` ile denetlendi, hata 0. Türler: boardDoku 10, gerekenEquity 7, basabasFold 5, blokerKombo 4, boardSec 3, boardDokuEsleme 2, oranYuzde 2, konusmaSirasi 2, outs 1, bolum 1, boyutEsleme 1, tutma 1.

## Board dokusu: tanımlar ve betik

c9-d1 dört aileyi açıkça tanımlar; betikteki sınıflandırıcı (`boardDokusu`, yalnızca flop) aynı tanımları uygular:

- **Monoton:** üç kart aynı renk. **Çiftli:** iki kart aynı değerde. **Floş çekişi:** tam iki kart aynı renk.
- **Kent çekişi:** bazı iki kartlık eller kent ya da en az 8 out'luk kent çekişi yapabiliyor. Betik 13 × 13 değer çiftini tek tek ekleyip kent ya da kenti tamamlayan en az iki farklı değer arar (renk ve kart sayısı bu sınama için önemsiz). Backdoor (turn + river) sayılmaz.
- **Sınıf:** Monoton > Çiftli > Kuru (gökkuşağı, kent çekişi yok) / Islak (floş çekişi ve kent çekişi var) / Ara (ikisinin arası).
- **Net ayrılma koşulu:** derste öğrenciye verilen pratik kural ("asın dışındaki iki board kartı arasında en fazla 3 değer farkı varsa kent çekişi vardır") her sorulan board'da sayımla aynı çıkmalı; çıkmazsa (ör. A-7-3, A-Q-8) betik soruyu reddeder. "Ara" board kuru ya da ıslak diye sorulamaz; yalnızca "ara" olduğu ya da tek bir özelliği (floş çekişi, kent çekişi) sorulabilir.
- **Bozuk cevap testleri** (`denetle.test.ts`): yanlış aile, ara board'u kuru/ıslak diye sormak, pratik kurala uymayan board, soruda görünmeyen kart, iki doğru cevaplı board seçimi, yanlış eşleştirme.

**Sınır:** betik board'un tanıma göre hangi aileye girdiğini doğrular; o board'da c-bet yapılıp yapılmayacağını ya da kime yaradığını doğrulamaz. Örn. c9-d3/a4'te betik yalnızca seçeneklerden tam birinin kuru olduğunu denetler; "kuru board'da sık c-bet yaygın" ilkesi elle yazılmış genel bir ilkedir.

## Betik neyi doğruluyor (diğer)

- **`boyutEsleme` (1; yeni):** "1/3 pot", "Pot kadar" gibi boyutlar pota oran olarak okunur; başabaş fold B / (P + B) ya da gereken equity B / (P + 2B) hesaplanır, sağdaki yüzde en fazla 0,06 puan sapabilir. Bozuk cevap testi: başabaş değerlerini gereken equity formülüyle eşlemek ve %33,3 yerine %33 yazmak yakalanır.
- **`gerekenEquity`, `basabasFold`, `oranYuzde`, `bolum`:** c-bet ve savunma fiyatları (ör. 2 / 10 = %20, 6 / 18 ≈ %33,3, 5 / 17,5 ≈ %28,6), blöf başabaşları (2 / 8 = %25, 6 / 15 = %40). Girdiler senaryodan elle girilir; betik işlemi doğrular. c9-d5/a3 doğru/yanlış sorusu gereken equity (%20) ile başabaş oranını (%25) karıştırmayı sınar.
- **`blokerKombo` (4):** board ve elindeki kartlar desteden çıkarılarak KK set (3; K♥ elindeyken 1), QQ (1), 98 kent (16) kombinasyonları.
- **`outs`, `tutma`, `konusmaSirasi`:** ıslak board'da K♦ Q♦ ile 8 kent out'u; turn'de 8 out ile river'ı bedava görme ihtimali 8 / 46 ≈ %17,4; postflop konuşma sırası.
- **Spotlar (10):** c15, c16, c17, c26, c29, c30. Seçenek ve doğru cevap spotla birebir (test). Rakip eli hiçbir yerde yok; soru metinleri aksiyonu ve elin türünü (ör. "elinde nut floş çekişi var") anlatır.

## Betikle denetlenmeyenler

47 alıştırma ilke ve tanım sorusudur: range/nut avantajının kime kaydığı, c-bet sıklığı ve boyutunun dokuya ve pozisyona göre yönü, multiway'de blöfün zorlaşması, savunmada el grupları, pozisyonun değeri. Hepsi "genellikle / çoğunlukla / yaygın başlangıç noktası" diliyle. **Hiçbir c-bet sıklığı ya da savunma yüzdesi verilmedi**; sayılar yalnızca fiyat ve başabaş formüllerinden gelir. Kapı 2a notu gereği c9-d4 "çoğunlukla" ile yumuşatıldı ve "kural değil, yaygın başlangıç noktası" cümlesi taşır.

## Terim düzeni

Board dokusu ve dört aile c9-d1'de; range/nut avantajı ve overpair c9-d2'de; c-bet, agresör ve inisiyatif c9-d3'te; bahis boyutu c9-d4'te; check-raise (kısaca, ayrıntısı c10-d4) ve semi-blöf c9-d5'te; bedava kart c9-d6'da tanımlanır. MDF anılmadı (c12-d3); savunma başabaş oranı ve gereken equity ile anlatıldı. Sözlüğe eklenenler: bkz. 02.

## Spot seçimi

- **c26** (combo draw, check-raise): spot gerekçesi "Call da kârlıdır" diyor; karışık strateji olduğu için call `kabulEdilebilir`, alıştırma `dogrulamaGerekli: true`.
- c27 (turn barrel) ve c25 (turn raise) c11'e; c21, c22, c33 (river bluff catch, ince value) c12'ye bırakıldı.

## Onay Ajanı düzeltmeleri (2026-11-13)

- c9-d1/a7, a11, c9-r/a1, a2 ve anlatım: değer farkları açıkça yazıldı ("Q-8 arasında 4", "K-9 arasında 4, 9-3 arasında 6"; "5 değer fark").
- c9-d1 anlatımına not: gerçek oyunda J♠ T♦ 9♣ gibi çok bağlantılı gökkuşağı board'lar da çoğunlukla ıslak sayılır; dört aile öğretim için sadeleştirilmiş tanımdır.
- c9-d6: "Showdown değeri" anlatımda tanımlandı ve terimlere eklendi.
- c9-k/a3: "BB AA, KK ve AK'nın çoğunu 3-bet eder".
- c9-d5/a9 (c26) nedeni, spotun düzeltilen gerekçesiyle uyumlu (iki kartı görürsen ≈ %54; set'e karşı geride).

# Müfredat: veri yapısı ve tasarım gerekçeleri

Müfredat tek dosyadır: `src/data/mufredat.json`. Elle düzenlenmez: harita `scripts/mufredat/iskelet.py` içinde, ders içerikleri ünite başına `scripts/mufredat/icerik/<unite>.json` dosyalarında durur ve betik ikisini birleştirir (içeriği olan ders `durum: "dolu"` olur). `python3 scripts/mufredat/iskelet.py --kontrol` dosya yazmadan çıktının güncel olup olmadığını söyler; `npm test` bunu da denetler. Öğren bölümü yalnızca bu dosyayı okur. Tipler `src/lib/mufredat/tipler.ts`, yükleme denetimi `src/lib/mufredat/dogrula.ts` içindedir; `npm test` dosyayı her seferinde denetler.

## Alanlar

- **En üst:** `surum`, `dil`, `varsayimlar` (cash: 6-max, 100 BB, 2,5 BB açılış, rake yok), `pistler`, `uniteler`.
- **Pist:** `kimlik` (cash, turnuva), `baslik`, `aciklama`, `uniteler` (sıralı ünite kimlikleri).
- **Ünite:** `kimlik`, `baslik`, `seviye` (1–10), `renk`, `ozet`, `dersler`.
- **Ders:** `kimlik`, `baslik`, `tur` (ders, kontrol, test, tekrar), `onkosul`, `kazanimlar`, `sureDk`, `anlatim` (2–4 paragraf), `terimler` (sözlük terimleri), `ustalik` (son kaç alıştırmada hangi oran), `hedefAlistirma`, `durum` (iskelet, dolu), `alistirmalar`.
- **Alıştırma:** `kimlik`, `tip` (secmeli, dogruYanlis, eslestirme, siralama, sayi, range, spot), `zorluk` (1–5), `soru`, `secenekler`, `dogru`, `kabulEdilebilir`, `neden`, `yanilgi`, `dogrulamaGerekli`. Sayı sorularında `tolerans` ve `birim`. İsteğe bağlı `denetim`: cevabın betikle bağımsız yeniden hesaplanması için makinece okunur tarif (ör. `{tur: "kazanan", board: "A♣ 8♦ 5♠ 3♥ 2♦", eller: {Ali: "A♠ K♥", Berk: "A♦ J♣"}}` ya da `{tur: "toplam", terimler: [0.5, 2.5, 2.5]}`); arayüz okumaz. Spot sorularında ya `spotKimlik` (mevcut spot) ya da `spot` (yeni tanım: oyun, oyuncu sayısı, stack, hero pozisyonu ve eli, board, aksiyonlar, rakip aralığı).

## Yükleme denetimi neleri reddeder

Eksik ya da geçersiz alan; tekrar eden kimlik; var olmayan önkoşul; önkoşul döngüsü; bir pistte kendinden sonra gelen derse dayanma; seviyesi geriye giden ünite; sözlükte olmayan terim; var olmayan spot kimliği; dolu derste 8–12 dışı alıştırma sayısı, 3'ten az alıştırma tipi ya da azalan zorluk; rakip aralığında ya da soru metninde somut bir rakip eli. Her hata yerini söyler (`c8-d4 / a3: …`).

## Tasarım gerekçeleri ve brifin sayılarından sapmalar

1. **Ortak temel üniteler (o1–o4).** Brif iki pistin de mutlak başlangıçtan başlamasını istiyor. El sıralaması, masa akışı, pozisyon ve başlangıç elleri iki pistte aynı bilgidir. Bu dört ünite iki pistte de yer alır; dersler tek kez yazılır ve bir pistte tamamlanan ders diğerinde de tamamlanmış görünür. Böylece içerik iki kez yazılıp birbirinden sapmaz.
2. **Seviye testleri 20 alıştırma.** Brifin 8–12 sınırı tek fikirli dersler içindir. Seviye testi birkaç üniteyi örneklediği için 20 soru hedeflenir; süre yaklaşık 10 dakika.
3. **Tekrar dersleri zorunlu değil.** Yolu kilitlemez; soruları sabit değil, kullanıcının geçmiş hatalarından seçilir.
4. **Bankroll yönetimi yok.** Gerçek parayla oyuna dair bir konu olduğu için müfredata alınmadı (değişmez 6).
5. **Solver.** Elimizde solver yok. İleri seviye strateji iddiaları genel kabul görmüş ilkelere dayanır; sayısal iddialar ya kendi hesaplayıcımızdan gelir ya da "doğrulama gerekli" işaretlenir.

## Olgu denetimi

`scripts/mufredat/denetle.mts` (`node scripts/mufredat/denetle.mts`; testte `src/lib/mufredat/denetle.test.ts`) her `denetim` alanını okur: el çeşidi, kazanan, en iyi beşli, kullanılan kapalı kart sayısı, nuts ve sıralamaları `src/lib/poker/evaluator.ts` ile bağımsız olarak hesaplar ve `dogru` ile karşılaştırır. Pot ve sayı sorularında toplanacak terimler elle girilir; betik toplamayı doğrular, senaryonun terimlere doğru çevrildiği elle kontrol edilir. `ornek: true` taşıyan denetim, genel bir kuralı (ör. "floş kenti yener") tek bir temsilî örnekle sınar; denetimdeki kartların soru metninde görünmesi o zaman aranmaz. Pozisyon soruları betikteki 6-max koltuk modeliyle; kombinasyon, aralık yüzdesi, el yazımı, matris ve range soruları destenin bütün iki kartlık ellerini sayarak denetlenir (matris yerleşimi sitenin `matrixLabel` işleviyle de karşılaştırılır). Açılış soruları `src/data/ranges.json`'daki yaklaşık çalışma aralıklarına göre okunur; aralığın son ~%4'ündeki ya da hemen dışındaki el "sınırda" sayılır ve yalnızca `dogrulamaGerekli: true` ya da `kabulEdilebilir` taşıyan soruda kullanılabilir. Gereken equity formülle (ödenecek / (pot + ödenecek)), aralığa karşı equity sabit tohumlu Monte Carlo ile (±1,5 puan) yeniden hesaplanır; spot alıştırmalarının seçenek ve cevabının bağlandığı spotla aynı olduğu testte denetlenir. Range sorusunda sorunun tarifi (ör. "bütün suited aslar") denetimde elle bir kurala çevrilir. Ayrıca aynı kartın iki kez kullanılmasını, denetimdeki kartın soru metninde görünmemesini ve board ya da el karşılaştırması içerip denetimi olmayan soruyu reddeder.

## Doldurma düzeni

Üniteler sırayla doldurulur. Her ünite için: anlatım ve alıştırmalar yazılır, aritmetik cevaplar betikle yeniden hesaplanır, `npm test` çalışır, ünite raporu `docs/mufredat/` altına eklenir ve Onay Ajanı örneklemle denetler.

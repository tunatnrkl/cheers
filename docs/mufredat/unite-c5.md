# Ünite c5 · Açılış aralıkları: öz denetim

Kaynak: `scripts/mufredat/icerik/c5.json`. 8 ders (6 normal + kontrol + tekrar), 81 alıştırma. Cash varsayımları: 6-max, 100 BB, 2,5 BB açılış (SB'den 3 BB), rake yok.

| Ders | Tür | Paragraf | Alıştırma | Tipler | Zorluk | Denetimli | dogrulamaGerekli | Sözlük terimleri |
|---|---|---|---|---|---|---|---|---|
| `c5-d1` Açılış boyutu | ders | 3 | 10 | dogruYanlis 2, eslestirme 1, sayi 4, secmeli 3 | 1–5 | 4 | 0 | Open (açılış), Min-raise, Bahis boyutu (sizing) |
| `c5-d2` UTG ve HJ açılışları | ders | 4 | 11 | dogruYanlis 3, range 1, sayi 1, secmeli 3, spot 3 | 1–5 | 9 | 0 | Range (aralık), Erken pozisyon, Open (açılış) |
| `c5-d3` CO ve BTN açılışları | ders | 4 | 10 | dogruYanlis 2, range 1, secmeli 4, spot 3 | 1–5 | 8 | 0 | Geç pozisyon, Steal (blind çalma), Range (aralık), Connector |
| `c5-d4` SB'den açılış | ders | 3 | 10 | dogruYanlis 2, sayi 3, secmeli 2, spot 3 | 1–5 | 8 | 0 | SB (Small Blind), OOP (pozisyon dışı), Open (açılış), Limp |
| `c5-d5` Sınırdaki eller | ders | 3 | 10 | dogruYanlis 2, eslestirme 1, secmeli 7 | 1–5 | 6 | 3 | Range (aralık) |
| `c5-d6` Rakibe göre küçük ayar | ders | 3 | 10 | dogruYanlis 3, eslestirme 1, sayi 1, secmeli 5 | 1–5 | 4 | 2 | Tight, Loose, Range (aralık) |
| `c5-k` Kontrol | kontrol | 1 | 12 | dogruYanlis 2, range 1, sayi 2, secmeli 4, spot 3 | 1–5 | 9 | 1 | — |
| `c5-r` Tekrar | tekrar | 1 | 8 | dogruYanlis 2, sayi 1, secmeli 4, spot 1 | 2–5 | 5 | 1 | — |

**Toplam tip dağılımı:** seçmeli 32, doğru/yanlış 18, spot 13, sayı 12, eşleştirme 3, range 3.

## Aralıkların kaynağı ve denetimi

- Bütün aralık iddiaları `src/data/ranges.json`'dan gelir (sitenin Range aracı da bunu okur): UTG %15,2, HJ %19,3, CO %27,3, BTN %43,3, SB %38,2. Bunlar kendi hesabımızla üretilmiş **yaklaşık çalışma aralıklarıdır, solver çıktısı değildir**; bu not c5-d2, d3, d4, d5 anlatımlarında ve kontrol dersinin girişinde açıkça yazılı.
- `denetle.mts` her açılış sorusunu (22 `acilis`, 5 `kosulluSec`, 3 `acilisAraligi`, 2 `acilisCoklu`, 1 `acilisEsleme`, 1 `aralikKapsar`) ranges.json'a göre denetler. Bir el aralığın son ~%4'ünde (53 kombinasyon) ya da hemen dışında kalıyorsa veya karışık oynanan bir suited el ise **sınırda** sayılır. Sınırdaki el yalnızca `sinir: true` işaretli ve `dogrulamaGerekli: true` (ya da `kabulEdilebilir`) taşıyan sorularda kullanılabilir; range sorusunun seçeneklerinde hiç kullanılamaz. Aralığın dışında kalan ellerin sınıra uzaklığı, ranges.json'ın yöntem notundaki sıralama kuralı (rastgele ele karşı equity + oynanabilirlik düzeltmesi) betikte yeniden kurularak ölçülür.
- Bu okuma, sitedeki 115 üretilmiş açılış spotunun (`r-…`) cevaplarıyla birebir uyuşur (testte sabit).
- 13 spot alıştırması mevcut spotlara `spotKimlik` ile bağlıdır (r-UTG-77, r-UTG-K9o, r-UTG-J9o, r-HJ-ATs, r-HJ-A5s, r-CO-A9o, r-CO-Q4o, r-BTN-KJo, r-BTN-J4o, r-SB-K9o, r-SB-T3o, r-SB-A6o, c04). Test, seçeneklerin ve doğru cevabın bağlanan spotla birebir aynı olduğunu doğrular. Rakip eli hiçbir yerde yok.
- Aralık yüzdeleri (7) ranges.json'daki listelerin kombinasyonları sayılarak; pot ve boyut hesapları (9) elle girilen terimlerin toplanmasıyla denetlenir.

## Betikle denetlenmeyenler

28 alıştırma kavram ve yön sorusudur (sabit boyutun gerekçesi, steal tanımı, sıkı/gevşek blind'lere göre ayarın yönü). Bunlar genel kabul görmüş ilkelere dayanır ve "genellikle" diliyle yazıldı; `03-kaynak-guven-raporu.md`'de listelenir.

## Sınırdaki eller (dogrulamaGerekli: true, 7 alıştırma)

UTG AJo ve KQo, HJ ATo, CO 22 (iki soruda) ve 87s, BTN 65s. AJo, KQo, ATo ve 22 (c5-d5) sorularında iki cevap da kabul edilir. c5-d6'daki iki soru (BTN 65s, CO 22) masa bilgisi verir ve yönü sorar ("blind'ler sıkı → aç", "sık yeniden raise → fold"). c5-r'deki 87s sorusunun doğru cevabı "kenarda bir eldir".

## Terim düzeni

3-bet c6-d4'te tanımlandığı için c5'te geçmez; "yeniden raise" denir. Equity c6-d1'de tanımlandığı için c5'te kullanılmaz.

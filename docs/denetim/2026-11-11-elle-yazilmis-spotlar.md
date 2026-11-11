# Elle yazılmış spot denetimi — 2026-11-11

Kapsam: `src/data/hands.ts` içindeki 53 elle yazılmış (CURATED) spot. Üretilen 522 spot bu denetimin dışında; onların cevapları zaten `hands.test.ts` içinde bağımsız olarak doğrulanıyor.

Yöntem:
- Pot, ödenecek miktar ve gereken equity: `replay.ts` ile yeniden hesaplandı (test zaten pot tutarlılığını kontrol ediyor).
- Out ve tutma olasılıkları: kesin sayım (47 / 46 görülmeyen kart).
- Equity iddiaları: proje el değerlendiricisiyle Monte Carlo (150–200 bin deneme), rakip aralığı olarak `ranges.json` referans push aralıkları. **Bu aralıklar solver çıktısı değildir**; sonuçlar bu varsayıma bağlıdır.
- ICM: `math.ts` içindeki Malmuth-Harville fonksiyonu. Ödül dağılımları spotlarda verilmediği için **varsayıldı** (aşağıda belirtildi).

## Bulgular (önem sırasına göre)

| # | Spot | Önem | Bulgu | Durum |
|---|---|---|---|---|
| 1 | t22 | Orta | T7o'nun 4 BB UTG push'a karşı equity'si referans aralıklarla %31–32,5; gereken %31,6. "Çoğu push aralığına karşı bunu sağlar" iddiası doğrulanamadı; spot, üretilen spotlar için kullanılan 3,5 puanlık güvenlik payının içinde kalıyordu. | Düzeltildi: el A2o yapıldı (~%40 / %35,5), gerekçe güncellendi, regresyon testi eklendi |
| 2 | c27 | Düşük-orta | Turn'de "backdoor ihtimalleri" deniyordu; turn'de backdoor olmaz ve elde floş çekişi yoktu. | Düzeltildi |
| 3 | c17 | Düşük-orta (öğretici) | Tek bir flop call'u için iki kartlık (%35) oran kullanılıyordu; turn'de yeni bahis gelebileceği belirtilmemişti. Cevap (call) doğru. | Gerekçeye tek kart oranı (~%19) ve implied odds notu eklendi |
| 4 | c20 | Düşük | "Çekişsiz board" deniyordu; K-8-4-2-6 board'unda 75 ve 53 river'da kent yapar. | İfade "floş çekişi olmayan, kent çekişi de az olan" olarak düzeltildi |
| 5 | c21 | Düşük (gerçekçilik) | "Sıkı, nadiren blöf yapan" rakip flop'ta 5,5 BB'lik pota 6,25 BB (pot üstü) c-bet yapıyordu. | Flop bahsi 4 BB, river pot kadar 13,5 BB yapıldı; pot 27 BB, test geçiyor |
| 6 | t23 | Düşük | Turnuva spotu olmasına rağmen ante yok; diğer turnuva spotlarıyla tutarsız. Pot/cevap etkilenmiyor. | Açık (bilinçli bir seçim olabilir) |

## Doğrulanan iddialar

| Spot | İddia | Hesap (varsayım: referans aralık) |
|---|---|---|
| t05 | A9o, BTN 10 BB push'a karşı %50+ | %53,9 (gereken %41,9) — testli |
| t06 | J6o, SB 15 BB push'a karşı %40 altı | %34,4 (gereken %45,2) — testli |
| c26 | 15 out, overpair'e karşı %50+ | %54,5 kesin sayım (QQ'ya karşı); top pair'e %55,5; set'e karşı %42 — testli |
| c17, c18, c19, c33, c32, c05, t20 | Pot odds / başabaş yüzdeleri | Hepsi tutarlı |
| c23 | Turn kartlarının "yarısına yakını" aksiyonu öldürür/geçer | 47 karttan ~20'si (%43) |
| t07 | Bubble'da AJo fold (ICM) | Ödül %40/30/20/10 varsayımıyla ICM başabaş ~%80; AJo ~%60. Chip başabaş %46 |
| t10 | 3 kişide KJo fold (ICM) | Ödül %50/30/20 varsayımıyla ICM başabaş ~%64 (kaybedince 3.lük ödülü dahil); KJo ~%55 |
| t17 | Satellite'te QQ fold | Başabaş >%99; QQ ~%74 |

## Doğrulanamayanlar

- **t13** "88, 14 BB resteal aralığına karşı yarı yarıya": SB'nin ilk giriş 15 BB push aralığına karşı %58,9 çıktı, ama HJ açılışına karşı resteal aralığı farklıdır. Cevap (call) büyük ihtimalle sağlam; sayı doğrulanamadı.
- **Postflop range avantajı iddiaları** (c15, c16, c27, c29): nitel ve genel kabul gören ifadeler; solver olmadan sayısal doğrulama yapılmadı.
- **Rakip tipine dayalı spotlar** (c11, c20, c21, c25, c28): exploit varsayımlarıyla doğru; GTO cevabı farklı olabilir. Notlarda rakip tipi zaten belirtiliyor.
- ICM hesapları ödül dağılımı varsayımına ve modele (gelecek elleri dikkate almaz) bağlıdır.

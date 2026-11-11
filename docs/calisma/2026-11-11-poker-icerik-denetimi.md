# Elle yazılmış 53 spotun poker denetimi — 2026-11-11

Roller: Poker Uzmanı (analiz), QA (test planı ve önem sıralaması).
Kapsam: `src/data/hands.ts` içindeki `CURATED` dizisi (53 spot). Üretilen 522 spot bu denetimin dışında; onlar `npm test` ile zaten doğrulanıyor.

## Yöntem ve varsayımlar

- Pot, çağrı tutarı, gereken equity, SPR ve stack oranları elle yeniden hesaplandı (aksiyon dizisinden).
- Equity değerleri projenin kendi değerlendiricisiyle (`src/lib/poker/evaluator.ts`) Monte Carlo ile hesaplandı: 40.000 deneme, sabit tohum. Sonuçların hata payı yaklaşık ±0,5 puandır.
- Rakip aralıkları için projenin kendi referans push aralıkları (`src/data/ranges.json` → `push`) kullanıldı. **Bunlar solver çıktısı değildir**; equity + oynanabilirlik puanıyla üretilmiş yaklaşık aralıklardır. Gerçek bir rakibin aralığı farklı olabilir.
- ICM hesapları `src/lib/poker/math.ts` içindeki Malmuth-Harville fonksiyonuyla yapıldı. Spotlarda ödeme yapısı verilmediği için **üç farklı varsayımsal ödeme yapısı** denendi. Spotta yazmayan stack'ler efektif stack kabul edildi. Bu yüzden ICM sonuçları "bu varsayımlarla" geçerlidir.
- Hesap betikleri depoya eklenmedi (tek seferlik denetim); aynı hesapların kalıcı teste dönüşmesi aşağıda Claude Code'a devredildi.

## Sayısal doğrulama özeti

| Spot | İddia | Hesap | Sonuç |
|---|---|---|---|
| c05 | gereken equity ≈ %27 | 1,5 / 5,5 = %27,3 | ✅ |
| c13 | flop'ta set ≈ 8'de 1 | %11,8 ≈ 8,5'te 1 | ✅ |
| c17 | gereken ≈ %29; 9 out ≈ %35 | 3,7 / 12,9 = %28,7; 1 − (38/47 · 37/46) = %35,0 | ✅ |
| c18 | gereken %33; gutshot ≈ %9 | 12 / 36; 4 / 44 = %9,1 | ✅ |
| c19 | gereken ≈ %17; 8 out ≈ %17 | 4 / 24 = %16,7; **8 / 44 = %18,2** | ⚠️ D-1 |
| c20 | all-in ≈ 85 BB | 100 − 2,5 − 2,75 − 5,5 = **89,25 BB** | ⚠️ D-2 |
| c21 | pot büyüklüğünde bahse ⅓ blöf gerekir | 18 / 54 = %33,3 | ✅ |
| c24 | SPR < 2 | 78 / 45 = 1,73 | ✅ |
| c26 | 15 out, equity > %50 | QQ'ya karşı %53,1; ATo'ya karşı %54,7 | ✅ |
| c27 | "backdoor ihtimalleri" (turn kararı) | Turn'de tek kart kaldı; backdoor çekiş yok | ⚠️ D-3 |
| c32 | ⅔ pot blöfü başabaş %40 | 8 / 20 = %40 | ✅ |
| c33 | gereken %20 | 4 / 20 | ✅ |
| t01 | blind+ante stack'i ≈ %25 büyütür | 2,5 / 10 | ✅ |
| t05 | gereken ≈ %42; A9o > %50 | 9 / 21,5 = %41,9; BTN 10 BB aralığına karşı **%53,3** | ✅ |
| t06 | gereken ≈ %45; J6o < %40 | 14 / 31 = %45,2; SB 15 BB aralığına karşı **%35,7** | ✅ |
| t11 | pot stack'in ¼'ünden fazla | 4,7 / 18 = %26 | ✅ |
| t13 | gereken ≈ %39; 88 ≈ yarı yarıya | 11,8 / 30 = %39,3; SB 15 BB push aralığına karşı %60,7 (resteal aralığı daha dar olabilir) | ✅ karar sağlam |
| t15 | SPR ≈ 3 | 18 / 5,5 = 3,3 | ✅ |
| t17 | QQ "5 elden 1'inde ya da daha sık" kaybeder | Geniş lider aralığına (BTN 10 BB, %36) karşı QQ %71,4 → **yaklaşık 3,5 elden 1** | ⚠️ D-4 |
| t19 | min-raise stack'in %15'i | 2 / 13 = %15,4 | ✅ |
| t20 | gereken ≈ %18 | 1 / 5,5 = %18,2 | ✅ |
| t22 | gereken ≈ %32; T7o "çoğu push aralığına karşı" yeter | 3 / 9,5 = %31,6; UTG 6 BB aralığına karşı %34,4, UTG 10 BB aralığına karşı **%31,4** | ⚠️ O-2 |
| t07 | ICM nedeniyle AJo fold | AJo %59,9 equity. ICM başabaşı ödeme yapısına göre %64–85 | ✅ (varsayımlarla) |
| t10 | ICM nedeniyle KJo fold | KJo %50,4 equity. ICM başabaşı %64–70 (3. lük ödülü hesaba katıldı) | ✅ (varsayımlarla) |

Diğer spotlarda (c01–c04, c07–c12, c15, c16, c22, c23, c25, c28–c30, t02–t04, t08, t09, t12, t14, t18, t21, t23, t24) pot ve tutar verileri tutarlı. Ayrıca kararlar projenin referans aralıklarıyla çelişmiyor (c03 hariç, bkz. O-1).

### ICM ayrıntısı (varsayımsal ödemeler)

| Spot | Ödeme yapısı (varsayım) | Fold'da $EV | Kazanınca $EV | Call için gereken equity |
|---|---|---|---|---|
| t07 | %40/25/17/10/8 | 0,192 | 0,260 | %73,8 |
| t07 | %30/22/18/16/14 (düz) | 0,194 | 0,228 | %85,0 |
| t07 | %50/30/20/0/0 (eğim testi) | 0,191 | 0,300 | %63,6 |
| t10 | %50/30/20 | 0,352 | 0,437 | %64,3 |
| t10 | %45/32/23 | 0,350 | 0,408 | %67,6 |
| t10 | %40/33/27 | 0,345 | 0,377 | %69,8 |

İki spotta da fold kararı denenen her ödeme yapısında sağlam. Gerçek bir turnuvanın ödeme yapısı farklıysa sonuç değişebilir: **doğrulanamadı (ödeme yapısı spotta yok)**.

## Bulgular (önem sırasıyla)

Kritik veya yüksek önemde bulgu yok: hiçbir spotun önerilen cevabı hesapla çelişmiyor.

| # | Önem | Spot | Sorun | Önerilen düzeltme |
|---|---|---|---|---|
| O-1 | Orta | c03 | Spot, CO'dan 76s açmayı doğru sayıyor. Ama sitenin kendi `/range` sayfasındaki CO açılış aralığı (`ranges.json` → `cash.CO`) 76s'i **içermiyor**. Kullanıcı aynı sitede çelişkili iki bilgi görür. Üretilen aralık equity ağırlıklı olduğu için suited connector'ları olduğundan düşük tutuyor olabilir. Yaygın 6-max kaynakları 76s'i CO'da açar, ancak bunun için kesin bir kaynak gösteremiyorum (**doğrulanamadı**). | İki seçenek var. (a) c03 gerekçesine "referans aralığımız bu eli dışarıda bırakır; oynanabilirlik nedeniyle açılabilir" notu eklenir. (b) Range üreticisinde suited connector oynanabilirlik ağırlığı gözden geçirilir. Kısa vadede (a), ardından range üreticisi için ayrı bir iş. |
| O-2 | Orta | t22 | T7o'nun equity'si gereken eşiğin yalnızca ~3 puan üzerinde ve sıkı bir UTG aralığına karşı eşiğin altına düşüyor. Proje, üretilen spotlarda eşiğe 3,5 puandan yakın olanları "tartışmalı" sayıp çıkarıyor; bu elle yazılmış spot kendi kuralını ihlal ediyor. Gerekçedeki "çoğu push aralığına karşı" ifadesi fazla kesin. | Rakip aralığını nota yaz (ör. "UTG 4 BB'de geniş itiyor"). Ya da eli eşikten belirgin uzak bir elle değiştir (ör. K8o, Q9o: yeniden hesaplanmalı). Gerekçeye "aralık daralırsa karar fold'a döner" cümlesini ekle. |
| D-1 | Düşük | c19 | "8 out'la river'da yaklaşık %17 tutar" ifadesi yanlış; doğrusu 8/44 = %18,2. Sonuç değişmiyor, hatta call lehine güçleniyor. | "yaklaşık %18" yaz; "fiyat tam sınırda" yerine "fiyat sınırın biraz üstünde" de. |
| D-2 | Düşük | c20 | Seçenek "All-in (≈85 BB)" diyor, kalan stack ise 89,25 BB. | "All-in (≈89 BB)". |
| D-3 | Düşük | c27 | Turn kararında "backdoor ihtimalleri" geçiyor. Turn'den sonra tek kart kaldığı için backdoor çekiş yoktur. | "as (per) ve dam (kent) out'larıyla tamamen boş değilsin". |
| D-4 | Düşük | t17 | "QQ ile bile 5 elden 1'inde ya da daha sık" kaybeder deniyor. Geniş bir lider aralığına karşı kayıp oranı ≈ %29 (yaklaşık 3,5'te 1); ifade riski olduğundan düşük gösteriyor. | "geniş bir aralığa karşı bile yaklaşık 3-4 elden 1'inde kaybedersin". |
| B-1 | Bilgi | t21 | "İki elde stack'inin dörtte birine yakını" ifadesi ante modeline bağlı. Replay motorunda ante ölü para olarak ekleniyor, kimin ödediği tanımlı değil. BB ante varsayımında iki elin maliyeti 2,5 BB, yani 7 BB'nin %36'sı. | Ante modeli netleşene kadar "stack'inin önemli bir kısmını" gibi sayısız bir ifade kullan. **Doğrulanamadı.** |
| B-2 | Bilgi | t09 | "Normalde 5 BB ile K9o itilebilir" deniyor, ama projenin UTG 6 BB push aralığı K9o'yu içermiyor. 5 BB'de aralık genişler; ifade muhtemelen doğru ama referans veride 5 BB yok. | "UTG'den 5 BB'de sınırda bir push" diye yumuşat. **Doğrulanamadı.** |

## QA test planı (Claude Code'a devredildi)

`src/lib/poker/hands.test.ts` için önerilen ek doğrulamalar:

1. **Gerekçedeki sayısal iddia testi:** `reasoning` içindeki "gereken equity yaklaşık %X" ifadesi, `requiredEquity(pot, call)` sonucuyla ±1 puan içinde olmalı. Örnek vakalar: c17 → 28,7; c18 → 33,3; c19 → 16,7; t05 → 41,9; t06 → 45,2; t13 → 39,3; t20 → 18,2; t22 → 31,6.
2. **Seçenek etiketindeki all-in tutarı:** "All-in (N BB)" etiketi, replay motorunun hesapladığı kalan stack ile ±1 BB içinde olmalı. Şu an c20'de başarısız olur (85 ≠ 89,25); test önce kırmızı, düzeltmeden sonra yeşil olmalı.
3. **Referans aralık tutarlılığı:** Herkesin fold ettiği cash açılış spotlarında (`seq: []`, `topic: "acilis"`) "aç" cevabı, `ranges.cash[heroPos]` ile çelişiyorsa test ya başarısız olmalı ya da spotta açık bir `rangeNote` alanı aramalı. Bugün c03'te yakalar.
4. **Eşik payı kuralı (elle yazılmış call/push spotları):** `villain` aralığı tanımlıysa equity ile gereken equity arasındaki fark ≥ 3,5 puan olmalı. Bugün t22'de yakalar.
5. **Out yüzdesi:** "N out ... %Y" ifadelerinde Y, `outsProbability(N, street)` ile ±1 puan içinde olmalı. Bugün c19'da yakalar.

Beklenen sonuç: 1, 4 ve 5 numaralı testler veri düzeltmelerinden önce sırasıyla 0, 1 (t22) ve 1 (c19) hata verir; 2 numara 1 (c20), 3 numara 1 (c03) hata verir.

## CEO kalite kontrolü

- Başarı kriteri: "53 spottaki her sayısal iddia yeniden hesaplanmış, bulgular önem derecesiyle listelenmiş, doğrulanamayanlar etiketlenmiş." → **Karşılandı.**
- Eksik kalan: düzeltmeler koda uygulanmadı (Claude Code'a devredildi). Poker içeriği hâlâ insan bir uzman tarafından gözden geçirilmedi; bu denetim, yapay zekanın kendi değerlendiricisiyle yaptığı bir tutarlılık kontrolüdür.

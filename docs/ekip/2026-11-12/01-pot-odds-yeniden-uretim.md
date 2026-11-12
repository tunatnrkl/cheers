# Pot odds spotlarının rakip aralığına karşı yeniden üretimi (karar 3)

Tarih: 2026-11-12 · İş kolu B · Kapı: KARARLAR.md karar 3 (ayrı kapıdan geçecek)

> **Aralıklar yaklaşık varsayımdır, solver çıktısı değildir.** Bu belgedeki bütün equity sayıları projenin kendi değerlendiricisiyle (`src/lib/poker/evaluator.ts`) tam sayımla hesaplandı: aralıktaki her kombinasyon için kalan 44 river kartı tek tek. Monte Carlo yok, örnekleme hatası yok. Sayılar `POT_ODDS_DETAIL=<dosya> npm run ranges` çıktısından alındı; elle yazılmadı.

## Hata

70 üretilmiş pot odds spotunda (`o-…`, `topic: "odds"`) rakibin kartları `villain: {pos, cards}` alanında duruyordu: masada açık çiziliyor (`PokerTable.tsx`), notta yazıyor ("kartlarını gösterdi (…)"), başlık out sayısını veriyor, koç bağlamına gidiyordu (`ai.ts`, "Açık rakip kartları"). Doğru cevap da rakibin o tek eline karşı out sayılarak bulunmuştu. Gerçek pokerde bu karar rakibin eli bilinmeden verilir (ONAY-AJANI değişmez 7).

## Ne değişti

- `villain` alanı veriden (`drills.json`) ve `Hand` tipinden (`src/data/hands.ts`) kalktı.
- `PokerTable.tsx`: rakip kartı çizen dal kaldırıldı; bütün rakip koltuklarında kart sırtı.
- `ai.ts`: "Açık rakip kartları" satırı kaldırıldı; `describeHand` test için dışa açıldı. Asistan formundaki `villain` serbest metni (kullanıcının kendi rakip tarifi) olduğu gibi kaldı.
- Üretici (`scripts/generate-ranges.mts`, bölüm 4): 70 spot sabit bir listeden (eski kimlik, hero eli, board, stack, hero pozisyonu) yeniden üretiliyor. Rastgele kart çekilmiyor; ana üreteç (`rnd`) bu bölümde kullanılmıyor. Diğer 448 üretilmiş spot bayt bayt aynı ve aynı sırada; `ranges.json` değişmedi.
- **Kimlikler değişmedi** (70/70). Board, aksiyon dizisi, pot, stack ve pozisyon 70 spotun hepsinde eskisiyle aynı. Hero eli 22 spotta değişti (aşağıda).
- Başlık el türünü söylüyor, out sayısını değil: "Turn all-in: floş çekişiyle call?".
- `note`: "BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: …" ve aralığın tek cümlelik tarifi.
- `reasoning`: fiyat (gereken equity), aralıktaki kombinasyon sayısı ve hazır el payı, aralığa karşı equity, karar. Rakip çekişle hiç all-in yapmasaydı cevap dönüyorsa bunu ayrıca söylüyor ("Bu kararı rakibin aralığı belirliyor: …"). Somut bir rakip eli yok.

## Aralık varsayımı (makinece tanımlı)

Rakibin turn all-in aralığı üç gruptan oluşur; her kombinasyon eşit ağırlıklıdır:

1. **Hazır eller:** belli bir board değerini tutan en zayıf el ve onu yenen her el.
   - Dar aralık (all-in potun 1,5 katından büyük: 25, 30, 40, 60 BB): eşik board'un en yüksek kartı ("üst çift (X) ve daha iyi her el").
   - Geniş aralık (all-in potun en fazla 1,5 katı: 15 ve 20 BB): eşik board'un ikinci en yüksek değerine iner ("ikinci çift (X) ve daha iyi her el"). O değer board'da çiftse eşik en yüksek kartta kalır.
   - Eşik değeri ya da en yüksek kart board'da çiftse not "X tutan eller ve daha iyi her el" der.
2. **Floş çekişleri:** kendi kartlarından en az biriyle aynı renkten dört kart.
3. **Kent çekişleri:** kendi kartının katkısıyla kenti tamamlayan değer sayısı dar aralıkta en az 2 ("iki uçlu kent çekişleri (8 out)"), geniş aralıkta en az 1 ("kent çekişleri (içten çekişler dahil)").

Ön eleme: rakip **BTN** ise yalnızca `ranges.json`'daki BTN açılış aralığındaki eller; rakip **BB** ise herhangi iki kart ("bu noktaya herhangi iki kartla gelmiş olabilir"). Board'da mümkün olmayan grup (ör. floş çekişi) notta yazılmaz.

Test (`hands.test.ts`) aralığı üreticinin kodundan değil **not metninden** yeniden kurar (eşik değeri, hangi çekiş grupları, BTN/BB ön elemesi), equity'yi tam sayımla bağımsız olarak hesaplar ve cevabın bu ölçümle tuttuğunu, eşiğe en az 3,5 puan uzak olduğunu, gerekçedeki yuvarlanmış yüzdelerin ve kombinasyon sayısının ölçümle aynı olduğunu denetler.

## Hero eli değiştirme kuralı

İki durumda hero eli değiştirildi (kimlik, board, aksiyonlar aynı kaldı):

- **sınırda** (HAFIZA kuralı): aralığa karşı equity, gereken equity'ye 3,5 puandan yakın. 4 spot.
- **ölü el**: aralığa karşı equity %10'un altında. Bunlar çekişsiz, çiftsiz, board'u tutmayan ellerdi; eski üretimde rakibin tek eline karşı "çekiş" gibi görünüyorlardı, gerçek bir aralığa karşı ortada fiyat sorusu kalmıyor ve setin çoğu bariz fold'a dönüyordu. 18 spot. Kural üreticide `DEAD_BELOW = 0.1` sabitiyle; kapatmak için 0 yapılır. **Bu benim kararım, görevde açıkça istenmedi; Onay Ajanı'nın değerlendirmesine bırakıyorum.**

Yeni el, spotun sırasına bağlı sabit tohumla (`mulberry32(4100 + sıra)`) aranır: eşiğe 5–20 puan uzak, hero BTN ise BTN açılış aralığından; call/fold dengesi için o an az olan taraf tercih edilir. Çözülemeyen spot: 0.

**Kimlikte kart yazıyor ve kimlik değişmedi:** hero eli değişen 22 spotun kimliğindeki ilk parça (`o-<el>-<board>`) artık hero'nun eski elidir, masadaki el değildir. Kimlik ilerleme kaydına bağlı olduğu için bilerek bırakıldı. Kimlik arayüzde gösterilmiyor ve içindeki el rakibin eli değil. Sızıntı testi bu istisnayı açıkça yazıyor (board parçası board'la aynı olmalı).

## Sonuç: önce / sonra

"Eski cevap" rakibin tek eline karşı out sayımıydı; "Yeni cevap" nottaki aralığa karşı tam sayım. Fark = aralığa karşı equity − gereken equity (puan). En küçük mutlak fark 3,7 puan. ⚠ = cevap değişti. Cevabı değişen 25 spotun 8'inde hero eli de değişti; 17'sinde aynı el aralığa karşı farklı cevap verdi. Hero eli değişen 22 spotun 14'ünde cevap aynı kaldı.

Cevabı değişen: **25** / 70. Aralığa duyarlı (rakip çekişle hiç itmeseydi cevap dönerdi): **25**. Call: 32, fold: 38.

| Kimlik | Hero poz., stack (BB) | Hero eli | Eski cevap | Yeni cevap | Gereken equity | Aralığa karşı equity | Fark (puan) | Aralıktaki kombinasyon | Aralığa duyarlı |
|---|---|---|---|---|---|---|---|---|---|
| `o-Qc4c-3cTh7h8c` | BB 60 | Q♣ 4♣ | Fold | Fold | %45,4 | %27,1 | -18,4 | 228 |  |
| `o-3s8c-Jc7c5hJs` | BTN 60 | 3♠ 8♣ | Fold | Fold | %45,4 | %13,4 | -32,0 | 179 |  |
| `o-5c7h-Ts3hThQh` | BTN 60 | 5♣ 7♥ | Fold | Fold | %45,4 | %21,5 | -23,9 | 566 |  |
| `o-7hAc-QsTc9c8d` | BB 25 | 7♥ A♣ | Fold | Fold | %39,1 | %11,1 | -28,0 | 200 |  |
| `o-3hAd-8dTs8sKd` | BTN 20 | 3♥ A♦ | Fold | Fold | %36,4 | %26,1 | -10,4 | 548 |  |
| `o-QhKc-6cAh7hJc` | BTN 40 | Q♥ K♣ | Fold | Fold | %43,2 | %30,1 | -13,0 | 290 |  |
| `o-3c5c-Ts5dAc6d` | BTN 15 | 3♣ 5♣ | Fold | Call ⚠ | %32,0 | %37,9 | +5,9 | 487 | evet |
| `o-6d9h-3d4d2c3c` | BB 40 | 6♦ 9♥ | Fold | Fold | %43,2 | %14,8 | -28,4 | 195 |  |
| `o-8h5s-JhTc3d4c` | BTN 30 | K♣ Q♣ (eski: 8♥ 5♠) | Fold | Call ⚠ | %40,9 | %50,9 | +10,0 | 274 | evet |
| `o-5c9s-7h2s8h4c` | BTN 40 | 5♣ 9♠ | Fold | Fold | %43,2 | %14,9 | -28,3 | 325 |  |
| `o-3sTh-8s8d7h9d` | BTN 30 | 3♠ 10♥ | Fold | Fold | %40,9 | %25,6 | -15,3 | 552 |  |
| `o-5cTh-KdJc4d8h` | BB 40 | K♣ Q♣ (eski: 5♣ 10♥) | Fold | Call ⚠ | %43,2 | %57,7 | +14,5 | 136 | evet |
| `o-7cKc-2h7h5dAh` | BB 20 | 7♣ K♣ | Fold | Fold | %36,4 | %32,1 | -4,3 | 321 |  |
| `o-Qh2c-4dTcQs9s` | BTN 60 | Q♥ 2♣ | Fold | Call ⚠ | %45,4 | %49,3 | +3,9 | 377 | evet |
| `o-6c3c-8c2d7d8h` | BTN 20 | A♦ 9♦ (eski: 6♣ 3♣) | Fold | Call ⚠ | %36,4 | %45,9 | +9,5 | 399 | evet |
| `o-Ac2c-JsKc9s6c` | BB 30 | A♣ 2♣ | Fold | Fold | %40,9 | %29,5 | -11,4 | 173 |  |
| `o-7s7c-2d5c2cTc` | BTN 20 | 7♠ 7♣ | Fold | Call ⚠ | %36,4 | %56,2 | +19,8 | 696 |  |
| `o-6h8c-3dQh5dAs` | BTN 15 | 6♥ 8♣ | Fold | Fold | %32,0 | %16,2 | -15,7 | 637 |  |
| `o-5s6s-3h9cJh7h` | BTN 25 | 5♠ 6♠ | Fold | Fold | %39,1 | %17,7 | -21,4 | 587 |  |
| `o-JsTh-5c4d4cKd` | BB 30 | J♠ 10♥ | Fold | Fold | %40,9 | %12,8 | -28,1 | 177 |  |
| `o-4h5s-Qd8h6cKh` | BTN 40 | 4♥ 5♠ | Fold | Fold | %43,2 | %11,3 | -31,9 | 274 |  |
| `o-5d8d-Qs9hTsTc` | BTN 30 | 5♦ 8♦ | Fold | Fold | %40,9 | %12,4 | -28,5 | 451 |  |
| `o-Jh2h-8hKs9d6h` | BTN 30 | J♥ 2♥ | Fold | Fold | %40,9 | %29,3 | -11,6 | 384 |  |
| `o-5c4d-7cKsJsKd` | BTN 25 | A♠ 7♠ (eski: 5♣ 4♦) | Fold | Call ⚠ | %39,1 | %44,4 | +5,2 | 159 | evet |
| `o-5c8d-2hTh2sAs` | BTN 15 | J♣ J♥ (eski: 5♣ 8♦) | Call | Call | %32,0 | %48,6 | +16,6 | 496 |  |
| `o-7cQs-TcAd6d3c` | BTN 60 | 7♣ Q♠ | Fold | Fold | %45,4 | %15,3 | -30,1 | 272 |  |
| `o-6hTs-4dAc8c2s` | BB 25 | A♥ 9♠ (eski: 6♥ 10♠) | Fold | Call ⚠ | %39,1 | %47,4 | +8,3 | 134 | evet |
| `o-8d7s-5hAc9hQs` | BB 60 | 8♦ 7♠ | Fold | Fold | %45,4 | %10,3 | -35,1 | 198 |  |
| `o-Qh7s-TdQs6cAs` | BTN 25 | Q♥ 7♠ | Fold | Fold | %39,1 | %31,6 | -7,5 | 264 |  |
| `o-KdJc-Td2hAs8s` | BB 25 | K♦ J♣ | Fold | Fold | %39,1 | %25,3 | -13,8 | 201 |  |
| `o-Ks3h-Tc5dQc5h` | BB 25 | K♠ 3♥ | Fold | Fold | %39,1 | %16,8 | -22,3 | 166 |  |
| `o-Qh9s-2sAdTd6c` | BTN 25 | A♣ J♥ (eski: Q♥ 9♠) | Fold | Call ⚠ | %39,1 | %54,0 | +14,9 | 179 |  |
| `o-5dKd-9d8s7s3h` | BB 60 | 5♦ K♦ | Fold | Fold | %45,4 | %18,8 | -26,6 | 243 |  |
| `o-6c2h-QsTs7c8h` | BTN 30 | 6♣ 2♥ | Fold | Fold | %40,9 | %11,5 | -29,4 | 438 |  |
| `o-8h4h-Qc9sJcQh` | BB 60 | Q♠ 7♣ (eski: 8♥ 4♥) | Fold | Call ⚠ | %45,4 | %55,9 | +10,5 | 127 | evet |
| `o-5h3h-4h9cKd9d` | BTN 15 | K♣ J♥ (eski: 5♥ 3♥) | Fold | Call ⚠ | %32,0 | %50,6 | +18,7 | 275 |  |
| `o-4s5s-9h2c2dTd` | BB 15 | 9♣ 4♦ (eski: 4♠ 5♠) | Call | Call | %32,0 | %37,6 | +5,6 | 248 | evet |
| `o-3c2d-Th8hKs8s` | BB 15 | A♣ 10♣ (eski: 3♣ 2♦) | Call | Call | %32,0 | %48,0 | +16,0 | 276 | evet |
| `o-4h4c-8d8c6h6s` | BB 15 | J♣ 6♦ (eski: 4♥ 4♣) | Call | Call | %32,0 | %46,7 | +14,7 | 71 | evet |
| `o-7h2c-2h5h6s4h` | BB 15 | 7♥ 2♣ | Call | Call | %32,0 | %52,5 | +20,6 | 343 | evet |
| `o-3cQd-9s9c2s8c` | BTN 20 | 3♣ Q♦ | Call | Fold ⚠ | %36,4 | %25,3 | -11,1 | 453 |  |
| `o-5h2s-QsTdJh8s` | BTN 15 | A♥ 10♣ (eski: 5♥ 2♠) | Call | Call | %32,0 | %39,6 | +7,6 | 660 | evet |
| `o-9c7c-8sJs8c5h` | BB 15 | 9♣ 7♣ | Call | Fold ⚠ | %32,0 | %19,9 | -12,1 | 206 |  |
| `o-2h6h-4hKc4cJd` | BB 15 | Q♦ J♠ (eski: 2♥ 6♥) | Call | Call | %32,0 | %42,0 | +10,1 | 233 | evet |
| `o-Qh8s-5hJh7h9d` | BB 20 | 8♠ 5♦ (eski: Q♥ 8♠) | Call | Call | %36,4 | %43,1 | +6,7 | 369 | evet |
| `o-3c5d-6c7cTdKc` | BB 15 | 3♣ 5♦ | Call | Fold ⚠ | %32,0 | %22,5 | -9,4 | 379 |  |
| `o-Tc9d-Qh7dQd2d` | BTN 15 | J♥ 7♥ (eski: 10♣ 9♦) | Call | Call | %32,0 | %50,7 | +18,8 | 558 | evet |
| `o-8s2s-5s9c7s9h` | BTN 20 | K♦ 8♦ (eski: 8♠ 2♠) | Call | Call | %36,4 | %42,1 | +5,7 | 562 | evet |
| `o-Jc4c-7h6h8c8d` | BTN 15 | J♣ 4♣ | Call | Fold ⚠ | %32,0 | %27,1 | -4,9 | 749 |  |
| `o-AsKs-ThTsJs2c` | BTN 20 | A♠ K♠ | Call | Call | %36,4 | %51,2 | +14,8 | 386 | evet |
| `o-2hTh-8hQh9s6d` | BTN 20 | 2♥ 10♥ | Call | Call | %36,4 | %41,7 | +5,3 | 772 | evet |
| `o-6dQs-KdKsAs2s` | BTN 15 | 6♦ Q♠ | Call | Call | %32,0 | %48,5 | +16,5 | 596 | evet |
| `o-5c4c-Ac6cKs8d` | BB 20 | 5♣ 4♣ | Call | Fold ⚠ | %36,4 | %27,6 | -8,9 | 301 |  |
| `o-2h3c-Ad9dAsJh` | BTN 40 | A♥ 5♦ (eski: 2♥ 3♣) | Call | Call | %43,2 | %62,1 | +18,9 | 126 | evet |
| `o-Jd7d-Kc3dTcKd` | BB 15 | J♦ 7♦ | Call | Fold ⚠ | %32,0 | %24,9 | -7,0 | 243 |  |
| `o-8cJc-2sTd4cQc` | BTN 15 | 8♣ J♣ | Call | Call | %32,0 | %37,5 | +5,6 | 475 | evet |
| `o-7s6c-4c5sAc5h` | BTN 15 | 10♣ 8♣ (eski: 7♠ 6♣) | Call | Call | %32,0 | %40,6 | +8,6 | 564 | evet |
| `o-4dAc-Ks9dQs3h` | BTN 20 | 4♦ A♣ | Call | Fold ⚠ | %36,4 | %29,8 | -6,7 | 592 |  |
| `o-Qh4d-3dTh6cAs` | BTN 30 | A♦ J♣ (eski: Q♥ 4♦) | Call | Call | %40,9 | %49,1 | +8,2 | 141 |  |
| `o-5d3c-2c6c6dQh` | BB 15 | 5♦ 3♣ | Call | Fold ⚠ | %32,0 | %10,3 | -21,7 | 154 |  |
| `o-8hJh-5d7s5h6h` | BB 20 | 8♥ J♥ | Call | Call | %36,4 | %40,2 | +3,7 | 314 | evet |
| `o-2c8c-Td4dAs4c` | BTN 15 | J♣ J♦ (eski: 2♣ 8♣) | Call | Call | %32,0 | %46,7 | +14,7 | 457 |  |
| `o-Qs7c-9s6sKsTc` | BB 25 | Q♠ 7♣ | Call | Fold ⚠ | %39,1 | %31,7 | -7,4 | 247 |  |
| `o-AsQh-Td3sTsKs` | BB 60 | A♠ Q♥ | Call | Fold ⚠ | %45,4 | %41,3 | -4,2 | 224 |  |
| `o-Ah8d-JhKhTs8h` | BTN 15 | A♥ 8♦ | Call | Call | %32,0 | %62,6 | +30,6 | 870 |  |
| `o-2s6c-3cKc3hAd` | BTN 30 | A♣ 7♣ (eski: 2♠ 6♣) | Call | Call | %40,9 | %48,2 | +7,3 | 213 | evet |
| `o-4c2s-6c3s8cAc` | BB 15 | 4♣ 2♠ | Call | Fold ⚠ | %32,0 | %20,8 | -11,1 | 319 |  |
| `o-Ad4d-6c3dJc9s` | BTN 30 | A♦ 4♦ | Call | Fold ⚠ | %40,9 | %25,0 | -15,9 | 308 |  |
| `o-Qs2s-Ac8cTh3h` | BTN 60 | Q♠ 2♠ | Call | Fold ⚠ | %45,4 | %17,5 | -27,9 | 305 |  |
| `o-3s9h-KdQd4s6h` | BTN 25 | 3♠ 9♥ | Call | Fold ⚠ | %39,1 | %11,1 | -28,0 | 269 |  |

### Hero eli değiştirilen spotlar

| Kimlik | Eski el | Eski elin aralığa karşı equity'si | Gereken | Neden | Yeni el | Yeni equity |
|---|---|---|---|---|---|---|
| `o-8h5s-JhTc3d4c` | 8♥ 5♠ | %9,5 | %40,9 | ölü el | K♣ Q♣ | %50,9 |
| `o-5cTh-KdJc4d8h` | 5♣ 10♥ | %4,7 | %43,2 | ölü el | K♣ Q♣ | %57,7 |
| `o-6c3c-8c2d7d8h` | 6♣ 3♣ | %8,2 | %36,4 | ölü el | A♦ 9♦ | %45,9 |
| `o-5c4d-7cKsJsKd` | 5♣ 4♦ | %6,5 | %39,1 | ölü el | A♠ 7♠ | %44,4 |
| `o-5c8d-2hTh2sAs` | 5♣ 8♦ | %9,1 | %32,0 | ölü el | J♣ J♥ | %48,6 |
| `o-6hTs-4dAc8c2s` | 6♥ 10♠ | %4,1 | %39,1 | ölü el | A♥ 9♠ | %47,4 |
| `o-Qh9s-2sAdTd6c` | Q♥ 9♠ | %8,9 | %39,1 | ölü el | A♣ J♥ | %54,0 |
| `o-8h4h-Qc9sJcQh` | 8♥ 4♥ | %7,0 | %45,4 | ölü el | Q♠ 7♣ | %55,9 |
| `o-5h3h-4h9cKd9d` | 5♥ 3♥ | %4,3 | %32,0 | ölü el | K♣ J♥ | %50,6 |
| `o-4s5s-9h2c2dTd` | 4♠ 5♠ | %5,8 | %32,0 | ölü el | 9♣ 4♦ | %37,6 |
| `o-3c2d-Th8hKs8s` | 3♣ 2♦ | %6,5 | %32,0 | ölü el | A♣ 10♣ | %48,0 |
| `o-4h4c-8d8c6h6s` | 4♥ 4♣ | %9,9 | %32,0 | ölü el | J♣ 6♦ | %46,7 |
| `o-5h2s-QsTdJh8s` | 5♥ 2♠ | %6,5 | %32,0 | ölü el | A♥ 10♣ | %39,6 |
| `o-2h6h-4hKc4cJd` | 2♥ 6♥ | %6,6 | %32,0 | ölü el | Q♦ J♠ | %42,0 |
| `o-Qh8s-5hJh7h9d` | Q♥ 8♠ | %33,4 | %36,4 | sınırda | 8♠ 5♦ | %43,1 |
| `o-Tc9d-Qh7dQd2d` | 10♣ 9♦ | %31,4 | %32,0 | sınırda | J♥ 7♥ | %50,7 |
| `o-8s2s-5s9c7s9h` | 8♠ 2♠ | %34,5 | %36,4 | sınırda | K♦ 8♦ | %42,1 |
| `o-2h3c-Ad9dAsJh` | 2♥ 3♣ | %7,4 | %43,2 | ölü el | A♥ 5♦ | %62,1 |
| `o-7s6c-4c5sAc5h` | 7♠ 6♣ | %28,8 | %32,0 | sınırda | 10♣ 8♣ | %40,6 |
| `o-Qh4d-3dTh6cAs` | Q♥ 4♦ | %5,0 | %40,9 | ölü el | A♦ J♣ | %49,1 |
| `o-2c8c-Td4dAs4c` | 2♣ 8♣ | %8,0 | %32,0 | ölü el | J♣ J♦ | %46,7 |
| `o-2s6c-3cKc3hAd` | 2♠ 6♣ | %3,7 | %40,9 | ölü el | A♣ 7♣ | %48,2 |

### Spot başına aralık varsayımı (`note` metni)

- `o-Qc4c-3cTh7h8c`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (10) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-3s8c-Jc7c5hJs`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: J tutan eller ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-5c7h-Ts3hThQh`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (Q) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-7hAc-QsTc9c8d`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (Q) ve daha iyi her el, floş çekişleri.
- `o-3hAd-8dTs8sKd`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (10) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-QhKc-6cAh7hJc`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-3c5c-Ts5dAc6d`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (10) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-6d9h-3d4d2c3c`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (4) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-8h5s-JhTc3d4c`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (J) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-5c9s-7h2s8h4c`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (8) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-3sTh-8s8d7h9d`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (9) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-5cTh-KdJc4d8h`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-7cKc-2h7h5dAh`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (7) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Qh2c-4dTcQs9s`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (Q) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-6c3c-8c2d7d8h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: 7 tutan eller ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Ac2c-JsKc9s6c`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-7s7c-2d5c2cTc`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (5) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-6h8c-3dQh5dAs`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (Q) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-5s6s-3h9cJh7h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (J) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-JsTh-5c4d4cKd`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-4h5s-Qd8h6cKh`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-5d8d-Qs9hTsTc`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (Q) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-Jh2h-8hKs9d6h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-5c4d-7cKsJsKd`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: K tutan eller ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-5c8d-2hTh2sAs`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (10) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-7cQs-TcAd6d3c`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-6hTs-4dAc8c2s`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-8d7s-5hAc9hQs`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-Qh7s-TdQs6cAs`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-KdJc-Td2hAs8s`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-Ks3h-Tc5dQc5h`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (Q) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-Qh9s-2sAdTd6c`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri.
- `o-5dKd-9d8s7s3h`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (9) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-6c2h-QsTs7c8h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (Q) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-8h4h-Qc9sJcQh`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: Q tutan eller ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-5h3h-4h9cKd9d`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-4s5s-9h2c2dTd`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (9) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-3c2d-Th8hKs8s`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (10) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-4h4c-8d8c6h6s`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: 6 tutan eller ve daha iyi her el, kent çekişleri (içten çekişler dahil).
- `o-7h2c-2h5h6s4h`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (5) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-3cQd-9s9c2s8c`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: 8 tutan eller ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-5h2s-QsTdJh8s`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (J) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-9c7c-8sJs8c5h`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (J) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-2h6h-4hKc4cJd`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (J) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Qh8s-5hJh7h9d`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (9) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-3c5d-6c7cTdKc`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (10) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Tc9d-Qh7dQd2d`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: 7 tutan eller ve daha iyi her el, floş çekişleri.
- `o-8s2s-5s9c7s9h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: 7 tutan eller ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Jc4c-7h6h8c8d`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: 7 tutan eller ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-AsKs-ThTsJs2c`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (J) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-2hTh-8hQh9s6d`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (9) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-6dQs-KdKsAs2s`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-5c4c-Ac6cKs8d`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (K) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-2h3c-Ad9dAsJh`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: A tutan eller ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-Jd7d-Kc3dTcKd`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: 10 tutan eller ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-8cJc-2sTd4cQc`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (10) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-7s6c-4c5sAc5h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-4dAc-Ks9dQs3h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (Q) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Qh4d-3dTh6cAs`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, iki uçlu kent çekişleri (8 out).
- `o-5d3c-2c6c6dQh`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (Q) ve daha iyi her el, floş çekişleri.
- `o-8hJh-5d7s5h6h`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (6) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-2c8c-Td4dAs4c`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (10) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Qs7c-9s6sKsTc`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-AsQh-Td3sTsKs`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-Ah8d-JhKhTs8h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: ikinci çift (J) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-2s6c-3cKc3hAd`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri.
- `o-4c2s-6c3s8cAc`: BTN turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BTN, açılış aralığındaki ellerden yalnızca şunlarla all-in yapar: ikinci çift (8) ve daha iyi her el, floş çekişleri, kent çekişleri (içten çekişler dahil).
- `o-Ad4d-6c3dJc9s`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (J) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-Qs2s-Ac8cTh3h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (A) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).
- `o-3s9h-KdQd4s6h`: BB turn'de all-in yaptı; kartlarını görmüyorsun. Varsayım: BB bu noktaya herhangi iki kartla gelmiş olabilir ve yalnızca şunlarla all-in yapar: üst çift (K) ve daha iyi her el, floş çekişleri, iki uçlu kent çekişleri (8 out).

## Emin olunmayanlar (doğrulama gerekli)

1. **Aralıklar bir varsayım.** Gerçek bir oyuncunun turn all-in aralığı, eşit ağırlıklı "hazır eller + çekişler" ile aynı değildir. Blöf (çekişsiz el), slow-play, preflop 3-bet ile ayrılan eller ve flop'ta fold eden eller hesaba katılmadı.
2. **Dar/geniş sınırı (all-in ≤ 1,5 × pot) keyfi.** 15 ve 20 BB'lik 34 spot geniş aralıkla, kalan 36 spot dar aralıkla ölçüldü. Sınır değişirse bazı cevaplar değişebilir.
3. **Aralığa duyarlılık yüksek.** 25 spotta rakip çekişle hiç all-in yapmasaydı cevap dönerdi; gerekçe bunu söylüyor. Bunların hepsi call cevabı (32 call'un 25'i); yani call'ların çoğu "rakip çekişleriyle de iter" varsayımına dayanıyor. Yaklaşım callshove'daki CS-1 düzeltmesiyle aynı.
4. **Hero'nun preflop eli.** 17 spotta hero BTN'de, BTN açılış aralığı dışındaki bir elle açmış görünüyor (ör. 83o, 75o, T3o, Q2o). Bu eski üretimden kalma; görev "hero eli mümkünse aynı kalsın" dediği için değiştirmedim. Yalnızca yeni seçilen eller açılış aralığına uyuyor. İstenirse aynı kuralla bunlar da değiştirilebilir.
5. **"Ölü el" kuralı** görevde istenmedi (yukarıda). Kapatılırsa 18 spot eski eliyle bariz fold olarak kalır.
6. **Showdown'da rakip elinin türetilmesi** (karar 3) bu iş kolunun kapsamı dışında kaldı; `Trainer.tsx`'e dokunulmadı. Cevaptan sonra rakibe bir el gösterilecekse bu aralıktan sabit tohumla seçilmeli.
7. Başlıktaki el türü (ör. "güçlü hazır elle", "ikinci çiftle") üreticideki basit bir sınıflandırmadan geliyor; çift board'larda "güçlü hazır el" kaba bir tarif.
8. Masa çizimi tarayıcıda görsel olarak kontrol edilmedi; değişiklik bir JSX dalının kaldırılması ve testle (`<PlayingCard` yalnızca board ve hero için) korunuyor.

## Testler

- `src/lib/poker/hands.test.ts`: pot odds denetimi yeni mantıkla (yukarıda). 70 spot, call ≥ 25 ve fold ≥ 25.
- `src/lib/poker/sizinti.test.ts` (yeni, 12 test): bütün spotlarda başlık, not, seçenekler ve diğer veri alanlarında hero eli ve board dışında somut iki kartlık el yazımı yok (`AhKd`, `A♠ K♦`, `A♠K♦`, `10♥ 9♣`); `seq` yalnızca board kartı içeriyor; hiçbir spotta `villain` yok; `describeHand(h, false)` rakip kartı, önerilen hamle ya da gerekçe içermiyor; masa ve koç kodu rakip kartı alanı okumuyor; gerekçelerde de somut rakip eli yok (istisna listesi boş). Tek kart ("A♠ blocker'ı") ve harfle yazılan aralıklar ("AK, KQ, 99", "A5s") somut el sayılmıyor; denetleyicinin kendi örnek vakaları da test ediliyor.
- `npx tsc --noEmit` temiz, `npx vitest run` 654/654. `npm run ranges` iki kez çalıştırıldı: `drills.json` bayt bayt aynı, `ranges.json` değişmedi. `next build` çalıştırılmadı.

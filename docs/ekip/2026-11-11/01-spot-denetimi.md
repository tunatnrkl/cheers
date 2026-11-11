# Elle yazılmış 53 spotun denetimi

**Tarih:** 2026-11-11 · **Roller:** Poker Uzmanı, QA · **Kapsam:** `src/data/hands.ts` içindeki `CURATED` dizisi (c01–c33, t01–t24). Üretilen 522 spot (`drills.json`) bu turda incelenmedi.

## Yöntem ve varsayımlar

- Her spotun pot, fiyat ve gerekli equity hesabı elle yeniden yapıldı. Pot değerleri `replay.ts` ile karşılaştırıldı; hepsi tutuyor (`npm test`: 589/589 geçti).
- Equity iddiaları, projenin kendi değerlendiricisi (`evaluator.ts`) ile Monte Carlo (40.000 deneme) kullanılarak kontrol edildi. Rakip aralığı olarak `ranges.json` içindeki **projenin kendi yaklaşık aralıkları** kullanıldı. Bunlar solver çıktısı değil; gerçek bir rakibin aralığı farklı olabilir.
- ICM hesabı Malmuth-Harville ile yapıldı. Spotlarda ödül yapısı verilmediği için **varsayılan ödül dağılımı yazıldı**. Başka bir ödül yapısında sonuç değişebilir.
- Solver'a erişim yok. "Solver burada karışık oynar" gibi ifadeler genel bilgiye dayanıyor ve **doğrulanamadı** olarak işaretlendi.

## Doğrulanan hesaplar (örnek)

| Spot | İddia | Kontrol | Sonuç |
|---|---|---|---|
| t05 A9o, BTN 10 BB push'una karşı | Gereken %42, A9o > %50 | 9 / 21.5 = %41.9; A9o, BTN 10 BB aralığına (%36) karşı **%53.9** | ✅ |
| t06 J6o, SB 15 BB push'una karşı | Gereken ~%45, J6o < %40 | 14 / 31 = %45.2; J6o, SB 15 BB aralığına (%40) karşı **%34.1** | ✅ |
| t13 88, SB 14 BB resteal'ına karşı | Gereken ~%39, 88 ≈ %50 | 11.8 / 30 = %39.3; 88, SB 15 BB aralığına karşı **%58.9** | ✅ (iddia temkinli kalmış) |
| t07 AJo, bubble | Chip EV'de call, ICM'de fold | AJo, BTN 15 BB aralığına karşı %57.3; ödül yapısı yok | ⚠️ yön doğru, sayı doğrulanamadı |
| t22 T7o, bubble'da büyük stack | Gereken ~%32 | 3 / 9.5 = %31.6; T7o, UTG 6 BB aralığına (%20) karşı **%32.6** | ✅ ama pay çok dar (bkz. D-6) |
| c18, c21, c24, c33, t20 | Pot odds | Elle yeniden hesaplandı | ✅ |

## Bulgular (önem sırasına göre)

Kritik hata (yanlış "doğru cevap") bulunmadı. Bulgular gerekçe metnindeki hatalar ve eksik varsayımlar.

### Orta

**O-1 · c17 "Nut floş çekişi ve pot odds" (seviye 1, konu: odds).** Gerekçe, tek bir bahsin fiyatını (%29) **iki kartlık** tutma ihtimaliyle (%35) karşılaştırıyor. Call yalnızca turn kartını garanti eder: tek kartta 9 out ≈ 9/47 = **%19**. Call yine doğru, çünkü as'ın da out olabilmesi, implied odds ve turn'de bedava kart alma ihtimali var. Ama bu el yeni başlayanlara öğretilen klasik bir hatayı pekiştiriyor.
*Önerilen metin:* "9.2 BB'lik pota 3.7 BB ödüyorsun: gereken equity yaklaşık %29. Bu call yalnızca turn kartını görmeni sağlar; floşu turn'de tutma ihtimalin yaklaşık %19. Farkı kapatan şeyler: floş geldiğinde kazanacağın ek chip'ler (implied odds), as gelirse per'in ve turn'ü sık sık bedava geçme şansın. Bu varsayımlarla call kârlı. All-in ise gereksiz büyük."

**O-2 · t10 "Final masasında 3 kişi: KJ offsuit".** Gerekçe "KJo geniş bir aralığa karşı yarı yarıya civarındadır" diyor. SB'nin 10 BB aralığına (%54) karşı ölçülen equity **%55.4**. Chip EV için gereken equity ise 29 / 81 = %35.8. Fold kararı yalnızca ödül yapısıyla açıklanabiliyor ve spotta ödül yapısı yazmıyor.
*Kontrol:* Ödül %50/%30/%20 kabul edilirse ICM'e göre call için **yaklaşık %64** equity gerekir (fold = %35.0 ödül payı, kazanırsa %43.6, kaybederse %20). Ödül %40/%33/%27 olursa eşik yaklaşık %69 olur. Yani bu varsayımlarla fold doğru.
*Öneri:* Ödül yapısını `note` alanına ekle ("Ödüller: %50 / %30 / %20"). Gerekçedeki "yarı yarıya" ifadesini "yaklaşık %55; chip hesabı %36 isterken ICM bu ödül yapısında %60'ın üzerini ister" şeklinde düzelt.

**O-3 · c25 "Derin stack'te top pair'e turn raise".** Fold, "sıkı ve pasif rakip" okumasına dayanan bir exploit. Gerekçede fiyat yok: 30 BB ödeyip 97.5 BB'lik pot için oynuyorsun, gereken equity **%23.5**. Board'da kupa floş çekişi var (Kh9c5h), yani semi-blöf raise'leri de mümkün. Okuma olmadan çoğu çalışma kaynağı burada call'a yakın durur (**doğrulanamadı**).
*Öneri:* Gerekçeye fiyatı ekle ve kararın tamamen rakip okumasına bağlı olduğunu açıkça yaz: "Gereken equity %23.5. Bu, rakibin aralığının yaklaşık dörtte birinde önde olman gerektiği anlamına gelir. Bu oyuncu tipinin aralığı neredeyse yalnızca set ve iki per ise bu sağlanmaz."

### Düşük

**D-1 · c19.** "8 out'la river'da yaklaşık %17" → 8/44 = **%18.2**. Gereken %16.7 olduğundan call implied odds olmadan da kârlı. "Fiyat tam sınırda" yerine "fiyat zaten yeterli; implied odds üstüne gelir" yazılmalı.

**D-2 · c20.** All-in seçeneği "≈85 BB" yazıyor; kalan stack **89.25 BB** (`replay` çıktısı). Ayrıca "çekişsiz bu board" ifadesi river 6'da tam olarak doğru değil: 53 ve 75 kent yapar. Öneri: "Çekişlerin azaldığı bu board'da".

**D-3 · c21.** Başlık "ikinci per" diyor ama river K geldikten sonra (A-K-T) T9 **üçüncü per** oldu. Başlık: "River'da orta per: bluff catch?"

**D-4 · c27.** Turn'de "backdoor ihtimalleri" yok. Backdoor yalnızca flop'ta anlamlıdır ve board'da kupa yok. Gerçek çekişler: Q ile gutshot (4 out) ve as (3 out). Öneri: "Görülürse de dam (kent) ve as ile tamamen boş değilsin."

**D-5 · t21.** "Blind ve ante'ler iki elde stack'inin dörtte birine yakınını götürür." Ante'yi BB ödediğinde sonraki iki elin maliyeti 2 + 0.5 = 2.5 BB, yani 7 BB'nin **yaklaşık %36'sı**. Öneri: "üçte birinden fazlasını".

**D-6 · t22.** Doğru cevap korunuyor ama pay çok dar: ölçülen %32.6, gereken %31.6. UTG'nin 4 BB'deki push aralığı 6 BB aralığından geniş olacağı için gerçek pay muhtemelen daha büyük. Ancak aralık verisinde 4 BB yok (**doğrulanamadı**). "Çoğu push aralığına karşı bunu sağlar" ifadesi "sağlar, ama pay dar" diye yumuşatılmalı.

**D-7 · t23.** Seçenek metninde ondalık virgül var ("25,8 BB"); diğer tüm spotlar nokta kullanıyor.

### Bilgi (ürün kararı gerektirir)

**B-1 · Karışık stratejiler.** c09 (QQ'da 4-bet veya call), c23 (sette check-raise veya call) ve c24 (AA'da all-in veya call) gibi spotlarda ikinci seçenek de savunulabilir (**doğrulanamadı**, solver yok). Şu an bunlar "yanlış" sayılıyor. Öneri: `Hand` tipine isteğe bağlı bir `acceptable?: number[]` alanı eklemek. Bu alan "kabul edilebilir ama önerilen değil" geri bildirimi verir ve istatistikte yarım puan sayılmaz. Bu bir kod işi; Claude Code'a devredildi.

## QA test planı (devredilen)

1. Yukarıdaki metin düzeltmeleri uygulandıktan sonra `npm test`, `npm run typecheck` çalıştırılmalı.
2. Yeni test önerisi: seçenek metninde "≈N BB" ya da "All-in (N BB)" yazan her spot için N, `replay` sonucundaki kahraman stack'inden en fazla 1 BB farklı olmalı. Bu test D-2'yi otomatik yakalardı.
3. Yeni test önerisi: seçenek metinlerinde ondalık virgül yasak (`/\d,\d/`). Bu test D-7'yi yakalardı.
4. Örnek doğrulama vakaları (`math.test.ts` için):
   - Gereken equity: `call / (pot + call)` → (3.7, 9.2) = 0.287; (12, 24) = 0.333; (1.2, 4.7) = 0.203.
   - Tek kart out yüzdesi: 9 out, 47 kart → 0.191; iki kart (flop→river) → 1 − (38/47 × 37/46) = 0.350.
   - ICM (Malmuth-Harville), ödül [50, 30, 20]: stack [52, 28, 6] → oyuncu 2 ≈ 34.99.

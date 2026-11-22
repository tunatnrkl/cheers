# t5 · Push/fold: içerik öncesi doğruluk paketi

**9. CEO çalışması, 2026-11-22.** Roller: Poker Uzmanı, Poker Eğitim, QA.
**Durum:** taslak. İçerik dosyası (`scripts/mufredat/icerik/t5.json`) yazılmadı: geçici kural gereği zamanlanmış çalışma yalnızca `docs/` altına yazıyor. Bu belge t5'i dolduracak uygulayıcı ajana (Claude Code) ve Onay Ajanı'nın kapısına girdi olarak hazırlandı.

Betik: [`docs/ekip/arac/pushfold-t5.mts`](../arac/pushfold-t5.mts) (`node docs/ekip/arac/pushfold-t5.mts`, ~25 sn, sabit tohum 2211). Projenin `evaluate7` değerlendiricisini ve `ranges.json` dosyasını kullanır.

> Eğitim amaçlıdır. Buradaki "EV" turnuva chip'idir, para değildir; gerçek para oyunu için hiçbir sonuç kazanç garantisi değildir.

## 1. Model ve varsayımlar (hepsi varsayım, solver çıktısı değil)

- SB ile BB arasında, diğerleri fold etmiş. İki oyuncunun da stack'i S BB; **BB seni kapsıyor** (ante efektif stack'i etkilemiyor).
- **BB ante 1 BB** (müfredatın turnuva varsayımı). Karşılaştırma için ante'siz sonuç da verildi.
- Push öncesi pot: 0,5 + 1 + 1 = **2,5 BB** (ante'siz 1,5). SB all-in için S − 0,5 BB ekler. Call edilirse son pot 2S + 1.
- SB'nin push aralığı `ranges.json` → `push[S].SB`. Bu aralıklar "169 elin rastgele ele karşı equity'si + oynanabilirlik düzeltmesi" ile üretilmiş yaklaşık aralıklardır, **Nash tablosu değildir** ve ante modeli içermez.
- BB, SB'nin bu aralığını biliyor ve **chip EV'de en iyi cevabı** veriyor: equity'si gereken equity'yi geçen her elle call ediyor. Bu bir denge değil, sabit aralığa karşı en iyi cevaptır (bkz. bölüm 4).
- ICM yok, rake yok. Equity Monte Carlo ile: BB call aralığı için el başına 20.000, hero eli için 100.000 deneme. **Örnekleme payı yaklaşık ±0,5 puan**; içerikte bir ondalıktan fazla kesinlik kullanılmamalı.

## 2. Doğrulanmış sayılar

### 2a. Yalnızca aritmetik (modelden bağımsız, kesin)

| Durum | Hesap | Sonuç |
|---|---|---|
| BB'nin gereken equity'si, 6 BB push | 5 / 13 | %38,5 |
| BB'nin gereken equity'si, 10 BB push | 9 / 21 | %42,9 |
| BB'nin gereken equity'si, 15 BB push | 14 / 31 | %45,2 |
| Ante'siz: 6 / 10 / 15 BB | 5/12 · 9/20 · 14/30 | %41,7 · %45,0 · %46,7 |
| SB saf blöf başabaş fold oranı, 6 BB ("call edilince hiç kazanmaz" varsayımı) | 5,5 / (5,5 + 2,5) | %68,8 |
| aynı, 10 BB | 9,5 / (9,5 + 2,5) | %79,2 |
| aynı, 15 BB | 14,5 / (14,5 + 2,5) | %85,3 |
| CO 10 BB, 2,2 BB açtı; BTN (kapsıyor) all-in; blind'ler fold. Fazlası iade edilir. Call için eklenen / son pot | 7,8 / (0,5 + 1 + 1 + 10 + 10) = 7,8 / 22,5 | %34,7 |
| CO 15 BB, 2,2 BB açtı; BB (kapsıyor) all-in; SB fold | 12,8 / (0,5 + 1 + 15 + 15) = 12,8 / 31,5 | %40,6 |

Ders için anlamı: stack kısaldıkça **BB daha düşük equity ile call edebilir** (fold equity azalır), ama SB'nin saf blöf için gereken fold oranı da düşer. İkisi birlikte öğretilmeli.

### 2b. Aralık genişlikleri (`ranges.json`, kombinasyon sayımı, kesin)

| Stack | UTG | HJ | CO | BTN | SB |
|---|---|---|---|---|---|
| 6 BB | %20,4 | %25,3 | %33,2 | %48,1 | %68,3 |
| 10 BB | %13,3 | %17,3 | %24,1 | %36,2 | %54,1 |
| 15 BB | %9,4 | %12,4 | %17,3 | %26,4 | %40,3 |

Sıralama (UTG < HJ < CO < BTN < SB ve 15 < 10 < 6 BB) her stack'te tutarlı. **Mutlak yüzdeler yaklaşıktır**; içerikte "yaklaşık" diye ve en fazla "çeyrek, yarı" düzeyinde verilmeli.

### 2c. Model sonuçları (BB ante 1 BB, BB en iyi cevap)

| Stack | BB call aralığı (en iyi cevap) | 72o FE / call edilince eq / EV | K5o | A2o | 55 | T9s | J4o |
|---|---|---|---|---|---|---|---|
| 6 BB | %65,9 | %32,7 / %30,5 / **−0,21** | +1,31 | +1,63 | +1,97 | +1,24 | +0,46 |
| 10 BB | %40,3 | %58,0 / %29,7 / **+0,08** | +1,05 | +1,66 | +2,17 | +1,19 | +0,39 |
| 15 BB | %27,3 | %71,6 / %28,6 / **+0,19** | +0,79 | +1,38 | +2,25 | +1,29 | +0,49 |

EV = push'un fold'a göre farkı, BB cinsinden. Formül: `FE × 2,5 + (1 − FE) × (eq × (2S + 1) − (S − 0,5))`.

Örnek, elle kontrol (10 BB, K5o): FE %61,1, call edilince equity %39,4 → 0,611 × 2,5 + 0,389 × (0,394 × 21 − 9,5) = 1,528 − 0,477 ≈ **+1,05 BB**. Betik çıktısıyla aynı.

Ante'siz karşılaştırma (10 BB): BB call aralığı %35,4; 72o **−0,41**, J4o −0,16, K5o +0,29, 55 +1,32. Ante, push'u belirgin biçimde iyileştiriyor.

## 3. Ders ders öneri (Poker Eğitim)

| Ders | Öğretilecek (doğrulanmış) | Kullanılmaması gereken |
|---|---|---|
| `t5-d1` Neden all-in ya da fold | 10 BB'de 2,2 BB açıp all-in yiyince %34,7 ile call etmek gerekir: açılış stack'in ~%22'sini bağlar, fold edersen kaybedersin, call edersen zaten all-in'sin. All-in, rakibe fold seçeneğini en pahalı hâliyle sunar. | "Küçük açılış her zaman hatadır" (kesinlik dili). |
| `t5-d2` Fold equity | İki kazanma yolu formülü (2c), K5o örneği. Gereken BB equity'si 15→10→6 BB'de %45,2 → %42,9 → %38,5. | Sözlükteki "Fold equity" tanımı burada bağlanmalı; t4'te bilinçli olarak kullanılmamıştı. |
| `t5-d3` 10 BB: pozisyona göre push | 2b tablosundaki sıralama; arkada kalan oyuncu sayısı (UTG'de 5, SB'de 1). Uç örnek elleri sınıflamak (AA her yerde push; 72o UTG'de fold). | Sınır ellerinin (ör. K9o, Q8o) pozisyon pozisyon kesin cevabı: "doğrulama gerekli". |
| `t5-d4` 6 BB ve altı | Stack kısaldıkça ölü para (2,5 BB) stack'e oranla büyür, BB daha geniş call eder, bu yüzden **call edildiğinde equity'n daha önemli** olur. `ranges.json` aralığı 6 BB'de genişliyor. | **Bulgu T5-1 (aşağıda):** "aralık iyice genişler" ifadesi modelde her elde görünmüyor. |
| `t5-d5` 15 BB: push mu, açılış mı | Yalnızca aritmetik (12,8 / 31,5 = %40,6): açıp 3-bet all-in yersen ne kadar iyi fiyat aldığın. Hangi ellerin open/fold, hangilerinin push olduğu **solver işi; doğrulanamadı**. İlke düzeyinde "çoğunlukla" diliyle. | El el "15 BB'de X push, Y açılış" listesi. |
| `t5-d6` SB'den BB'ye karşı | Tek rakip → fold equity en kolay burada; SB aralığı her stack'te en geniş (2b). 2c'deki 10 BB örnekleri. | "SB'de her eli push" (6 BB'de 72o bu modelde negatif). |
| `t5-d7` Nash mantığı | Denge tablolarının varsayımları: iki taraf da dengede, ödül yapısı yok (ICM t7'de), yalnızca all-in ya da fold. Bölüm 4'teki ders: sabit aralığa karşı en iyi cevap ≠ denge. | Herhangi bir Nash tablosu sayısı (kaynak açılıp doğrulanmadı). |

## 4. Poker Uzmanı yorumu ve bulgular

- **Sabit aralık tuzağı (d7 için iyi örnek).** Modelde 10 ve 15 BB'de 72o bile push'ta hafif artı (+0,08, +0,19). Bunun nedeni BB'nin SB'nin *dar* `ranges.json` aralığına göre call etmesi. SB gerçekten 72o'yu da push etmeye başlasa BB daha geniş call eder ve sonuç değişir. Öğrenciye "72o push et" diye **öğretilmemeli**; tersine, "bir hesap rakibin aralığı sabitken yapıldıysa sonucu genelleme" dersi için kullanılabilir.
- **T5-1 (orta): `t5-d4` kazanımı sayıyla desteklenmiyor.** 6 BB'de BB'nin en iyi cevabı %65,9'luk call; bu durumda 72o −0,21, 10 BB'de +0,08. Yani bu modelde en zayıf eller 6 BB'de 10 BB'den *daha kötü*. `ranges.json` 6 BB'de daha geniş (%68,3 / %54,1), ama bu genişleme "rastgele ele equity" sıralamasından geliyor, EV hesabından değil. Öneri: kazanım "Çok kısa stack'te rakip daha geniş call ettiği için fold equity azalır; push kararında call edilince equity'nin ağırlığı artar" diye yeniden yazılsın; "aralık iyice genişler" ifadesi `ranges.json`'a atıfla ve "yaklaşık" diye kalabilir.
- **T5-2 (düşük): `ranges.json` push aralıkları ante modeli içermiyor**, oysa turnuva pistinin varsayımı BB ante 1 BB. Ante'li modelde push daha kârlı (2c). İçerikte `ranges.json`'a atıf yapan her yerde "ante'siz yaklaşık aralık" notu gerekir. Ante'li aralık üretmek kod işi: Claude Code'a devredildi (sonraki öncelikler).
- **Doğrulanamadı:** yaygın Nash push/fold tablolarındaki yüzdeler (ör. SB 10 BB için sık anılan "%50'nin üstü" türü sayılar); 15 BB'de push/açılış sınırı; çok oyunculu (UTG–BTN) push'larda arkadaki oyuncuların call aralıkları. Bunlar içerikte sayı olarak geçmemeli.

## 5. Örnek quiz (10 soru, cevap ve gerekçeyle)

Hepsi BB ante 1 BB, aksi yazılmadıkça.

1. **SB'desin, herkes fold etti. Push öncesi potta kaç BB var?** → **2,5.** 0,5 (SB) + 1 (BB) + 1 (ante). *Tuzak: ante'yi unutmak.* (denetim tipi: `antePot`)
2. **10 BB ile SB'den all-in yaptın, BB seni kapsıyor. BB'nin call için gereken equity'si?** → **%42,9.** BB 9 ekler; son pot 10 + 10 + 1 = 21; 9 / 21. (`gerekenEquity`)
3. **Aynı durumda stack 6 BB olsaydı BB'nin gereken equity'si artar mı, azalır mı?** → **Azalır (%38,5).** 5 / 13. Rakip daha geniş call edebilir; fold equity azalır. (`gerekenEquity`)
4. **10 BB, SB'den 72o ile push. "Call edilince hiç kazanmam" diye varsayarsan BB'nin en az ne sıklıkla fold etmesi gerekir?** → **%79,2.** 9,5 / (9,5 + 2,5). Gerçekte call edilince de bazen kazandığın için gereken oran bundan düşüktür. (`basabasFold`)
5. **10 BB, SB. BB %60 fold ediyor; call ettiğinde equity'n %40. Push, fold'a göre kaç BB fark eder?** → **+1,06 BB.** 0,6 × 2,5 + 0,4 × (0,4 × 21 − 9,5) = 1,5 − 0,44.
6. **All-in'in iki kazanma yolu hangileri?** (seçmeli) → **Rakibin fold etmesi ve call edildiğinde showdown'da kazanmak.** "Rakibin blöf yapması" ve "turn'de çekiş" çeldirici.
7. **CO'dasın, 10 BB. 2,2 BB açtın, BTN seni kapsayan all-in yaptı, blind'ler fold etti. Call için gereken equity?** → **%34,7.** 7,8 / 22,5; BTN'nin 10 BB'yi aşan kısmı iade edilir. Bu, d1'in ana fikri: küçük açılış seni zaten bağlar.
8. **10 BB'de push aralıklarını darından genişine sırala: SB, UTG, BTN, CO.** (sıralama) → **UTG, CO, BTN, SB.** Arkanda konuşacak oyuncu azaldıkça birinin iyi elle uyanma olasılığı düşer. (Yüzdeler `ranges.json`, yaklaşık.)
9. **Doğru mu, yanlış mı: Nash push/fold tabloları turnuvanın ödül yapısını hesaba katar.** → **Yanlış.** Chip EV'yle hesaplanır; ödül yapısı ICM ünitesinde (t7).
10. **Bir hesap, BB'nin senin dar aralığına göre call ettiğini varsayıyor ve 72o push'unu +0,1 BB gösteriyor. Bundan "72o'yu her zaman push et" sonucu çıkar mı?** → **Hayır.** Aralığını genişletirsen BB de call aralığını genişletir; sabit aralığa karşı en iyi cevap dengeyi göstermez.

**Eksik konu tespiti:** fold equity'yi çok oyunculu durumda (arkanda birden fazla oyuncu) sayısal öğretecek veri yok; `ranges.json`'da call aralığı yok. t6 (All-in'e call) için "rakibin itme aralığı" ve ICM'siz call aralıkları gerekecek: bu, T5-2 ile aynı kod işi.

## 6. QA: doğrulama vakaları ve kontrol listesi

`scripts/mufredat/denetle.mts` ile karşılanabilecek vakalar (beklenen değer, tolerans):

| Tip | Girdi | Beklenen |
|---|---|---|
| `antePot` | 0,5 + 1 + 1 | 2,5 (kesin) |
| `gerekenEquity` | call 9, son pot 21 | %42,9 (±0,1) |
| `gerekenEquity` | call 5, son pot 13 | %38,5 (±0,1) |
| `gerekenEquity` | call 14, son pot 31 | %45,2 (±0,1) |
| `gerekenEquity` | call 7,8, son pot 22,5 | %34,7 (±0,1) |
| `basabasFold` | risk 9,5, pot 2,5 | %79,2 (±0,1) |
| `basabasFold` | risk 5,5, pot 2,5 | %68,8 (±0,1) |
| `equityAraliga` | K5o, BB'nin 10 BB call aralığı (bölüm 2c, 73 sınıf) | %39,4 (±1, Monte Carlo) |

Kontrol listesi:
- [ ] Hiçbir soruda Nash tablosundan sayı yok.
- [ ] `ranges.json`'a atıf yapan her cümlede "yaklaşık" ve "ante'siz" notu.
- [ ] "Fold equity" terimi t5-d2'de ilk kez tanımlanıyor ve sözlüğe bağlanıyor (t4 bilinçli olarak kullanmamıştı).
- [ ] d4 kazanımı T5-1'e göre güncellendi ya da Onay Ajanı'na sapma olarak yazıldı.
- [ ] EV sorularında "chip" dendiği, para dilinin kullanılmadığı.
- [ ] Sızıntı: soru metinlerinde rakip eli yok (kapı B).

Bulunan hatalar, önem sırasıyla: **T5-1** (orta, kazanım metni), **T5-2** (düşük, veri modeli). İkisi de içerik yazılmadan önce kapandığında maliyetsiz.

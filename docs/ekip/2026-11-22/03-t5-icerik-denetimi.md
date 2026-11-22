# t5 (Push/fold) içeriğinin bağımsız denetimi (kapı K öncesi)

**10. CEO çalışması, 2026-11-22.** Roller: Poker Uzmanı, QA.
**Denetlenen:** `origin/claude/wizardly-meitner-ch8abk` dalındaki `scripts/mufredat/icerik/t5.json` (9 ders, 97 alıştırma). Bu dal varsayılan dala alınmamış (bkz. [04 kapanış](04-calisma-10-kapanis.md)). Kapı K'nin (t5–t6) Onay Ajanı kararı `KARARLAR.md`'de yok.
**Referans:** 9. çalışmanın paketi [`01-t5-pushfold-dogruluk-paketi.md`](01-t5-pushfold-dogruluk-paketi.md) ve betiği. Bu denetimde betik SB'nin 8 BB'si ve dört el (52o, K6o, 54s, Q7o) için yeniden çalıştırıldı.

> Eğitim amaçlıdır. "EV" turnuva chip'idir, para değildir; hiçbir sonuç gerçek para oyununda kazanç garantisi değildir.

## Model (varsayım, solver değil)

SB ile BB arasında, herkes fold etmiş; iki stack eşit, BB kapsıyor. SB'nin aralığı `ranges.json` → `push[S].SB`. BB bu aralığa karşı **chip EV'de en iyi cevabı** veriyor. ICM ve rake yok. Monte Carlo: BB call aralığı için el başına 20.000, hero eli için 100.000 deneme (±0,5 puan). Bu bir denge değildir; ancak aralığa tek bir el eklemek BB'nin call aralığını pek değiştirmediği için, bir elin EV'sinin artı çıkması o elin bu varsayımlar altında aralığa ait olduğuna dair güçlü bir işarettir.

## Sonuç özeti

- **Aritmetik:** 25 sayı sorusunun ve 4 anlatım paragrafındaki oranların hepsi elle yeniden hesaplandı. **Hata yok** (ör. 9/21 = %42,9; 14/31 = %45,2; 5/13 = %38,5; 6/8,5 = %70,6; 9,5/12 = %79,2; 8/10,5 = %76,2; 2,2/4,7 = %46,8; SPR 7/5,5 = 1,27).
- **Kesinlik dili:** "her zaman" yalnızca yanlış seçeneklerde geçiyor. Nash yüzdesi verilmiyor; aralıklar 7 yerde "temkinli, yaklaşık, Nash değil" diye anılıyor. ✅
- **9. çalışmanın T5-1 bulgusu büyük ölçüde karşılanmış:** `t5-d4` 3. paragraf "rakipler daha geniş call eder; kazanç daha çok görüldüğündeki equity'den gelir" diyor. Kalan küçük not aşağıda (T5-5).
- **Yeni bulgular:** SB'nin "fold" cevaplı iki sorusu, sorunun kendi varsayımı olan BB ante 1 BB altında modelle çelişiyor (T5-3, T5-4). Kök neden T5-2: `ranges.json` push aralıkları ante'siz.

## Bulgular (önem sırasıyla)

| # | Yer | İddia | Bu denetimin hesabı | Önem |
|---|---|---|---|---|
| T5-3 | `t5-d6` a4 (eşleştirme), `t5-d3` 3. paragraf | "10 BB SB: 54s → Fold"; "54s SB'de bile aralığın dışındadır" | 10 BB, ante 1: BB call aralığı %39,7, 54s FE %58,9, görülünce equity %38,2, **EV(push) − EV(fold) = +0,87 BB**. Ante'siz bile **+0,25**. | **Orta**: cevap anahtarı, modelin iki varyantında da ters. |
| T5-4 | `t5-d6` a7 (spot) | "BB ante 1 BB. 15 BB SB, 52o → Fold" | 15 BB, ante 1: FE %71,9, equity %30,5, **+0,38 BB**. Ante'siz **−0,19** (fold doğru). | **Orta**: cevap, sorunun koyduğu ante'ye göre ters. |
| T5-2 | bütün push soruları | Senaryolar "BB ante 1 BB" diyor, karar `ranges.json`'dan okunuyor | `ranges.json` ante içermiyor (9. çalışmada bulundu). İçerik bunu hiçbir yerde söylemiyor ("ante'siz" 0 geçiş). Ante push'u iyileştirdiği için **"push" cevapları güvenli yönde, "fold" cevapları riskli**. | Orta (kök neden) |
| T5-6 | "fold" cevaplı çok oyunculu sorular: `t5-d3` a5 (UTG J8o), a7 (BTN 87s, 54s, T8o), a8 (UTG K9o, BTN 54s); `t5-d4` a8 (UTG J6o); `t5-d5` a8 (CO K6o); `t5-k` a6 (CO K2o); `t5-r` a5 (UTG A3o); `t5-d6` a4 (UTG K7o) | Fold | **Doğrulanamadı.** Arkada birden çok oyuncu varken call aralıkları için model yok. Aynı yönlü risk T5-2'den geliyor; BTN'de 87s ve 54s en şüpheliler (BTN'de yalnızca iki oyuncu kalıyor). | Düşük, doğrulama gerekli |
| T5-5 | `t5-d4` 2. ve 4. paragraf | "Daha az fold yeterli olduğu için daha çok el kârlı hâle gelir"; "10 BB'de itilen her el 6 BB'de de itilir" | Ante'li modelde en zayıf eller 6 BB'de 10 BB'den **kötü**: 52o +0,26 → −0,08; 54s +0,87 → +0,50; buna karşılık K6o +1,15 → +1,44, Q7o +0,72 → +1,09. İkinci cümle `ranges.json` için doğru (betik `pushKapsar` ile doğruluyor), ama "sitenin aralıklarında" diye başlamıyor. | Düşük (metin) |

Doğrulanan "push" cevapları (model ile tutarlı): `t5-d6` a6 SB 8 BB K6o (ante 1: **+1,31**; ante'siz +0,58); a5 SB 10 BB K4o; `t5-d6` 4. paragraf Q7o 6 BB "görüldüğünde çoğunlukla geride" (görülünce equity %44,5 < %50) ✅.

## Önerilen düzeltmeler (uygulayıcı ajana, Claude Code)

1. **Kısa vade (yalnızca içerik, kapı K'den önce):**
   - `t5-d6` a4'teki "10 BB SB: 54s" satırını ve `t5-d3` 3. paragraftaki "54s SB'de bile aralığın dışındadır" cümlesini kaldır ya da `dogrulamaGerekli: true` yap. "Suited connector push'ta açılıştaki kadar değerli değil" ilkesi kalabilir; örnek el olarak SB'de değil, UTG'de bir suited connector seçilmeli.
   - `t5-d6` a7: SB'de 15 BB'de "fold" cevabı için ante'li modelde de eksi çıkan bir el bulunamadı (52o bile +0,38). Ya senaryodan ante kaldırılıp "ante'siz" yazılsın (o zaman −0,19, fold tutarlı) ya da soru çıkarılsın.
   - Aralığa atıf yapan anlatım paragraflarına (d3, d4, d6) bir cümle: "Sitenin push aralıkları ante'siz hesaplandı; BB ante push'u biraz daha kârlı yapar, gerçek aralıklar özellikle SB'de daha geniş olabilir."
   - `t5-d4` 4. paragraf: "sitenin aralıklarında" ekle.
2. **Orta vade (kod, geçici kural kalkınca):** T5-2: `scripts/` altındaki aralık üreticisine ante parametresi; SB aralığı en azından bu bölümdeki heads-up en iyi cevap modeliyle denetlensin. Denetim betiğine `push` tipi sorular için "SB ve fold cevabı" uyarısı.

## Doğrulanamayanlar

- Yayımlanmış Nash push/fold tablolarındaki SB yüzdeleri (kaynak açılmadı). Bu denetimdeki sayılar Nash değil, sabit aralığa karşı en iyi cevap.
- Çok oyunculu push kararları (T5-6).
- Gerçek oyuncu havuzlarının call sıklıkları.

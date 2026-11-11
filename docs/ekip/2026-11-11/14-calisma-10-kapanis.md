# 10. çalışma: ICM'li call/fold spotları (CS-3) ve ICM hesap makinesi girişi

**Tarih:** 2026-11-11 · **Dal:** `claude/wizardly-meitner-syhmqe` (9. çalışmanın dalı `g2abma` üzerine kuruldu)

## Başlangıç durumu

- Varsayılan dal (`charming-davinci-emhvz1`, `8ffc135`) 1–8. çalışmaları ve Cheers markasını içeriyor. 9. çalışmanın dalı `g2abma` (`b4b55c8`) henüz birleştirilmedi; hafızadaki talimata göre bu çalışma onun üzerine kuruldu.
- B-1 kararı gelmedi. Kullanıcı verisi yok. Görev metnindeki `[HAFIZA_DOSYASI_ADI]` hâlâ yer tutucu; `HAFIZA.md` kullanıldı.
- Sağlık (başlangıç): `npm test` 640/640.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | CS-3: ICM'li call/fold spotları | ICM'in aynı eli call'dan fold'a çevirdiğini ve her zaman çevirmediğini gösteren spotlar | Ödül yapısı ve rakip aralığı `note`'ta varsayım olarak; sayılar `replay` + `icm()` + Monte Carlo ile; cevap ICM eşiğine 3,5 puandan uzak; regresyon testi; kimlik çakışması yok | Poker Uzmanı, Poker Eğitim, QA |
| 2 | ICM hesap makinesi girişi (açık iş 6) | Uyarı mantığını saf fonksiyona çıkarıp test etmek | Birim testleri; tarayıcıda 390/1366 px doğrulama | Frontend, QA |
| 3 | Dal durumu | Kullanıcıyı bilgilendirmek | Hafızada net talimat | CEO |

**Çalışmayan roller:** Data Analyst (veri yok), Davranış Bilimleri ve UI/UX (yeni mekanik ya da ekran yok), Backend (sunucu değişikliği yok), Content (yeni yazıyı B-1 ve CS-3 spotları oturduktan sonra yazmak daha değerli).

## 1. CS-3: bubble'da all-in'e karşı call (Poker Uzmanı)

### Varsayımlar (hepsi spot notunda yazılı)

- Sit & go bubble'ı, 4 oyuncu, 3 ödül; ödüller **%50 / %30 / %20** (varsayım).
- Rakibin all-in aralığı `ranges.json`'daki referans BTN push aralığı (10 BB ≈ %36, 15 BB ≈ %26). Bu aralıklar **solver çıktısı değil**. Bubble'da gerçek oyuncunun farklı itebileceği doğrulanamadı.
- ICM: Malmuth-Harville (`src/lib/poker/math.ts`). Stack'ler el sonunda `replay`'den alınıyor; ante (1 BB) pota ölü para olarak giriyor (`replay` ile aynı).
- ICM eşiği = (Fold − Kayıp) / (Kazanç − Kayıp), değerler ödül havuzunun yüzdesi olarak. Beraberlik eşik hesabında yok sayılıyor. Doğrudan karşılaştırmada (call EV / fold EV) beraberlik ayrıca hesaba katıldı; sonuç aynı yönde.
- Betik: `docs/ekip/arac/icm-callfold.mts` (200.000 deneme, sabit tohum).

### Sonuçlar

| Spot | El | Stack'ler (CO/BTN/SB/BB) | Chip eşiği | ICM eşiği | Equity | Fold / Call (ödül %) | Cevap |
|---|---|---|---|---|---|---|---|
| `ib01` | A♠3♥ | 45 / 10 / 15 / **10** | %41,9 | **%51,5** | %45,7 | 16,4 / 14,8 | Fold (ICM'siz call: `s10-BTN-A3o`) |
| `ib02` | K♠Q♦ | 30 / 15 / 20 / **15** | %44,4 | **%56,4** | %48,1 | 19,8 / 17,1 | Fold (ICM'siz call: `s15-BTN-KQo`) |
| `ib03` | A♥7♥ | 15 / 10 / 15 / **40** | %41,9 | **%45,0** | %52,0 | 36,3 / 37,1 | Call (chip lideri, rakip kısa) |

Duyarlılık (rakip aralığı değişirse):

| Spot | Daha geniş aralık | Daha dar aralık | Sonuç |
|---|---|---|---|
| `ib01` | BTN 6 BB aralığı (%48): %48,5 | BTN 15 BB (%26): %42,1 | Her iki durumda fold |
| `ib02` | BTN 6 BB (%48): %55,2 | CO 15 BB (%17): %43,2 | Fold; geniş aralıkta eşiğe 1,2 puan yaklaşıyor ("eşiğe yaklaşır ama geçemez") |
| `ib03` | — | BTN 15 BB (%26): %48,2 → call; CO 15 BB (%17): %43,2 → fold | Gerekçede sınır yazılı |

Ders yapısı: `ib01` ve `ib02` aynı elin ICM baskısıyla fold'a döndüğünü, `ib03` ise büyük stack'in kısa stack'e karşı risk priminin küçük kaldığını (yaklaşık 3 puan) gösteriyor. Böylece spotlar "bubble'da her şey fold" diye yanlış genellemeye yol açmıyor.

**Kimlik kararı:** `admiring-babbage-*` dalları `t27`–`t30` kimliklerini kullanıyor (P-4). Çakışmamak için yeni spotlar `ib01`–`ib03` adını aldı.

## 2. Poker Eğitim: ICM call/fold quiz'i (6 soru, seviye 2–3)

1. **Bubble'da (4 oyuncu, 3 ödül) eşit stack'li bir rakibin all-in'ine call etmek için neden chip hesabından daha fazla equity gerekir?**
   *Cevap:* Kaybedersen ödülsüz elenirsin. Kazanırsan stack'in ikiye katlanır ama ödül payın katlanmaz. Kayıp, kazançtan daha pahalıdır.
2. **21,5 BB'lik pota 9 BB ödüyorsun. Chip hesabıyla gereken equity kaçtır?**
   *Cevap:* 9 / 21,5 ≈ %42.
3. **Fold edersen ödül havuzunun %16,4'ünü, call edip kazanırsan %31,9'unu, kaybedersen %0'ını bekliyorsun. Call için gereken equity kaçtır?**
   *Cevap:* (16,4 − 0) / (31,9 − 0) ≈ %51,5. Chip eşiğinden yaklaşık 10 puan yüksek (`ib01`).
4. **Aynı bubble'da hangi durumda risk primi en küçüktür: (a) eşit stack'e karşı orta stack, (b) 40 BB'lik chip lideri olarak 10 BB'lik all-in'e karşı, (c) 15 BB ile 15 BB'lik all-in'e karşı?**
   *Cevap:* (b). Kaybetsen de en büyük stack olarak kalırsın. Eşik %42'den yalnızca %45'e çıkar (`ib03`). (c)'de eşik %44'ten %56'ya çıkar (`ib02`).
5. **Doğru mu yanlış mı: "Bubble'da all-in'e karşı doğru cevap her zaman fold'dur."**
   *Cevap:* Yanlış. Chip lideri, kısa stack'in geniş all-in'ine karşı A7s ile call eder (`ib03`). Kazanırsa bubble biter.
6. **`ib01`'de BTN ellerin %36'sı yerine %48'iyle itiyor olsun. A3o'nun equity'si yaklaşık %48,5 olur. Cevap değişir mi?**
   *Cevap:* Hayır. ICM eşiği %51,5; %48,5 hâlâ altında kalır. Fold.

**Eksik konu:** Final masası ödül sıçramaları (t10 dışında) ve bubble'da **itme** (push) tarafı için ICM'li spot yok. Bu quiz ve spotlar yalnızca call tarafını kapsıyor.

## 3. ICM hesap makinesi girişi (Frontend, QA)

Açık iş 6'yı (uyarı mantığının testi) yaparken üç sorun bulundu:

| # | Bulgu | Önem | Durum |
|---|---|---|---|
| I-2 | Türkçe binlik yazımı `5.000` **5 chip** olarak okunuyordu; ICM sonuçları sessizce yanlış çıkıyordu | Orta | Düzeltildi: `\d{1,3}(\.\d{3})+` binlik sayılıyor; `2.5` ondalık kalıyor |
| I-3 | Ödül alanında `%50` yazımı (ipucu "Yüzde ya da tutar" diyor) sayı değil diye atılıyordu | Orta | Düzeltildi: baştaki/sondaki `%` yok sayılıyor |
| I-4 | 9'dan fazla stack ya da ödül sessizce kesiliyordu; ödüllerdeki geçersiz giriş de söylenmiyordu | Düşük | Düzeltildi: arayüzde not |

- `src/lib/poker/icmInput.ts` (`parseIcmList`) + 8 birim testi (`icmInput.test.ts`). `Calculators.tsx` bu fonksiyonu kullanıyor.
- Tarayıcı (Playwright, 390 ve 1366 px): `5.000, 3.000, 1.500, 500, 0, 1 ×7` ve `%50, %30, %20` girişinde 9 satır, 5000 doğru okunuyor, "1 giriş hesaba katılmadı" ve "fazladan 2 stack hesaba katılmadı" notları görünüyor. Yatay taşma yok, konsol hatası yok.

## 4. QA

### Test planı ve sonuçlar

| # | Kontrol | Beklenen | Sonuç |
|---|---|---|---|
| Q-ib-1 | `ib01`–`ib03` `replay` doğrulaması (sıra, pot, kartlar) | Hata yok, pot 12,5 / 17,5 / 12,5 | ✅ |
| Q-ib-2 | `ib01`: chip eşiğinin üstünde, ICM eşiğinin 3,5 puandan fazla altında; ICM eşiği %50,5–52,5 | Fold | ✅ |
| Q-ib-3 | `ib02`: aynı yapı; ICM eşiği %55,5–57,5 | Fold | ✅ |
| Q-ib-4 | `ib03`: ICM eşiğinin 3,5 puandan fazla üstünde; risk primi < 5 puan; fold EV %36–36,6; dar aralıkta (%17) eşiğin altında | Call | ✅ |
| Q-ib-5 | Gerekçedeki geniş aralık iddiaları (`ib01`, `ib02`) | Eşiğin altında | ✅ |
| Q-ib-6 | Alıştırma masasında "ICM ve bubble" filtresi | 9 spot, notlar ve stack'ler doğru, cevap işaretleniyor | ✅ (390 px, ekran görüntüsüyle) |
| Q-ib-7 | Yüzde ekleri (`%16,4'ünü`, `%17'siyle`, `%45'e` …) | Mevcut Y-1 testi geçer | ✅ |

**Örnek doğrulama vakaları (elle):** `ib01` fold sonrası stack'ler CO 45, BTN 12,5, SB 14,5, BB 9; kazanınca BB 21,5, BTN 0; kaybedince BB 0, BTN 21,5. Toplam chip her durumda 81 (80 + 1 ante).

Sağlık: `npm test` **654/654** (640 + 3 spot doğrulaması + 3 ICM testi + 8 giriş testi), `npm run typecheck` temiz, `npm run build` temiz.

## 5. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| CS-3 spotları | Varsayımlar notta, sayılar ölçülmüş ve testli, fark > 3,5 puan, kimlik çakışması yok | ✅ |
| Quiz | 6 soru, cevap ve gerekçe, sayılar spotlarla tutarlı | ✅ (sitede yayınlanmadı; quiz bileşeni yok) |
| ICM girişi | Saf fonksiyon, test, tarayıcı | ✅ |

Poker iddiaları yeniden okundu. Bütün ICM sayıları **ödül yapısı varsayımına** ve **referans aralığa** bağlı; gerekçelerde "kendi ICM hesabımızla" ve "bu varsayımlarla" diye yazıyor. Solver ya da ICM aracıyla (ör. bağımsız bir ICM hesaplayıcısı) çapraz kontrol yapılamadı: **doğrulanamadı**. Bu nedenle `icm()` ayrıca birim testlerle (eşit stack, toplam korunumu) korunuyor.

## Kullanıcı kararı gerekenler

1. **`claude/wizardly-meitner-syhmqe` (bu dal) varsayılan dala alınmalı.** 9. çalışmanın (`g2abma`) bütün commit'lerini de içeriyor; yalnızca bunu birleştirmek yeterli.
2. B-1 (`acceptable` alanı), P-4 (`admiring-babbage-*` dalları) hâlâ açık.

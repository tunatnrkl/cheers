# Üretilen "all-in'e karşı call" spotlarının duyarlılık denetimi

**Tarih:** 2026-11-11 (2. çalışma) · **Roller:** Poker Uzmanı, QA · **Kapsam:** `drills.json` içindeki 126 `callshove` spotu (`s6-*`, `s10-*`, `s15-*`)
**Yeniden üretme:** `node docs/ekip/arac/callshove-duyarlilik.mts` (sabit tohum, yaklaşık 12 sn)

## Soru

Bu spotlarda doğru cevap tek bir varsayıma dayanır: all-in yapan oyuncunun aralığı, `ranges.json` içindeki push aralığıdır (ör. SB 10 BB = ellerin %54'ü). Üretici, eşiğe 3.5 puandan yakın elleri dışarıda bırakıyor. Bu denetim, bu payın **aralık varsayımı değiştiğinde** cevabı ne kadar koruduğunu ölçüyor.

## Yöntem ve varsayımlar

- Kahramanın gerçek kartlarıyla (spotta yazan renkler), projenin değerlendiricisi (`evaluator.ts`) kullanılarak Monte Carlo yapıldı. Her ölçüm 20.000 deneme (standart hata yaklaşık ±0.35 puan). Üretici 6.000 deneme kullanıyordu (yaklaşık ±0.65 puan).
- Gereken equity, üreticideki formülle hesaplandı: `(S − 1) / (2S + 1 + ölü para)`. Ante 1 BB; SB dışındaki pozisyonlarda SB'nin 0.5 BB'si ölü para. ICM yok (spot notunda da "ICM baskısı yok" yazıyor).
- Dört senaryo:
  1. **Temel:** Spotta yazan aralık (`ranges.json`).
  2. **Dar:** Aynı sıralamayla, yüzdenin %60'ı (ör. %54 → %32). Daha temkinli bir rakibi temsil eder.
  3. **Geniş:** Yüzdenin %150'si (en fazla %100). Daha agresif bir rakibi temsil eder.
  4. **Ham sıralama:** Aynı yüzde, ama eller oynanabilirlik düzeltmesi olmadan yalnızca ham equity'ye göre sıralanmış.
- Bu aralıkların hiçbiri solver çıktısı değil. "Gerçek oyuncu böyle oynar" iddiası **yok**. Amaç yalnızca cevabın varsayıma ne kadar bağlı olduğunu görmek.

## Sonuçlar

| Senaryo | Cevabı değişen spot | Oran |
|---|---|---|
| Temel (yüksek hassasiyetle yeniden ölçüm) | 0 / 126 | %0 |
| Ham equity sıralaması | 0 / 126 | %0 |
| Dar aralık (%60) | 10 / 126 | %8 |
| Geniş aralık (%150) | 9 / 126 | %7 |
| **Dar ya da geniş, en az birinde** | **19 / 126** | **%15** |

Gruplara göre:

| Grup | Spot | Dar aralıkta değişen | Geniş aralıkta değişen |
|---|---|---|---|
| SB 6 BB | 18 | 0 | 5 |
| SB 10 BB | 18 | 2 | 2 |
| SB 15 BB | 18 | 1 | 0 |
| BTN 10 BB | 18 | 1 | 0 |
| BTN 15 BB | 18 | 2 | 1 |
| CO 10 BB | 18 | 3 | 0 |
| CO 15 BB | 18 | 1 | 1 |

**Yorum.** Temel varsayımla hiçbir cevap yanlış değil. Spot notu rakibin aralık yüzdesini açıkça yazdığı için spotlar kendi içinde tutarlı. Ama kullanıcının masada karşılaşacağı rakip bu yüzdeden belirgin biçimde sapabilir. Bu 19 spotta öğretilen karar "her zaman call" ya da "her zaman fold" değil; **rakibin aralığına bağlı bir karar**. Şu anki gerekçe metni bunu söylemiyor.

## Bulgular (önem sırasına göre)

### Orta

**CS-1 · 19 spotta cevap aralık varsayımına duyarlı, gerekçe bunu söylemiyor.**

| Spot | Doğru | Gereken | Temel | Dar | Geniş |
|---|---|---|---|---|---|
| s6-SB-94o | Fold | %38.5 | %33.8 | %30.5 | **%40.9** |
| s6-SB-93o | Fold | %38.5 | %33.6 | %31.3 | **%39.7** |
| s6-SB-84o | Fold | %38.5 | %33.6 | %31.4 | **%39.4** |
| s6-SB-T2o | Fold | %38.5 | %34.7 | %31.3 | **%41.8** |
| s6-SB-85o | Fold | %38.5 | %36.1 | %34.0 | **%41.6** |
| s10-SB-Q9o | Call | %42.9 | %46.3 | **%38.0** | %52.7 |
| s10-SB-K7o | Call | %42.9 | %47.4 | **%39.1** | %52.3 |
| s10-SB-J3s | Fold | %42.9 | %38.9 | %34.3 | **%44.0** |
| s10-SB-J2s | Fold | %42.9 | %37.8 | %35.4 | **%43.7** |
| s15-SB-A6s | Call | %45.2 | %51.3 | **%44.8** | %55.7 |
| s10-BTN-A3o | Call | %41.9 | %45.6 | **%40.5** | %50.0 |
| s15-BTN-A7s | Call | %44.4 | %48.1 | **%43.2** | %52.7 |
| s15-BTN-KQo | Call | %44.4 | %48.2 | **%43.3** | %52.7 |
| s15-BTN-QTo | Fold | %44.4 | %38.8 | %36.2 | **%44.8** |
| s10-CO-A7s | Call | %41.9 | %46.5 | **%41.5** | %51.7 |
| s10-CO-A5s | Call | %41.9 | %45.6 | **%40.3** | %49.8 |
| s10-CO-A4s | Call | %41.9 | %45.1 | **%40.3** | %48.8 |
| s15-CO-ATs | Call | %44.4 | %51.1 | **%42.9** | %56.4 |
| s15-CO-A2s | Fold | %44.4 | %41.0 | %34.6 | **%44.6** |

*Öneri (Claude Code'a devredildi):* Üretici, her `callshove` spotu için dar ve geniş senaryoyu da hesaplasın. Cevap senaryolar arasında değişiyorsa gerekçeye tek bir cümle eklensin, örneğin: *"Rakip daha sıkı oynasaydı (ellerin yaklaşık %32'si) equity'n %38'e düşer ve fold doğru olurdu. Bu kararı rakibin aralığı belirliyor."* Bu, spotu silmekten daha öğreticidir: kullanıcı aralık okumanın kararı nasıl değiştirdiğini görür.

**CS-2 · İki spot, üreticinin kendi 3.5 puan kuralını yüksek hassasiyette ihlal ediyor.** s6-SB-85o'da gereken equity ile ölçülen equity arasındaki fark **2.4 puan**, s10-CO-A4s'te **3.3 puan**. Cevap yön olarak doğru, ama bu iki spot "sınırda olanlar alınmaz" kuralına göre listede olmamalıydı. Nedeni, 6.000 denemelik ölçümdeki örnekleme hatası.
*Öneri:* Üreticideki deneme sayısını en az 20.000'e çıkar. Ayrıca payı, Monte Carlo hatasını da kapsayacak biçimde ölçülen değerden bağımsız tut. Ya da bu iki spotu CS-1 kapsamında açıklama cümlesiyle işaretle.

### Düşük

**CS-3 · ICM'e duyarlı call'lar.** 63 call spotunun 8'inde pay 5 puanın altında. Spot notu "ICM baskısı yok" diyor, bu yüzden cevap doğru. Ama aynı el bubble yakınında fold olabilir. Bu bir hata değil, ileride ICM'li bir varyant üretilirse bu 8 el iyi bir karşılaştırma seti olur (s10-SB-Q9o, s10-SB-K7o, s10-BTN-A3o, s15-BTN-A7s, s15-BTN-KQo, s10-CO-A7s, s10-CO-A5s, s10-CO-A4s).

**CS-4 · Türkçe ek hatası.** Üretilen gerekçelerde "SB'un" ve "CO'un" yazıyor. Doğrusu, okunuşa göre "SB'nin" (es-be) ve "CO'nun" (si-o). "BTN'un" (buton) doğru. Üreticide `LOC` ve `ABL` gibi bir `GEN` (ilgi hâli) tablosu eklenmeli.

**CS-5 · Önceki denetimin D-7 bulgusu ve QA test önerisi yanlış bir varsayıma dayanıyor.** D-7, t23'teki "25,8 BB" ondalık virgülünü "diğer tüm spotlar nokta kullanıyor" diyerek hata saydı. Ölçüm başka bir şey gösteriyor:
- Üretilen 70 `odds` spotunun seçeneklerinin tamamı virgül kullanıyor ("Call (12,5 BB)").
- Arayüzdeki `fmt()` (`replay.ts`) de sayıları virgülle yazıyor. Türkçede ondalık ayırıcı virgüldür.
- Elle yazılan spotların gerekçeleri ise noktalı ("9.2 BB").

Yani tutarsızlık gerçek, ama yönü ters. Önerilen `/\d,\d/` yasağı bugün eklenirse 70 spot testte kalır. *Karar önerisi (CEO):* Kullanıcıya görünen bütün metinlerde **virgül** kullanılsın (Türkçe yazım ve arayüzle uyumlu). Test bunun tersini denetlesin: seçenek ve gerekçe metinlerinde `/\d\.\d/` olmasın. Elle yazılan 53 spot bu karara göre düzeltilmeli. Bu, D-7'nin yerini alır.

## QA test planı (devredildi)

1. **Duyarlılık testi (yavaş, isteğe bağlı):** `npm run ranges` sonrasında bu betik çalıştırılır. Cevabı dar/geniş senaryoda değişen her spotun gerekçesinde "rakibin aralığı" ifadesi geçmeli.
2. **Sınır testi:** `hands.test.ts` içinde, `callshove` spotları için ölçülen equity ile gereken equity arasındaki fark en az 3 puan olmalı (20.000 deneme ile). Bu test CS-2'yi yakalardı.
3. **Dil testi:** Gerekçelerde `SB'un` ve `CO'un` geçmemeli.
4. **Ondalık testi:** CS-5'teki karara göre (virgül), seçeneklerde `/\d\.\d/` geçmemeli.
5. **Örnek doğrulama vakaları** (gereken equity, ante 1 BB):
   - SB 6 BB all-in, BB call 5 BB: 5 / 13 = **0.385**.
   - BTN 10 BB all-in, BB call 9 BB: 9 / 21.5 = **0.419**.
   - CO 15 BB all-in, BB call 14 BB: 14 / 31.5 = **0.444**.

## Doğrulanamayan konular

- Dar ve geniş senaryodaki yüzdeler (%60 ve %150) keyfi seçildi. Gerçek oyuncu popülasyonunun bu stack'lerde ne kadar sapma gösterdiği **doğrulanamadı**.
- Push aralıkları kendi sıralamamızla üretildi. Nash push/fold tablolarıyla karşılaştırma yapılamadı (erişim yok); bu nedenle "temel" senaryonun gerçek dengeye ne kadar yakın olduğu bilinmiyor.

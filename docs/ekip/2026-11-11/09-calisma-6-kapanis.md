# 6. çalışma: üretici düzeltmeleri ve ara kartının masaüstü yerleşimi

**Tarih:** 2026-11-11 · **Dal:** `claude/wizardly-meitner-9evl2r` (5. çalışmanın dalı `vrsaxz` üzerine kuruldu; o dalda ayrıca bir commit yok)

## Başlangıç durumu

- Varsayılan dal (`claude/charming-davinci-emhvz1`) hâlâ `2b7d6b5`'te. 1–5. çalışmaların hiçbiri ana dala alınmamış (P-1). Bu çalışma da `vrsaxz`'den devam etti.
- Sağlık: `npm test` 614/614, `typecheck` temiz. `npm run ranges` mevcut `drills.json` ve `ranges.json`'u bayt bayt aynı üretiyor (değişiklik öncesi kontrol edildi).

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Üretici düzeltmeleri (CS-1, CS-2, CS-4) ve ondalık virgül (CS-5) | Üretilen `callshove` spotlarının cevabı örnekleme hatasından bağımsız; aralığa bağlı kararlar gerekçede açık; görünen metinde Türkçe yazım | Sınırdaki spotlar çıkmış; duyarlı spotların gerekçesinde aralık cümlesi var; görünen metinde `\d.\d` yok; hepsi kalıcı testle korunuyor; diğer üretilen spotlar değişmemiş | Poker Uzmanı, QA |
| 2 | Ara kartını tamamlamak (UX-1) | Masaüstünde kart soluk masanın üstünde, koç paneli açık, "Bu bölümü yorumla" kısayolu; 60 dk notu arayüzde doğrulanmış | Playwright ile masaüstü (1440 px) ve mobil (390 px) kontrolleri geçiyor, ekran görüntüsü incelendi | Frontend, QA |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok), **Davranış Bilimleri** (yeni mekanik yok; 03 spesifikasyonu uygulandı), **UI/UX** (03'teki yerleşim yeterliydi), **Backend** (sunucu değişikliği yok; kısayol mevcut `practice` bağlamını kullanıyor), **Content** ve **Poker Eğitim** (yeni içerik gerekmedi; 1. iş mevcut gerekçeleri düzeltti).

## Poker Uzmanı: callshove yeniden ölçümü

**Varsayımlar:** Rakibin all-in aralığı `ranges.json`'daki push aralığı (kendi sıralamamız; **solver ya da Nash tablosu değil**). ICM yok, toplam ante 1 BB. Gereken equity `(S − 1) / (2S + 1 + ölü para)`. Dar senaryo yüzdenin %60'ı, geniş senaryo %150'si (en fazla %100); bu oranlar keyfi seçildi, gerçek oyuncu popülasyonunu temsil ettiği **doğrulanamadı**.

**Yöntem:** Spot seçimi eskisi gibi ana üreteçle (6.000 deneme) yapılır. Seçilen her spot ayrı bir üreteçle (tohum 777) 20.000 denemeyle yeniden ölçülür (standart hata ≈ ±0,35 puan). Bu sayede `pick`, `concrete` ve pot odds bölümü aynı rastgele sayıları kullanmaya devam eder; diğer 396 üretilmiş spotun id, kart, aksiyon ve cevapları değişmedi, yalnızca metinleri düzeltildi (kontrol edildi).

**Sınırda çıkarılan 4 spot (CS-2):** s6-SB-T2o (gereken %38,5 / ölçülen %35,1), s6-SB-85o (%38,5 / %35,2), s10-SB-Q9o (%42,9 / %46,0), s10-CO-A4s (%41,9 / %45,1). 04 denetimi 2'sini bulmuştu; yüksek hassasiyetli ölçüm 2 tane daha buldu.

**Gerekçesine aralık cümlesi eklenen 16 spot (CS-1):**

| Spot | Cevap | Gereken | Temel equity | Gerekçeye eklenen (rakip …) |
|---|---|---|---|---|
| s6-SB-94o | Fold | %38 | %34 | her eliyle all-in yapsaydı equity %40, call |
| s6-SB-93o | Fold | %38 | %33 | her eliyle: %40, call |
| s6-SB-84o | Fold | %38 | %34 | her eliyle: %39, call |
| s6-SB-74o | Fold | %38 | %35 | her eliyle: eşiğe yaklaşır, neredeyse eşit |
| s10-SB-K7o | Call | %43 | %47 | %32'yle: %39, fold |
| s10-SB-J3s | Fold | %43 | %39 | %81'le: %44, call |
| s10-SB-J2s | Fold | %43 | %38 | %81'le: %44, call |
| s15-SB-KJo | Call | %45 | %51 | %24'le: neredeyse eşit |
| s10-BTN-A3o | Call | %42 | %45 | %22'yle: %40, fold |
| s15-BTN-A7s | Call | %44 | %48 | %16'yla: neredeyse eşit |
| s15-BTN-KQo | Call | %44 | %49 | %16'yla: neredeyse eşit |
| s15-BTN-QTo | Fold | %44 | %39 | %39'la: neredeyse eşit |
| s10-CO-A7s | Call | %42 | %47 | %14'le: neredeyse eşit |
| s10-CO-A5s | Call | %42 | %45 | %14'le: %40, fold |
| s10-CO-KQo | Call | %42 | %48 | %14'le: neredeyse eşit |
| s15-CO-ATs | Call | %44 | %51 | %10'la: %42, fold |

- Senaryodaki equity eşiğe 1 puandan yakınsa metin "şu doğru olurdu" demez, "call ile fold neredeyse eşit olurdu" der. Aksi, Monte Carlo hatası içinde kalan bir farkı kesin bir sonuç gibi sunmak olurdu.
- 04 denetiminin listesiyle fark: s15-SB-A6s, s15-CO-A2s artık listede değil; s6-SB-74o, s15-SB-KJo, s10-CO-KQo yeni. Sebep farklı tohum ve örnekleme hatası; bu spotlar eşiğe yakın senaryolardaki farklar. Kalıcı test 04 listesiyle örtüşen 13 spotu korur.

**Türkçe ek düzeltmeleri (CS-4 ve yeni bulgu Y-1):**
- İlgi hâli okunuşa göre: "SB'nin", "CO'nun", "BTN'nin". 04 denetimi "BTN'un"u (buton okunuşu) doğru saymıştı; sitedeki 125 kullanım (`BTN'de`, `BTN'den`) harf harf okunuşu izlediği için tutarlılık adına "BTN'nin" seçildi.
- **Y-1 (yeni):** Üretilen 326 açılış ve push gerekçesinde ve 122 callshove notunda yüzdeye gelen ek sabitti: "%12'inde", "%54'iyle", "%0'inde". `src/lib/trSuffix.ts` eki sayının okunuşuna göre üretir ("%12'sinde", "%54'üyle", "%40'ında"); en iyi %0 yerine en az %1 yazılır.

**Ondalık virgül (CS-5):** Elle yazılmış 59 spotun görünen metinlerinde 47 ondalık nokta virgüle çevrildi (yalnızca `title`, `note`, `reasoning`, `options`; `seq` ve `potBB` gibi veri alanlarına dokunulmadı). Üreticideki "2.5 BB aç" seçeneği "2,5 BB aç" oldu (92 spot). `/yapay-zeka` sayfasındaki iki örnek metin de düzeltildi.

## Frontend: ara kartı (UX-1)

- Masaüstünde (≥ 1024 px) kart, soluk (`opacity-25`) ve `inert` masanın üstünde durur; aksiyon şeridi de soluk ve `inert`. Mobilde kart masanın yerini alır (masa gizli).
- Koç paneli açık kalır. Bölümde en az bir cevap varsa ve site statik değilse panelin üstünde **"Bu bölümü yorumla"** çıkar; basınca panel, bu bölümün cevaplarıyla `practice` bağlamında `AiPanel`'e döner. Devam et ya da Burada bırak ile sıfırlanır.
- Odak başlığa taşınır (`preventScroll`), ardından kart `scroll-mt-28` ile görünüme kaydırılır. İlk denemede odak kaydırması kartı ve üst çubuğu sabit menünün altına itiyordu; ekran görüntüsünde fark edilip düzeltildi.
- Açılış animasyonu `motion-safe` ile; `prefers-reduced-motion` açıkken çalışmaz.

## QA

| Kontrol | Sonuç |
|---|---|
| `npm test` | **617/617** (614 − 4 çıkarılan spot + 7 yeni test) |
| `npm run typecheck`, `npm run build` | Temiz |
| `npm run ranges` tekrarı | Aynı çıktı (tekrarlanabilir); `ranges.json` değişmedi |
| Yeni testler (`src/lib/poker/text.test.ts`) | Görünen metinde `\d.\d` yok · "SB'un/CO'un/BTN'un" yok · üretilen metinlerde yüzde ekleri `pctWithSuffix` ile aynı · ek yardımcısı için 7 örnek vaka · 122 callshove spotu bağımsız tohumla (9090) 20.000 denemede doğru ve eşiğe en az 3 puan uzak · CS-2 spotları listede yok · 13 duyarlı spotta "rakibin aralığı belirliyor" |
| Playwright, 1440×900 ve 390×844, `pd:rhythm = 10` | 9. cevapta kart açılmıyor, 10.'da açılıyor · masaüstünde masa görünür ve `inert`, mobilde gizli · koç paneli görünür · kısayol görünür, basınca "Bu bölümün yorumu" paneli açılıyor (API anahtarı yok, panel beklenen hata mesajını gösteriyor) · sahte saatle 61 dk sonra uzun oturum notu ve kart içindeki "Sorumlu oyun" bağlantısı görünüyor · odak `break-title`'da · kart açıkken `1` tuşu cevap kaydetmiyor · Esc oturum özetine geçiyor · sayfa hatası yok |

**Örnek doğrulama vakaları** (ante 1 BB): SB 10 BB all-in, BB call 9 BB → 9 / 21 = **%42,9**. BTN 15 BB all-in → 14 / 31,5 = **%44,4**. CO 10 BB all-in → 9 / 21,5 = **%41,9**.

**Bulgular (önem sırasıyla):**
1. **Orta — süreç (P-1):** Dallar hâlâ ana dala alınmadı. Bu 6. dal.
2. **Düşük — elle yazılmış spotlarda yüzde ekleri** denetlenmedi; yeni test yalnızca üretilen spotlara bakıyor. Elle yazılmış metinlerde yanlış ek olup olmadığı açık.
3. **Bilgi:** Sahte saat (Playwright `clock`) altında açılış animasyonu ilk karede kalıyor ve kart yarı saydam görünüyor; gerçek saatte kart opak (ölçüldü: `opacity: 1`). Ürün hatası değil, test ortamı etkisi.
4. **Bilgi:** "Bu bölümü yorumla" yanıtının içeriği gerçek API anahtarıyla denenmedi (README Aşama 1, adım 10).

## CEO kalite kontrolü

| Çıktı | Kriter | Durum |
|---|---|---|
| CS-2: 4 sınırda spot çıkarıldı | Yüksek hassasiyetli ölçüm + kalıcı test | ✅ |
| CS-1: 16 spota aralık cümlesi | Cümle gürültü içindeki farkı kesin sunmuyor; test var | ✅ |
| CS-4 + Y-1 Türkçe ekler | Üretilen metinler testli | ✅ (elle yazılmışlar açık) |
| CS-5 ondalık virgül | Tüm spotlarda testli | ✅ |
| UX-1 ara kartı | Tarayıcıda iki boyutta doğrulandı | ✅ |

Poker iddiaları için not: Bütün equity değerleri yaklaşık aralıklara karşı Monte Carlo sonucudur. "Call/fold doğru" ifadesi chip EV ve belirtilen aralık varsayımıyla sınırlıdır; ICM'li bir turnuva durumunda aynı ellerde karar değişebilir (CS-3, açık).

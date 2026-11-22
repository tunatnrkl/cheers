# Proje hafızası — Cheers AI ekibi

> **Geçici kural (2026-11-12'den itibaren, yeniden tasarım bitince kalkar).** Site "Cheers" olarak baştan kuruluyor (alıştırma motoru, Öğren yolu, tasarım). Bu süre boyunca zamanlanmış ekip çalışmaları **yalnızca `docs/` altına yazar**, `src/`, `scripts/` ve `.github/` dosyalarına dokunmaz; kod gerektiren bulgularını rapora yazıp devreder. Gerekçe: paralel commit'ler 2026-11-11'de 9 dosyada çakışma üretti. Kararlar ve aşama onayları: [`docs/ekip/KARARLAR.md`](docs/ekip/KARARLAR.md), [`docs/ekip/ONAY-AJANI.md`](docs/ekip/ONAY-AJANI.md).

Zamanlanmış "CEO Agent" çalışmalarının ortak hafızası. Her çalışma önce bu dosyayı okur, sonunda günceller. Ürünün teknik dokümantasyonu `README.md`'de. Çalışma çıktıları `docs/ekip/<tarih>/`, analiz betikleri `docs/ekip/arac/`, spot denetimleri `docs/denetim/` altında.

Son güncelleme: **2026-11-22, 10. çalışma**

## Kullanıcıdan beklenenler (önemli)

1. **Görev metnindeki `[HAFIZA_DOSYASI_ADI]` doldurulmalı** (9. çalışmada hâlâ yer tutucuydu). Öneri: `HAFIZA.md` (depo kökü).
2. **`claude/wizardly-meitner-ch8abk` dalı varsayılan dala alınmadı (10 commit, son 2026-11-14).** İçinde c9–c10 (kapı J geçti), t5–t6 (kapı K **yapılmadı**), UI bileşen kütüphanesi ve K-C1/K-G1/K-G2/K-G3/K-E1 düzeltmeleri var. Testler bu dalda yeşil (808/808, 10. çalışma). Birleştirmeden önce kapı K ve T6-1, T6-2, T5-3, T5-4 düzeltmeleri gerekir. (9. çalışmanın "yeniden tasarım durdu, t5 boş" tespiti yanlıştı.)
3. Yayın ortamı ve gerçek `ANTHROPIC_API_KEY` ile asistan testi.
4. Kullanıcı verisi (VPIP/PFR/3-Bet ya da alıştırma geçmişi dökümü). Gelmezse Data Analyst çalışmaz.

Kapanan: P-1 (dallar PR #5–#9 ile varsayılan dala alındı), P-3 ("Cheers" markası uygulandı). Çalışmalar artık varsayılan daldan (`claude/charming-davinci-emhvz1`) başlar.

## Mevcut durum

- Site **Cheers** adıyla yeniden kuruldu (kapı 1 → H, `docs/ekip/KARARLAR.md`). Next.js 16 + React 19; yayınlanan çıktı statik, GitHub Pages uyumlu; sunuculu kurulumda PostgreSQL + Claude API. Türkçe Texas Hold'em çalışma sitesi, gerçek parayla oyun yok, 18+.
- Bitenler: el motoru (A), rakip eli gizliliği ve 70 pot odds spotu (B), alıştırma ekranı ve koç (C), Öğren bölümü (E), "Şerefe!" kutlaması ve ana sayfa (G); müfredat o1–o4, c5–c8, t1–t4.
- **Müfredat:** 23 ünite, 187 ders; **96 ders dolu** (1075 alıştırma). Boş: c9–c13 (Flop, Value/blöf, Turn, River, İleri), t5–t10 (Push/fold, All-in'e call, ICM, Balon/final masası, Özel formatlar, Heads-up). İçerik `scripts/mufredat/icerik/<ünite>.json`, rapor `docs/mufredat/unite-<ünite>.md`, denetim `scripts/mufredat/denetle.mts`.
- 577 spot, 167 sözlük terimi, 8 blog yazısı.
- **`ch8abk` dalında ek olarak:** c9, c10, t5, t6 dolu → 130 ders, 1450 alıştırma (806'sı betikle denetleniyor); sözlük 171+. Sağlık (10. çalışma, o dalda): `npm test` **808/808**, typecheck temiz, `denetle.mts` temiz.
- Sağlık (9. çalışma, varsayılan dal): `npm test` **800/800**, `npm run typecheck` temiz. Statik derleme bu çalışmada çalıştırılmadı.
- Görünen metinde ondalık ayırıcı virgül; yüzde ekleri `src/lib/trSuffix.ts`.

## Tamamlananlar

### 10. çalışma — rapor: [`docs/ekip/2026-11-22/05-calisma-10-kapanis.md`](docs/ekip/2026-11-22/05-calisma-10-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| Dal durumu düzeltmesi: `ch8abk`'de birleştirilmemiş c9–c10, t5–t6 ve UI düzeltmeleri; test 808/808 | CEO, QA | ✅ |
| t5 içeriği bağımsız denetimi (`03-t5-icerik-denetimi.md`): aritmetik hatasız; T5-3, T5-4 (orta), T5-5, T5-6 | Poker Uzmanı, QA | ✅ denetim; düzeltme devredildi |
| t6 içeriği bağımsız denetimi (`04-t6-icerik-denetimi.md`): 68 soru hatasız; T6-1 (yüksek), T6-2 (orta), 5 düşük | Poker Uzmanı, QA | ✅ denetim; düzeltme devredildi |

### 9. çalışma — rapor: [`docs/ekip/2026-11-22/02-calisma-9-kapanis.md`](docs/ekip/2026-11-22/02-calisma-9-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| t5 (Push/fold) içerik öncesi doğruluk paketi: model, doğrulanmış sayılar, ders ders öneri, 10 soruluk quiz, QA vakaları (`01-t5-pushfold-dogruluk-paketi.md`) | Poker Uzmanı, Poker Eğitim, QA | ✅ taslak; `t5.json` yazılmadı (geçici kural), devredildi |
| Betik `docs/ekip/arac/pushfold-t5.mts` (SB vs BB, 6/10/15 BB, ante 1 ve 0, BB en iyi cevap) | Poker Uzmanı | ✅ |
| Kapı kararlarındaki açık engellemeyen bulguların önem sıralı listesi | QA | ✅ liste; düzeltme yok |
| Hafıza yeniden tasarım sonrası duruma getirildi | CEO | ✅ |

### Yeniden tasarım (2026-11-12 → 13, uygulayıcı ajanlar + Onay Ajanı)

Kapılar ve kararlar: [`docs/ekip/KARARLAR.md`](docs/ekip/KARARLAR.md). Ünite raporları: `docs/mufredat/`.

### 8. çalışma — rapor: [`docs/ekip/2026-11-11/12-calisma-8-kapanis.md`](docs/ekip/2026-11-11/12-calisma-8-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| t13: SB resteal aralığı `note`'ta (22+, A2s+, A8o+, KTs+, KQo, QJs); 88 ≈ %55, dar aralıkta ≈ %48, gereken %39,3; test | Poker Uzmanı, QA | ✅ |
| t23 (T-1): `ante: 1`, pot 13,9, all-in 24,8; CO ikinci bahis aralığı `note`'ta; river kesin sayımıyla KT ≈ %56, gereken %22,3; test | Poker Uzmanı, QA | ✅ |
| Gelişim kartı üye yolu: kayıt → cevap → `/profil`, Playwright 390/1366 px, SQL ile çapraz kontrol | QA | ✅ |
| G-1: `GET /api/attempts` `totals` döndürüyor; profil toplamı ondan; Gelişim kartında kesinti notu; 6075 kayıtla denendi | Backend, Frontend, QA | ⚠️ Kısmen (G-2 açık) |

### 7. çalışma — rapor: [`docs/ekip/2026-11-11/11-calisma-7-kapanis.md`](docs/ekip/2026-11-11/11-calisma-7-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| Y-1 devamı: elle yazılmış spotlar + blog tarandı (18 farklı kullanım, hepsi doğru); `pctSuffixProblem` ve tüm metni tarayan test | Poker Uzmanı, QA | ✅ |
| Gelişim istatistikleri spesifikasyonu (`10-gelisim-istatistikleri-spec.md`): davranış değerlendirmesi kanıt düzeyiyle, yerleşim, durumlar, erişilebilirlik, backend (yeni uç nokta yok) | Davranış Bilimleri, UI/UX, Frontend, Backend | ✅ |
| `stats.ts` + 8 birim testi, `Growth.tsx`; Playwright 390/1366 px | Frontend, QA | ✅ (üye/PostgreSQL yolu denenmedi) |

### 6. çalışma — rapor: [`docs/ekip/2026-11-11/09-calisma-6-kapanis.md`](docs/ekip/2026-11-11/09-calisma-6-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| CS-2: callshove spotları ayrı üreteçle 20.000 denemede yeniden ölçülüyor; 4 sınırda spot çıkarıldı (s6-SB-T2o, s6-SB-85o, s10-SB-Q9o, s10-CO-A4s) | Poker Uzmanı | ✅ |
| CS-1: dar (%60) / geniş (%150) senaryoda cevabı değişen 16 spotun gerekçesine aralık cümlesi; eşiğe 1 puandan yakın senaryoda "neredeyse eşit" | Poker Uzmanı | ✅ |
| CS-4 + Y-1: "SB'nin / CO'nun / BTN'nin"; yüzde ekleri okunuşa göre (`trSuffix.ts`) | Poker Uzmanı, QA | ✅ (yalnızca üretilen spotlar) |
| CS-5: elle yazılmış spotlarda 47 ondalık nokta, üreticide "2,5 BB aç", `/yapay-zeka` örnekleri | QA | ✅ |
| UX-1: ara kartının masaüstü yerleşimi, "Bu bölümü yorumla", odak/kaydırma düzeltmesi; Playwright ile iki boyutta ve 60 dk notuyla doğrulandı | Frontend, QA | ✅ |
| 7 yeni test (`src/lib/poker/text.test.ts`) | QA | ✅ |

### 5. çalışma — rapor: [`docs/ekip/2026-11-11/08-calisma-5-kapanis.md`](docs/ekip/2026-11-11/08-calisma-5-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| 6 spot eklendi: c34 (3 BB'ye revize), c35, c36, c38, t25, t26; sayılar yeniden ölçüldü | Poker Uzmanı, Poker Eğitim | ✅ |
| 7 equity/oran regresyon testi (c34, c35, c36 üç yollu, t25, c38, t26 tam sayım, blog T8s) | QA | ✅ |
| Blog: `blind-savunmasi-fiyat-aralik-pozisyon` (8. yazı) | Content | ✅ |
| `/cash` sayfasına "Blind savunması" bölümü (spot + yazı bağlantısı), README sayıları | Frontend | ✅ |
| c39 | — | ⏸ B-1 (`acceptable`) kararı bekliyor |

### 4. çalışma — rapor: [`docs/ekip/2026-11-11/07-calisma-4-kapanis.md`](docs/ekip/2026-11-11/07-calisma-4-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| Üç dalın ve iki hafıza dosyasının birleştirilmesi | CEO | ✅ |
| Spot düzeltmeleri: t10 (O-2), c25 (O-3), c19 (D-1), c20 (D-2), c21 (D-3), t21 (D-5); sayılar yeniden ölçüldü | Poker Uzmanı, QA | ✅ |
| Regresyon testi: seçeneklerdeki all-in tutarı `replay` ile ±1 BB | QA | ✅ |
| `Seri` sayacının kaldırılması, `BreakCard`, `rhythm.ts` + 7 birim testi, 11 konuluk `TOPIC_NOTES` | Frontend, Poker Eğitim, QA | ⚠️ Kısmen: masaüstü yerleşimi ve koç kısayolu eksik |

### 3. çalışma — rapor: [`docs/denetim/2026-11-11-elle-yazilmis-spotlar.md`](docs/denetim/2026-11-11-elle-yazilmis-spotlar.md)

- Düzeltilen spotlar: t22 (A2o'ya çevrildi), c27, c17, c20 ("çekişsiz"), c21 (bahis boyutu).
- Equity regresyon testleri (t05, t06, t22 Monte Carlo; c26 kesin sayım).
- Blog: `risk-primi-hesabi` (t07, t10, t17 ile ICM başabaş hesabı).

### 1. ve 2. çalışma — `docs/ekip/2026-11-11/01`–`06`

| Çıktı | Durum |
|---|---|
| 01 spot denetimi | ✅ Bulguların çoğu kapandı (bkz. hata tablosu). **Dikkat:** O-2 ve O-3'teki sayılar yanlıştı (Q-1, Q-2) |
| 02 blind savunması paketi (quiz, 4 spot taslağı) | ✅ 5. çalışmada eklendi (c34 3 BB'ye revize) |
| 03 oturum ritmi spesifikasyonu | ✅ 4. çalışmada büyük ölçüde uygulandı |
| 04 callshove duyarlılık denetimi + betik | ✅ Rapor; CS-1, CS-2, CS-4 düzeltmeleri açık |
| 05 SPR/value paketi (quiz, c38, c39, t26 taslakları) | ⚠️ c38, t26 eklendi; c39 B-1'i bekliyor |
| 06 blind savunması rehberi (blog taslağı) | ✅ 5. çalışmada yayına alındı |

## Devam eden / açık işler

0. **10. çalışma (kapı K öncesi, Claude Code'a):** T6-1, T6-2, T5-3, T5-4 düzeltilmeden `ch8abk` birleştirilmemeli; düşükler T5-5, T5-6, T6-3…T6-8. Raporlar `docs/ekip/2026-11-22/03`, `04`.
0b. **9. çalışmanın açık bulguları** (K-C1, K-G1, K-G2, K-G3, K-E1 `ch8abk`'de düzeltilmiş, birleşince kapanır) (rapor 02'deki tablo): T5-1, K-C1, K-G1, K-G2, K-G3, K-B1, T5-2, K-A1, S-1, K-E1. Hepsi kod işi, Claude Code'a devredildi.
1. **G-2** (yeniden tasarımdan sonra hâlâ geçerli mi kontrol edilmedi): konu tablosu, çalışma önerisi ve CSV/JSON dışa aktarma hâlâ son 5000 cevapla sınırlı ve bunu söylemiyor. Dışa aktarma için sayfalı uç nokta önerildi (KVKK veri taşınabilirliği).
2. **c39 (value raise):** tek bekleyen spot taslağı; B-1'e bağlı. `value` konusu hâlâ 3 spot.
3. **`acceptable?: number[]` alanı** (B-1): c09, c23, c24, c35 (sınırda) ve c39. Ürün kararı da gerekiyor.
4. **CS-3:** ICM'li call/fold varyantı için 8 ellik karşılaştırma seti hazır (04 raporu); henüz spot yok.
5. "Bu bölümü yorumla" yanıtının içeriği gerçek API anahtarıyla denenmedi.
6. Alıştırma masasında "Blind savunması" filtresinin 6 el gösterdiği tarayıcıda denenmedi.
8. ICM hesap makinesinde elenmiş (stack 0) oyuncunun gösterimi kontrol edilmedi.

## Alınan teknik ve ürün kararları

- **Hafıza dosyası kökteki `HAFIZA.md`.** `docs/ekip/HAFIZA.md` yalnızca yönlendirme.
- Equity iddiaları projenin kendi değerlendiricisiyle ve `ranges.json` ile kontrol edilir. Bu aralıklar yaklaşıktır, solver çıktısı değildir; her raporda böyle yazılır. Mümkünse tam sayım yapılır.
- **Pot hesabında karşılanmayan (uncalled) bahis pota sayılmaz.** Gereken equity = call / (call sonrası gerçekten çekişilen pot). Sayılar `replay` çıktısından alınır, elle değil.
- Cevap, gereken equity'ye referans aralıklarla 3,5 puandan yakınsa spot değiştirilir ya da "sınırda" diye açıkça yazılır.
- Rakip aralığına bağlı spotlarda aralık `note`'ta yazılır; tek cümleyle tarif edilemiyorsa spot eklenmez.
- ICM spotlarında ödül yapısı `note`'ta yazılır ve "varsayım" olarak belirtilir; kaybedenin garanti ödülü hesaba katılır.
- Pot odds gerekçeleri tek sokak üzerinden; iki kartlık oran yalnızca all-in ya da iki sokak garantiliyse.
- **Ödül döngüsü mekanikleri yok:** seri, rozet, liderlik tablosu, günlük hedef zinciri. Ara kartındaki iki seçenek eşit görsel ağırlıkta.
  - **Güncelleme (2026-11-12, ürün sahibinin brifi; KARARLAR.md karar 4):** Öğren bölümünde XP, günlük seri ve seviye; alıştırmada 5 ve 10'luk doğru seride kısa "Şerefe!" kutlaması eklenecek. Sınırlar: XP sabit; rastgele ödül, sandık, çarpan, can/kalp, rozet, liderlik tablosu, bildirim ve geri sayım yok; seri kopunca nötr dil; ara kartı ve eşit ağırlıklı iki seçenek korunur. Eski gerekçe (`docs/ekip/2026-11-11/03-oturum-ritmi-spec.md`) bu sınırların dayanağıdır.
- Oturum ritmi verisi yalnızca tarayıcıda (`localStorage["pd:rhythm"]`); sunucuya kişisel veri gitmez.
- **G-1 kararı (8):** istatistikler istemcide kalır; sunucu yalnızca toplamı (`count`) verir, liste kesildiğinde arayüz bunu söyler. Kullanıcıların kayda değer kısmı 5000'i aşarsa sunucu özeti yeniden değerlendirilir.
- **İstatistik kuralları (7):** yeni veri toplanmaz, hesap istemcide; `MIN_SAMPLE = 10` altında oran yok; pencereler kayan 7 gün (takvim haftası, günlük ısı haritası yok); tek nötr renk, "düştün/yükseldin" vurgusu yok; ilk görüş ve tekrar ayrı gösterilir.
- Ondalık ayırıcı: görünen metinde virgül (6. çalışmada uygulandı, testli). Veri alanlarında (`seq`, `potBB`, `stackBB`) nokta.
- Blog yazıları `POSTS` dizisine kronolojik sırayla eklenir. Gövde yalnızca `{h, p}` blokları; tablo yerine `RichText` madde listesi (`\n- `) kullanılır.
- Pozisyon kısaltmalarına ek, harf harf okunuşa göre: `SB'de`, `SB'nin`, `CO'nun`, `BTN'de`, `BTN'nin` (sitedeki 125 `BTN'de/BTN'den` kullanımıyla tutarlı; 04'teki "BTN'un" önerisi uygulanmadı).
- Yüzdeye gelen ek elle yazılmaz: üreticide `pctWithSuffix` (`src/lib/trSuffix.ts`) kullanılır.
- Üreticide doğrulama ölçümleri ayrı bir üreteçle (`rndCheck`, tohum 777) yapılır; spot seçimi ana üreteçte kalır. Böylece bir bölümdeki doğrulama değişikliği diğer bölümlerin spotlarını değiştirmez.
- Aralık duyarlılığı cümlesi: senaryodaki equity eşiğe 1 puandan yakınsa "neredeyse eşit" denir, "şu doğru olurdu" denmez.
- Ara kartı masaüstünde masanın üstünde, masa `inert`; kısayol yalnızca sunuculu sürümde ve bölümde cevap varken görünür.
- Sınırda spot (fark < 3.5 puan) yalnızca kararı **aynı yöne** iten ek bir etken (ör. realization) varsa ve gerekçede açıkça yazılıysa eklenir (c34, c35). Testte fark ve oran ayrıca korunur.

## Tespit edilen hatalar

| # | Yer | Önem | Durum |
|---|---|---|---|
| Q-1 | 01 denetimi, t10: chip eşiği 29/81 (%35.8) verilmiş; doğrusu 29/61 (%47.5) | Orta | Düzeltildi (4) |
| Q-2 | 01 denetimi, c25: gereken equity %23.5 verilmiş; doğrusu %30.8 | Düşük | Düzeltildi (4) |
| O-1 | c17 iki kartlık oran | Orta | Kapandı (3) |
| O-2 | t10 ödül yapısı yok, "yarı yarıya" | Orta | Kapandı (4) |
| O-3 | c25 fiyat yazılmamış | Orta | Kapandı (4) |
| CS-1 | Callshove spotları aralığa duyarlı, gerekçe söylemiyor | Orta | Düzeltildi (6): 16 spot |
| CS-2 | Callshove 3,5 puan kuralı örnekleme hatasıyla ihlal | Orta | Düzeltildi (6): 4 spot çıkarıldı, testli |
| D-1…D-6 | c19, c20, c21, c27, t21, t22 | Düşük | Kapandı (3 ve 4) |
| CS-4 | "SB'un", "CO'un" | Düşük | Düzeltildi (6) |
| CS-5 | Ondalık ayırıcı tutarsız | Düşük | Düzeltildi (6) |
| Y-1 | Üretilen 326 gerekçede ve 122 notta yüzde eki sabit ("%12'inde", "%54'iyle", "%0'inde") | Düşük | Kapandı: üretilenler düzeltildi (6), elle yazılmışlar ve blog temiz çıktı, test hepsini kapsıyor (7) |
| T-1 | t23 turnuva spotunda ante yok | Düşük | Düzeltildi (8), aralık notu ve kesin sayım testiyle |
| T-2 | t13 "yarı yarıya": resteal aralığı yazılmamış | Düşük | Düzeltildi (8) |
| UX-1 | Ara kartı masaüstünde masanın yerini alıyor, koç kısayolu yok | Düşük | Düzeltildi (6), tarayıcıda doğrulandı |
| B-1 | Karışık stratejili spotlarda tek doğru cevap | Bilgi | Ürün kararı bekliyor |
| P-1 | Çalışma dalları varsayılan dala alınmıyor (8 çalışma) | Orta | Kapandı: PR #5–#9 |
| P-2 | `05x26x`, `ch8abk` yan dalları ana zincirle çakışıyor | Bilgi | Birleştirilmemeli |
| G-1 | `GET /api/attempts` 5000 kayıt sınırı: profil toplamı yanlış, "ilk görüş" eski kayıtları göremez | Düşük | Kısmen (8): toplam sunucudan, kesinti notu var |
| G-2 | Konu tablosu ve CSV/JSON dışa aktarma son 5000 cevapla sınırlı, söylemiyor | Düşük | Açık |
| G-3 | `POST /api/attempts` istemcinin `at` zamanını kabul ediyor (yalnızca kendi istatistiğini etkiler) | Bilgi | Bilinçli; sıralama özelliği eklenmeyeceği için risk yok |
| P-3 | "Cheers" yeniden markalaması | Bilgi | Kapandı: uygulandı |
| T5-1 | `t5-d4` kazanımı "aralık iyice genişler" ante'li modelde desteklenmiyor | Orta | Büyük ölçüde karşılandı (`ch8abk` t5-d4 3. paragraf); kalan metin notu T5-5 |
| T5-3 | `t5-d6` a4 (ve d3 3. paragraf): 10 BB SB 54s "fold"; modelde ante 1 ile +0,87, ante'siz +0,25 BB | Orta | Açık (10), `ch8abk` |
| T5-4 | `t5-d6` a7: 15 BB SB 52o "fold", senaryo ante 1 BB; modelde +0,38 (ante'siz −0,19) | Orta | Açık (10) |
| T5-5 | `t5-d4` "daha çok el kârlı", "10 BB'de itilen her el 6 BB'de de itilir" genellemesi | Düşük | Açık (10) |
| T5-6 | Çok oyunculu "fold" cevapları ante'siz aralığa dayanıyor | Düşük | Doğrulanamadı (10) |
| T6-1 | `t6-d5` a11: BTN karar verirken "SB fold etti" (konuşma sırası imkânsız) | Yüksek | Açık (10) |
| T6-2 | `t6-d3` 3. paragraf: "JTs çiftlerden düşük equity" kendi sayılarıyla çelişiyor | Orta | Açık (10) |
| T6-3…T6-8 | 88 "eşiğe yaklaşır", güvenlik payı kural gibi, "Nash tabloları ICM katmaz" genellemesi, 3-bet/stack oranı, tanımsız "bu spot", kapsama varsayımı yazılmamış | Düşük/Bilgi | Açık (10) |
| T5-2 | `ranges.json` push aralıkları ante'siz; turnuva pisti BB ante 1 BB | Düşük | Açık, devredildi |
| S-1 | Sözlükte "Risk primi" kimliği `stall` (`glossary.ts:208`) | Düşük | Açık, devredildi |
| K-C1, K-G1, K-G2 | Koç penceresi 360x640'ta kartları ve 18+ satırını örtüyor; statik `/gizlilik` yapay zeka anlatıyor; pasif butonda odak BODY'ye düşüyor | Orta | `ch8abk`'de düzeltilmiş (`0e5a515`); birleşince kapanır |

## Doğrulanamayan konular

- t5 (9): Nash push/fold tablo yüzdeleri; 15 BB'de push/açılış sınırı; çok oyunculu push'larda arkadaki oyuncuların call aralıkları. `ranges.json` push aralıkları Nash değil, ante içermiyor.
- c36'daki butonun call aralığı (CO aralığı − AA–JJ, AK, AQs) bir varsayım.
- Solver karşılaştırması yapılamadı (c09, c23, c24, c25, c34, c35, c39'daki karışık strateji yorumları; postflop range avantajı iddiaları).
- t07, t09 ödül yapısı yok.
- t13 ve t23'teki rakip aralıkları (8) ekip tahmini; gerçek oyuncu havuzunu temsil ettiği doğrulanamadı. t23'te implied odds ve river oyunu hesaba katılmadı.
- Push aralıklarının Nash tablolarına yakınlığı bilinmiyor.
- CS-1'deki dar/geniş senaryo oranları (%60, %150) keyfi; gerçek oyuncu sapmasını temsil ettiği doğrulanamadı.
- Set mining "15–20 kat" kuralının kaynağı.
- Dunlosky ve ark. 2013 ile Kluger–DeNisi 1996 atıfları (10 numaralı spesifikasyon) hafızadan; kaynak açılıp doğrulanmadı.
- Davranış önerilerindeki süreler (20–30 dk bölüm, 25 dk ara, günde 60–90 dk) genel öğrenme literatüründen; poker eğitimine özgü kanıt yok.

## Atlanan roller

- **10. çalışma:** Data Analyst (veri yok), Davranış Bilimleri (yeni mekanik yok), Poker Eğitim ve Content (yeni içerik yerine yazılmış içeriğin denetimi), UI/UX, Frontend, Backend (geçici kural).
- **9. çalışma:** Data Analyst (veri yok), Davranış Bilimleri (yeni mekanik yok), Content (ünite paketi öncelikli), UI/UX, Frontend, Backend (yeni ekran yok; geçici kural).
- **Data Analyst** (1–8): kullanıcı verisi yok. Uydurma veriyle analiz yapılmaz.
- **Davranış Bilimleri** (2–6): yeni mekanik önerilmedi. 7'de gelişim kartı için çalıştı.
- **Backend** (2–6): sunucu değişikliği gerekmedi. 7'de değerlendirdi: yeni uç nokta gerekmiyor.
- **Poker Eğitim, Content** (7, 8): B-1 kararı gelmeden yeni içerik eklenmedi.
- **UI/UX, Davranış Bilimleri** (8): yeni ekran ya da mekanik yok; Gelişim kartına yalnızca bilgi notu eklendi.

## Sonraki öncelikler

0. **Her çalışmanın ilk adımı:** `git fetch` + her uzak dalın son commit tarihi (`for b in $(git branch -r); do git log -1 --format='%ci %h' $b; done | sort`). Varsayılan dalda olmayan içerik dalı var mı bak; 9. çalışma `ch8abk`'yi gözden kaçırdı.
1. **Claude Code / Onay Ajanı:** `ch8abk` için kapı K: önce T6-1, T6-2, T5-3, T5-4 düzeltmeleri (raporlar 03, 04); sonra dal varsayılana alınsın.
2. **Claude Code:** T5-2 (ante'li push aralıkları), S-1 (`stall` kimliği), ardından c11 (Turn) ve kalan üniteler.
3. **CEO çalışması:** c9–c10 örneklem denetimi (`ch8abk` üzerinde) ya da c11 için içerik öncesi doğruluk paketi.
4. Geçici kural kalktığında: G-2, B-1 (`acceptable`) ve c39.

**Yerel PostgreSQL ile deneme (8'de çalıştı):** `initdb` ile `/var/lib/postgresql/<dizin>` (scratchpad'e postgres kullanıcısı erişemiyor), `pg_ctl -o '-k /tmp -p 5432' start`, `createdb pokerdefteri`, `.env.local`'a `DATABASE_URL`, `npm run db:migrate`, `npm run build && npm start`. İş bitince `.env.local` silinmeli.

## Agent sorumlulukları

Poker Uzmanı: doğruluk ve varsayımlar, sayılar `replay` ile · Poker Eğitim: quiz, spot, konu notları · Data Analyst: yalnızca gerçek veriyle · Davranış Bilimleri: yük ve motivasyon, kanıt düzeyiyle · Content: makale · UI/UX → Frontend → Backend: spesifikasyon ve uygulama (bu rutin Claude Code olduğu için kod da burada yazılabilir) · QA: test planı, regresyon testi, önceki raporların sayılarını da kontrol · CEO: önceliklendirme, kalite kontrolü, hafıza.

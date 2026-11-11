# Proje hafızası — Poker Defteri AI ekibi

Zamanlanmış "CEO Agent" çalışmalarının ortak hafızası. Her çalışma önce bu dosyayı okur, sonunda günceller. Ürünün teknik dokümantasyonu `README.md`'de. Çalışma çıktıları `docs/ekip/<tarih>/`, analiz betikleri `docs/ekip/arac/`, spot denetimleri `docs/denetim/` altında.

Son güncelleme: **2026-11-11, 8. çalışma**

## Kullanıcıdan beklenenler (önemli)

1. **Dallar birleştirilmeli (hâlâ açık, 8. çalışmada da hatırlatıldı).** Varsayılan dal `claude/charming-davinci-emhvz1` hâlâ `2b7d6b5`'te. Her çalışma oradan başlıyor. Zincir: `wcrqqc` (4) → `vrsaxz` (5) → `9evl2r` (6) → `p01f35` (7) → **`claude/wizardly-meitner-obr3cs` (8, en güncel dal)**. Her dal bir öncekinin bütün commit'lerini içeriyor; yalnızca en günceli birleştirmek yeterli. `05x26x` yan dalını **birleştirme** (P-2).
   - **P-3 (8):** `ch8abk` dalının son commit'i `ab8a72b` siteyi **"Cheers"** olarak yeniden markalıyor (logo, renk, font). Bu zincirde yok. İsteniyorsa kullanıcı karar vermeli; uygulama yolu `git cherry-pick ab8a72b` (CSS/layout çakışması beklenir). Ekip markayı kendi başına değiştirmez. Bir sonraki çalışma, dalı yoksa önce `git branch -r` ile en yeni `HAFIZA.md`'yi taşıyan dalı bulmalı (`git log -1 <dal>`) ve kendi dalını onun üzerine kurmalı (`git checkout -B <kendi dalı> origin/<en yeni dal>`).
2. **Görev metnindeki `[HAFIZA_DOSYASI_ADI]` doldurulmalı** (8. çalışmada hâlâ yer tutucuydu). Öneri: `HAFIZA.md` (depo kökü).
3. Yayın ortamı ve gerçek `ANTHROPIC_API_KEY` ile asistan testi (README Aşama 1, adım 10).
4. Kullanıcı verisi (VPIP/PFR/3-Bet ya da alıştırma geçmişi dökümü). Gelmezse Data Analyst çalışmaz.

## Mevcut durum

- Next.js 16 + React 19 + PostgreSQL + Claude API. Türkçe Texas Hold'em çalışma sitesi, gerçek parayla oyun yok, 18+.
- 577 spot (59 elle yazılmış + 518 üretilmiş; `callshove` 122), 138 sözlük terimi, 8 blog yazısı.
- `/profil`'de **Gelişim** kartı (7); 8'de gerçek PostgreSQL ile üye yolu denendi, sayılar SQL ile birebir. Üyede "Çözülen soru/Doğruluk" sunucu toplamından (5000 sınırından etkilenmez): kayan 7 günlük pencerelerle 8 haftalık eğilim, pozisyona göre doğruluk (oyun tipi filtresi), ilk görüş / tekrar ayrımı; 10 cevaptan azında oran yok.
- Sağlık (8. çalışma): `npm test` **629/629**, `npm run typecheck` temiz, `npm run build` temiz. `npm run ranges` tekrarlanabilir (aynı tohumla bayt bayt aynı çıktı).
- Alıştırma masasında `Seri` sayacı yok; engellemeyen ara kartı var (varsayılan 20 elde bir ya da 25 dakikada bir, ayarlanabilir). Masaüstünde soluk masanın üstünde, koç panelinde "Bu bölümü yorumla" kısayoluyla; mobilde masanın yerinde. Tarayıcıda doğrulandı (6).
- Görünen bütün spot metinlerinde ondalık ayırıcı virgül; yüzde ekleri `src/lib/trSuffix.ts` ile üretiliyor.

## Tamamlananlar

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

1. **G-2:** konu tablosu, çalışma önerisi ve CSV/JSON dışa aktarma hâlâ son 5000 cevapla sınırlı ve bunu söylemiyor. Dışa aktarma için sayfalı uç nokta önerildi (KVKK veri taşınabilirliği).
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
| P-1 | Çalışma dalları varsayılan dala alınmıyor (8 çalışma) | Orta | Açık — kullanıcı aksiyonu gerekiyor |
| P-2 | `05x26x`, `ch8abk` yan dalları ana zincirle çakışıyor | Bilgi | Birleştirilmemeli |
| G-1 | `GET /api/attempts` 5000 kayıt sınırı: profil toplamı yanlış, "ilk görüş" eski kayıtları göremez | Düşük | Kısmen (8): toplam sunucudan, kesinti notu var |
| G-2 | Konu tablosu ve CSV/JSON dışa aktarma son 5000 cevapla sınırlı, söylemiyor | Düşük | Açık |
| G-3 | `POST /api/attempts` istemcinin `at` zamanını kabul ediyor (yalnızca kendi istatistiğini etkiler) | Bilgi | Bilinçli; sıralama özelliği eklenmeyeceği için risk yok |
| P-3 | "Cheers" yeniden markalaması (`ch8abk`/`ab8a72b`) ana zincirde yok | Bilgi | Kullanıcı kararı |

## Doğrulanamayan konular

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

- **Data Analyst** (1–8): kullanıcı verisi yok. Uydurma veriyle analiz yapılmaz.
- **Davranış Bilimleri** (2–6): yeni mekanik önerilmedi. 7'de gelişim kartı için çalıştı.
- **Backend** (2–6): sunucu değişikliği gerekmedi. 7'de değerlendirdi: yeni uç nokta gerekmiyor.
- **Poker Eğitim, Content** (7, 8): B-1 kararı gelmeden yeni içerik eklenmedi.
- **UI/UX, Davranış Bilimleri** (8): yeni ekran ya da mekanik yok; Gelişim kartına yalnızca bilgi notu eklendi.

## Sonraki öncelikler

1. **Dal durumu kontrolü (P-1, P-3).** `claude/wizardly-meitner-obr3cs` ana dala alınmadıysa bu daldan devam et (`git checkout -B <kendi dalı> origin/claude/wizardly-meitner-obr3cs`). Kullanıcı "Cheers" markasını seçtiyse önce onu uygula.
2. **G-2:** sayfalı tam dışa aktarma uç noktası (`GET /api/attempts/export`, yalnızca oturumdaki kullanıcı) ve konu tablosuna kesinti notu. Backend + Frontend + QA.
3. **ICM hesap makinesinde stack 0** (açık iş 8) ve "Blind savunması" filtresinin tarayıcı kontrolü (açık iş 6): küçük QA işleri.
4. B-1 ürün kararı gelirse `acceptable` alanı + c39. CS-3 ICM varyantı bunlardan sonra.

**Yerel PostgreSQL ile deneme (8'de çalıştı):** `initdb` ile `/var/lib/postgresql/<dizin>` (scratchpad'e postgres kullanıcısı erişemiyor), `pg_ctl -o '-k /tmp -p 5432' start`, `createdb pokerdefteri`, `.env.local`'a `DATABASE_URL`, `npm run db:migrate`, `npm run build && npm start`. İş bitince `.env.local` silinmeli.

## Agent sorumlulukları

Poker Uzmanı: doğruluk ve varsayımlar, sayılar `replay` ile · Poker Eğitim: quiz, spot, konu notları · Data Analyst: yalnızca gerçek veriyle · Davranış Bilimleri: yük ve motivasyon, kanıt düzeyiyle · Content: makale · UI/UX → Frontend → Backend: spesifikasyon ve uygulama (bu rutin Claude Code olduğu için kod da burada yazılabilir) · QA: test planı, regresyon testi, önceki raporların sayılarını da kontrol · CEO: önceliklendirme, kalite kontrolü, hafıza.

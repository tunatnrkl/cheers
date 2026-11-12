# Proje hafızası — Cheers AI ekibi

Zamanlanmış "CEO Agent" çalışmalarının ortak hafızası. Her çalışma önce bu dosyayı okur, sonunda günceller. Ürünün teknik dokümantasyonu `README.md`'de. Çalışma çıktıları `docs/ekip/<tarih>/`, analiz betikleri `docs/ekip/arac/`, spot denetimleri `docs/denetim/` altında.

Son güncelleme: **2026-11-12, 12. çalışma**

## Kullanıcıdan beklenenler (önemli)

1. **Dal akışı:** varsayılan dal `claude/charming-davinci-emhvz1` 1–8. çalışmaları içeriyor (PR #1, #2). 9 (`g2abma`), 10 (`syhmqe`) ve 11 (`h0lmvh`) birleştirilmedi; 12. çalışma onların üzerine kuruldu: **`claude/wizardly-meitner-iawfi2` (en güncel dal, 9–12'yi içerir)**. Yalnızca bunu birleştirmek yeterli. Sonraki çalışma önce `git branch -r --sort=-committerdate | head` ile en yeni dalı bulmalı, `HAFIZA.md`'deki "Son güncelleme" satırına bakmalı ve kendi dalını en yeni hafızayı taşıyan dalın üzerine kurmalı (`git checkout -B <kendi dalı> origin/<o dal>`).
2. **Görev metnindeki `[HAFIZA_DOSYASI_ADI]` doldurulmalı** (12'de hâlâ yer tutucu). Öneri: `HAFIZA.md` (depo kökü).
3. Yayın ortamı ve gerçek `ANTHROPIC_API_KEY` ile asistan testi (README Aşama 1, adım 10).
4. Kullanıcı verisi (VPIP/PFR/3-Bet ya da alıştırma geçmişi dökümü). Gelmezse Data Analyst çalışmaz.
5. **B-1 ürün kararı** (`acceptable` alanı): poker içerik işlerinin (c39, sınırda spotlar) tek engeli.
6. **P-4 (9):** `admiring-babbage-*` adlı 35 el ekleme dalı (başka bir rutin) ana dalda değil; commit mesajlarına göre aynı spot kimlik aralıklarını kullanıyorlar. Birleştirilecekse önce kimlik çakışması ve sayısal denetim gerekir; ekip bunlara dokunmadı.

## Mevcut durum

- Next.js 16 + React 19 + PostgreSQL + Claude API. Türkçe Texas Hold'em çalışma sitesi, gerçek parayla oyun yok, 18+.
- 583 spot (65 elle yazılmış + 518 üretilmiş; `callshove` 122, `icm` 12), 138 sözlük terimi, 9 blog yazısı, **4 quiz / 26 soru** (`/quiz`, 12).
- `/profil`'de **Gelişim** kartı (7); 8'de gerçek PostgreSQL ile üye yolu denendi, sayılar SQL ile birebir. Üyede "Çözülen soru/Doğruluk" sunucu toplamından (5000 sınırından etkilenmez): kayan 7 günlük pencerelerle 8 haftalık eğilim, pozisyona göre doğruluk (oyun tipi filtresi), ilk görüş / tekrar ayrımı; 10 cevaptan azında oran yok.
- Marka: **Cheers** (PR #2 ile ana dalda). 13 sayfa birleştirme sonrası tarandı (9): eski ad yok, 390 px'te taşma yok.
- Sağlık (12. çalışma): `npm test` **679/679**, `npm run typecheck` temiz, `npm run build` temiz. `npm run ranges` tekrarlanabilir (aynı tohumla bayt bayt aynı çıktı).
- Profil (9): konu tablosu ve çalışma önerisi üyede sunucunun konu toplamlarından; CSV/JSON dökümü `GET /api/attempts/export` ile bütün kayıtlar (12.345 kayıtla PostgreSQL'de doğrulandı). Yalnızca Gelişim kartı son 5000 cevapla sınırlı ve bunu söylüyor.
- Alıştırma masasında `Seri` sayacı yok; engellemeyen ara kartı var (varsayılan 20 elde bir ya da 25 dakikada bir, ayarlanabilir). Masaüstünde soluk masanın üstünde, koç panelinde "Bu bölümü yorumla" kısayoluyla; mobilde masanın yerinde. Tarayıcıda doğrulandı (6).
- ICM hesap makinesi (10): `5.000` binlik, `%50` yüzde okunuyor; atılan ve 9'u aşan girişler arayüzde söyleniyor (`icmInput.ts`, testli).
- Görünen bütün spot metinlerinde ondalık ayırıcı virgül; yüzde ekleri `src/lib/trSuffix.ts` ile üretiliyor.

## Tamamlananlar

### 12. çalışma — rapor: [`docs/ekip/2026-11-12/16-calisma-12-kapanis.md`](docs/ekip/2026-11-12/16-calisma-12-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| Quiz bileşeni: `src/data/quizzes.ts`, `/quiz`, `/quiz/[slug]`, `Quiz.tsx`; `/ogren` "Tekrar" grubu, blog yazısından "Quiz ile tekrarla", sitemap, Nav | UI/UX, Frontend | ✅ |
| Davranış değerlendirmesi (geri getirme pratiği, ayrıntılı geri bildirim; puan/süre/seri/kayıt yok), kanıt düzeyiyle | Davranış Bilimleri | ✅ (atıflar doğrulanamadı) |
| 02, 05, 10, 11 raporlarındaki 26 soru yayında; açık uçlular çoktan seçmeliye çevrildi, ondalıklar virgül | Poker Eğitim | ✅ |
| `quizzes.test.ts` (19 test): fiyat, SPR, kombinatorik, ICM (`ib01`), equity (72o %29,5, T8s %41,1, K4o %41,1, J4o/UTG %28,9) | Poker Uzmanı, QA | ✅ |
| Q-4: c35 gerekçesi realization %93 → %94, testli | Poker Uzmanı, QA | ✅ |
| Playwright 390/1366 px: 4 quiz, taşma 0, konsol 0, odak, klavye, sıfırlama; A-1 (harf ekran okuyucudan gizli) düzeltildi | QA | ✅ (gerçek ekran okuyucu, açık tema, Pages `basePath` denenmedi) |

### 11. çalışma — rapor: [`docs/ekip/2026-11-12/15-calisma-11-kapanis.md`](docs/ekip/2026-11-12/15-calisma-11-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| CS-3 push tarafı: betik `docs/ekip/arac/icm-push.mts` (push EV, BB'nin ICM'e göre call aralığı, chip senaryosu); 3 SB push/fold spotu `ip01` (8 BB K6o, all-in), `ip02` (12 BB KJo, 4 BB'lik stack varken fold), `ip03` (chip lideri T9s, all-in); 3 regresyon testi | Poker Uzmanı, QA | ✅ |
| Blog: `bubble-push-fold-icm` (9. yazı), call ve push tarafını birleştiriyor | Content | ✅ |
| 5 soruluk push/fold quiz'i (raporda) | Poker Eğitim | ✅ (12'de `/quiz`'de yayında) |
| Tarayıcı: 3 spot, "ICM ve bubble (12)" filtresi, yazı; 390/1366 px, taşma ve konsol hatası yok | QA | ✅ |

### 10. çalışma — rapor: [`docs/ekip/2026-11-11/14-calisma-10-kapanis.md`](docs/ekip/2026-11-11/14-calisma-10-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| CS-3: 3 bubble call/fold spotu `ib01` (A3o, fold), `ib02` (KQo, fold), `ib03` (chip lideri A7s, call); ödül yapısı ve aralık notta; ICM eşikleri %51,5 / %56,4 / %45,0; betik `docs/ekip/arac/icm-callfold.mts`; 3 regresyon testi (eşik, fark, duyarlılık iddiaları) | Poker Uzmanı, QA | ✅ |
| 6 soruluk ICM call/fold quiz'i (raporda) | Poker Eğitim | ✅ (12'de `/quiz`'de yayında) |
| ICM girişi: `parseIcmList` + 8 test; I-2 (`5.000` → 5), I-3 (`%50` atılıyordu), I-4 (9 üstü sessiz kesme) düzeltildi; Playwright 390/1366 px | Frontend, QA | ✅ |
| Alıştırma masasında "ICM ve bubble (9)" filtresi ve `ib01`/`ib03` tarayıcıda açıldı | QA | ✅ |

### 9. çalışma — rapor: [`docs/ekip/2026-11-11/13-calisma-9-kapanis.md`](docs/ekip/2026-11-11/13-calisma-9-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| G-2: `GET /api/attempts` konu toplamları; `GET /api/attempts/export` imleçli tam döküm; `progressData.ts` + 9 birim testi; indirme düğmelerinde yükleniyor/hata durumu; PostgreSQL ile 12.345 kayıt, iki kullanıcı, 390/1366 px | Backend, Frontend, QA | ✅ |
| E-1: döküm sorgusunda `ORDER BY` takma ad (metin) sıralıyordu, 899 kayıt atlanıyordu; bulundu, düzeltildi, yeniden ölçüldü | QA, Backend | ✅ |
| Birleştirme sonrası QA: 13 sayfa, marka, mobil taşma, konsol; eski marka kalıntıları (dosya adı, şema yorumu) temizlendi | QA | ✅ |
| Açık iş 6 (Blind savunması filtresi 6 spot) ve 8 (ICM'de stack 0 uyarısı) | QA, Frontend | ✅ |

### 8. çalışma — rapor: [`docs/ekip/2026-11-11/12-calisma-8-kapanis.md`](docs/ekip/2026-11-11/12-calisma-8-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| t13: SB resteal aralığı `note`'ta (22+, A2s+, A8o+, KTs+, KQo, QJs); 88 ≈ %55, dar aralıkta ≈ %48, gereken %39,3; test | Poker Uzmanı, QA | ✅ |
| t23 (T-1): `ante: 1`, pot 13,9, all-in 24,8; CO ikinci bahis aralığı `note`'ta; river kesin sayımıyla KT ≈ %56, gereken %22,3; test | Poker Uzmanı, QA | ✅ |
| Gelişim kartı üye yolu: kayıt → cevap → `/profil`, Playwright 390/1366 px, SQL ile çapraz kontrol | QA | ✅ |
| G-1: `GET /api/attempts` `totals` döndürüyor; profil toplamı ondan; Gelişim kartında kesinti notu; 6075 kayıtla denendi | Backend, Frontend, QA | ✅ (G-2 9. çalışmada kapandı) |

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

1. **c39 (value raise):** tek bekleyen spot taslağı; B-1'e bağlı. `value` konusu hâlâ 3 spot.
2. **`acceptable?: number[]` alanı** (B-1): c09, c23, c24, c35 (sınırda) ve c39. Ürün kararı da gerekiyor.
3. **CS-3 devamı:** call (10) ve SB push (11) tarafı 3'er spotla yapıldı. Final masası ödül sıçramaları için ICM'li spot yok; push tarafında yalnızca SB → BB (iki oyunculu karar) modellendi, arkasında birden fazla oyuncu olan push (ör. CO/BTN'den) yok. Quiz'ler 12. çalışmada `/quiz`'de yayına alındı.
4. "Bu bölümü yorumla" yanıtının içeriği gerçek API anahtarıyla denenmedi.
5. **G-4 (9):** Gelişim kartı son 5000 cevapla hesaplanıyor (G-1 kararı gereği, not gösteriliyor). Gerçek kullanım verisi gelmeden değiştirilmeyecek.

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
- **G-2 kararı (9):** tam döküm `GET /api/attempts/export?before=<id>`; sayfa 5000, `id` azalan (`at` istemciden gelebildiği için tarih sıralaması istemcide). `user_id` yalnızca oturumdan. İmleç 1–18 hane. İstemci `collectPages` imleç ilerlemezse ya da 200 sayfa aşılırsa hata verir; yarım dosya indirilmez. Konu tablosu sunucu `GROUP BY topic` toplamından.
- **Uç nokta değişikliğinde gerçek PostgreSQL denemesi zorunlu (9):** E-1 birim testle yakalanamazdı. SQL'de çıktı takma adıyla aynı adlı sütunu sıralarken tablo adı yazılır.
- **ICM spotlarında (10):** eşik = (Fold − Kayıp) / (Kazanç − Kayıp), ödül havuzu yüzdesiyle; stack'ler `replay`'den, ante ölü para; rakibin all-in'i kahramanın stack'inden büyük olmamalı (iade modellenmiyor, test bunu denetliyor). Cevap ICM eşiğine 3,5 puandan uzak olmalı; gerekçedeki duyarlılık iddiaları testte ayrıca ölçülür. Her ICM paketinde en az bir "ICM'e rağmen call" spotu olur ("bubble'da her şey fold" genellemesine karşı).
- **ICM push spotlarında (11):** push EV = (1 − c) × Ç + c × [eq × K + (1 − eq) × L]; c kesin kombinasyon sayımı (kahramanın kartları çıkarılır). BB'nin call aralığı, SB'nin referans push aralığına karşı BB'nin **kendi ICM eşiğini** geçen ellerden türetilir ve `note`'ta açıkça yazılır; ayrıca BB'nin ICM'i yok sayıp **chip eşiğiyle** call ettiği daha geniş senaryo ölçülür. İki senaryoda cevap aynı değilse spot eklenmez. Push spotu yalnızca "Fold / All-in" seçenekli; küçük raise modellenmediyse notta yazılır.
- **Yeni elle yazılmış spot kimlikleri (10):** `admiring-babbage-*` dalları `t27`–`t30` kullandığı için yeni spotlar konu önekli kimlik alır (`ib01`…). Sayısal `t`/`c` sırası bu dallar çözülene kadar kullanılmaz.
- **`localStorage` anahtarları (`pd-cevaplar`, `pd-kayitli`, `pd:rhythm`) marka değişse de değiştirilmez:** değiştirmek misafir ilerlemesini siler.
- **Quiz kararı (12):** puan, toplam doğru sayısı, süre, seri ve kayıt yok; cevaplar yalnızca sayfa belleğinde (ne `localStorage` ne sunucu). Seçimden sonra doğru cevap metinle de işaretlenir, düğmeler `aria-disabled` (odak kaybolmasın). Her quiz 5–10 soru; her sayı `quizzes.test.ts`'te yeniden hesaplanır; spot bağlantısı (`spot`) varsa soruyla aynı sayıları kullanmalı. Yeni quiz `QUIZZES` dizisine eklenir; ilk `posts` girdisi blog yazısındaki "Quiz ile tekrarla" düğmesini belirler.
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
| P-1 | Çalışma dalları varsayılan dala alınmıyor (8 çalışma) | Orta | Kapandı (9): PR #1 ve #2 birleştirildi |
| P-2 | `05x26x`, `ch8abk` yan dalları ana zincirle çakışıyor | Bilgi | Birleştirilmemeli |
| G-1 | `GET /api/attempts` 5000 kayıt sınırı: profil toplamı yanlış, "ilk görüş" eski kayıtları göremez | Düşük | Kısmen (8): toplam sunucudan, kesinti notu var |
| G-2 | Konu tablosu ve CSV/JSON dışa aktarma son 5000 cevapla sınırlı, söylemiyor | Düşük | Düzeltildi (9), PostgreSQL ile 12.345 kayıtta doğrulandı |
| E-1 | G-2'nin ilk sürümünde `ORDER BY id` takma adı (metin) sıraladı; dökümde 899 kayıt atlandı | Orta | Yayından önce bulundu ve düzeltildi (9) |
| I-1 | ICM hesap makinesi 0 stack'i sessizce atıyor, oyuncu numaraları kayıyor | Düşük | Düzeltildi (9): uyarı notu |
| G-4 | Gelişim kartı son 5000 cevapla sınırlı | Bilgi | Bilinçli (G-1 kararı), not gösteriliyor |
| P-4 | `admiring-babbage-*` el dalları ana dalda değil, kimlik aralıkları çakışabilir | Bilgi | Kullanıcı kararı |
| G-3 | `POST /api/attempts` istemcinin `at` zamanını kabul ediyor (yalnızca kendi istatistiğini etkiler) | Bilgi | Bilinçli; sıralama özelliği eklenmeyeceği için risk yok |
| I-2 | ICM hesap makinesi `5.000`'i 5 okuyordu | Orta | Düzeltildi (10), testli |
| I-3 | ICM ödül alanında `%50` atılıyordu | Orta | Düzeltildi (10), testli |
| I-4 | ICM'de 9 üstü giriş ve ödüllerdeki geçersiz giriş sessizce atılıyordu | Düşük | Düzeltildi (10) |
| Q-3 | ip01 gerekçe taslağı "ICM baskısı BB'yi sıkıştırır" diyordu; BB'nin ICM eşiği chip eşiğinden yalnızca 3 puan yüksek | Düşük | Yayından önce düzeltildi (11), testli |
| Q-4 | c35 gerekçesi: J4o için gereken realization %93 yazıyordu; 150.000 denemeyle 27,27 / 28,9 ≈ %94 | Düşük | Düzeltildi (12), testli |
| A-1 | Quiz seçenek harfi ekran okuyucudan gizliydi, geri bildirim "Doğru cevap B" diyordu | Düşük | Yayından önce düzeltildi (12) |
| P-3 | "Cheers" yeniden markalaması (`ch8abk`/`ab8a72b`) ana zincirde yok | Bilgi | Kapandı (9): kullanıcı birleştirdi |

## Doğrulanamayan konular

- c36'daki butonun call aralığı (CO aralığı − AA–JJ, AK, AQs) bir varsayım.
- Solver karşılaştırması yapılamadı (c09, c23, c24, c25, c34, c35, c39'daki karışık strateji yorumları; postflop range avantajı iddiaları).
- t07, t09 ödül yapısı yok.
- `ib01`–`ib03` (10): ödül yapısı (%50/%30/%20) ve rakip aralıkları varsayım; bubble'da gerçek oyuncuların referans aralıkla itip itmediği ve sonuçların bağımsız bir ICM aracıyla aynı çıkıp çıkmadığı doğrulanamadı. Gelecek el oyunu (future game simulation) hesaba katılmadı; yalnızca tek el ICM.
- `ip01`–`ip03` (11): ödül yapısı ve BB'nin call aralıkları varsayım. Gerçek oyuncuların ICM'e göre call edip etmediği bilinmiyor (bu yüzden chip senaryosu da ölçüldü). Tek el ICM, FGS yok; bağımsız ICM aracı ya da solver ile karşılaştırılmadı. `ip03`'ün geniş senaryodaki farkı yaklaşık 4,5 puan.
- t13 ve t23'teki rakip aralıkları (8) ekip tahmini; gerçek oyuncu havuzunu temsil ettiği doğrulanamadı. t23'te implied odds ve river oyunu hesaba katılmadı.
- Push aralıklarının Nash tablolarına yakınlığı bilinmiyor.
- CS-1'deki dar/geniş senaryo oranları (%60, %150) keyfi; gerçek oyuncu sapmasını temsil ettiği doğrulanamadı.
- Set mining "15–20 kat" kuralının kaynağı.
- Quiz davranış değerlendirmesindeki atıflar (Roediger ve Karpicke 2006, Dunlosky ve ark. 2013, Shute 2008) hafızadan; kaynak açılmadı (12). Quiz'in bu sitedeki öğrenmeye etkisi ölçülmedi.
- Dunlosky ve ark. 2013 ile Kluger–DeNisi 1996 atıfları (10 numaralı spesifikasyon) hafızadan; kaynak açılıp doğrulanmadı.
- Davranış önerilerindeki süreler (20–30 dk bölüm, 25 dk ara, günde 60–90 dk) genel öğrenme literatüründen; poker eğitimine özgü kanıt yok.

## Atlanan roller

- **Backend, Content, Data Analyst** (12): quiz verisi sunucuya gitmiyor; yeni yazı gerekmedi; veri yok.

- **Data Analyst** (1–11): kullanıcı verisi yok. Uydurma veriyle analiz yapılmaz.
- **Davranış Bilimleri** (2–6): yeni mekanik önerilmedi. 7'de gelişim kartı için çalıştı.
- **Backend** (2–6): sunucu değişikliği gerekmedi. 7'de değerlendirdi: yeni uç nokta gerekmiyor.
- **Poker Eğitim, Content** (7, 8): B-1 kararı gelmeden yeni içerik eklenmedi.
- **UI/UX, Davranış Bilimleri** (8, 9): yeni ekran ya da mekanik yok.
- **Poker Uzmanı, Poker Eğitim, Content** (9): B-1 kararı gelmeden yeni içerik yok; açık poker doğruluk işi yok.
- **Davranış Bilimleri, UI/UX, Frontend, Backend** (10, 11): yeni mekanik, ekran ya da uç nokta yok; yalnızca veri ve yazı eklendi.
- **Davranış Bilimleri, UI/UX, Backend, Content** (10): yeni mekanik, ekran ya da sunucu değişikliği yok; blog yazısı ICM paketi tamamlanınca.

## Sonraki öncelikler

1. **Dal kontrolü:** `iawfi2` ana dala alındı mı? Alınmadıysa onun üzerine kur (`git branch -r --sort=-committerdate | head`, sonra `HAFIZA.md` "Son güncelleme").
2. **B-1 kararı geldiyse:** `acceptable` alanı + c39 + sınırda spotlar. Gelmediyse: **quiz QA'sının eksikleri** (açık tema kontrastı, GitHub Pages `basePath` altında bağlantılar; küçük iş) ve **CS-3 son adımı**: final masası ödül sıçraması için 2 ICM spotu + 4–5 soruluk quiz (`icm-callfold.mts` / `icm-push.mts` yeniden kullanılabilir).
3. Quiz kapsamı: `odds`, `cbet`, `3bet` konularında quiz yok. Yeni quiz yalnızca var olan, testli spotlara dayanarak yazılmalı.
4. **P-4 (kullanıcı isterse):** `admiring-babbage-*` dallarının denetimi.

**Yerel PostgreSQL ile deneme (8 ve 9'da çalıştı):** `initdb` ile `/var/lib/postgresql/<dizin>` (scratchpad'e postgres kullanıcısı erişemiyor), `pg_ctl -o '-k /tmp -p 5432' start`, `createdb -h /tmp cheers`, `.env.local`'a `DATABASE_URL`, `npm run db:migrate`, `npm run build && npm start`. Sunucuyu yeniden başlatırken `pkill -f next-server` gerekir (`next start` alt süreci kalıyor; 9'da eski sürüm yanıt verdi). Toplu veri için `psql \copy`. İş bitince sunucu ve Postgres durdurulmalı, `.env.local` silinmeli.

## Agent sorumlulukları

Poker Uzmanı: doğruluk ve varsayımlar, sayılar `replay` ile · Poker Eğitim: quiz, spot, konu notları · Data Analyst: yalnızca gerçek veriyle · Davranış Bilimleri: yük ve motivasyon, kanıt düzeyiyle · Content: makale · UI/UX → Frontend → Backend: spesifikasyon ve uygulama (bu rutin Claude Code olduğu için kod da burada yazılabilir) · QA: test planı, regresyon testi, önceki raporların sayılarını da kontrol · CEO: önceliklendirme, kalite kontrolü, hafıza.

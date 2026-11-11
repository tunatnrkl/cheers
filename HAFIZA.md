# Proje hafızası — Poker Defteri AI ekibi

Zamanlanmış "CEO Agent" çalışmalarının ortak hafızası. Her çalışma önce bu dosyayı okur, sonunda günceller. Ürünün teknik dokümantasyonu `README.md`'de. Çalışma çıktıları `docs/ekip/<tarih>/`, analiz betikleri `docs/ekip/arac/`, spot denetimleri `docs/denetim/` altında.

Son güncelleme: **2026-11-11, 6. çalışma**

## Kullanıcıdan beklenenler (önemli)

1. **Dallar birleştirilmeli (hâlâ açık, 6. çalışmada da hatırlatıldı).** Varsayılan dal `claude/charming-davinci-emhvz1` hâlâ `2b7d6b5`'te. Her çalışma oradan başlıyor. Zincir: `wcrqqc` (4) → `vrsaxz` (5) → **`claude/wizardly-meitner-9evl2r` (6, en güncel dal)**. Her dal bir öncekinin bütün commit'lerini içeriyor; yalnızca en günceli birleştirmek yeterli. Bir sonraki çalışma, dalı yoksa önce `git branch -r` ile en yeni `HAFIZA.md`'yi taşıyan dalı bulmalı (`git log -1 <dal>`) ve kendi dalını onun üzerine kurmalı (`git checkout -B <kendi dalı> origin/<en yeni dal>`).
2. **Görev metnindeki `[HAFIZA_DOSYASI_ADI]` doldurulmalı.** Öneri: `HAFIZA.md` (depo kökü).
3. Yayın ortamı ve gerçek `ANTHROPIC_API_KEY` ile asistan testi (README Aşama 1, adım 10).
4. Kullanıcı verisi (VPIP/PFR/3-Bet ya da alıştırma geçmişi dökümü). Gelmezse Data Analyst çalışmaz.

## Mevcut durum

- Next.js 16 + React 19 + PostgreSQL + Claude API. Türkçe Texas Hold'em çalışma sitesi, gerçek parayla oyun yok, 18+.
- 577 spot (59 elle yazılmış + 518 üretilmiş; `callshove` 122), 138 sözlük terimi, 8 blog yazısı.
- Sağlık (6. çalışma): `npm test` **617/617**, `npm run typecheck` temiz, `npm run build` temiz. `npm run ranges` tekrarlanabilir (aynı tohumla bayt bayt aynı çıktı).
- Alıştırma masasında `Seri` sayacı yok; engellemeyen ara kartı var (varsayılan 20 elde bir ya da 25 dakikada bir, ayarlanabilir). Masaüstünde soluk masanın üstünde, koç panelinde "Bu bölümü yorumla" kısayoluyla; mobilde masanın yerinde. Tarayıcıda doğrulandı (6).
- Görünen bütün spot metinlerinde ondalık ayırıcı virgül; yüzde ekleri `src/lib/trSuffix.ts` ile üretiliyor.

## Tamamlananlar

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

1. **Elle yazılmış spotlarda yüzde ekleri** (Y-1'in devamı): `text.test.ts`'teki ek testi şimdilik yalnızca üretilen spotlara bakıyor. Elle yazılmış metinler taranıp test bütün spotlara genişletilmeli.
2. **c39 (value raise):** tek bekleyen spot taslağı; B-1'e bağlı. `value` konusu hâlâ 3 spot.
3. **`acceptable?: number[]` alanı** (B-1): c09, c23, c24, c35 (sınırda) ve c39. Ürün kararı da gerekiyor.
4. **CS-3:** ICM'li call/fold varyantı için 8 ellik karşılaştırma seti hazır (04 raporu); henüz spot yok.
5. "Bu bölümü yorumla" yanıtının içeriği gerçek API anahtarıyla denenmedi.
6. Alıştırma masasında "Blind savunması" filtresinin 6 el gösterdiği tarayıcıda denenmedi.
7. t23 turnuva spotunda ante yok; t13 "88 yarı yarıya" iddiası için resteal aralığı yok.
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
| Y-1 | Üretilen 326 gerekçede ve 122 notta yüzde eki sabit ("%12'inde", "%54'iyle", "%0'inde") | Düşük | Üretilenlerde düzeltildi (6); elle yazılmışlar taranmadı |
| T-1 | t23 turnuva spotunda ante yok | Düşük | Açık |
| UX-1 | Ara kartı masaüstünde masanın yerini alıyor, koç kısayolu yok | Düşük | Düzeltildi (6), tarayıcıda doğrulandı |
| B-1 | Karışık stratejili spotlarda tek doğru cevap | Bilgi | Ürün kararı bekliyor |
| P-1 | Çalışma dalları varsayılan dala alınmıyor (6 çalışma, 6 dal) | Orta | Açık — kullanıcı aksiyonu gerekiyor |

## Doğrulanamayan konular

- c36'daki butonun call aralığı (CO aralığı − AA–JJ, AK, AQs) bir varsayım.
- Solver karşılaştırması yapılamadı (c09, c23, c24, c25, c34, c35, c39'daki karışık strateji yorumları; postflop range avantajı iddiaları).
- t07, t09 ödül yapısı yok. t13 resteal aralığı yok.
- Push aralıklarının Nash tablolarına yakınlığı bilinmiyor.
- CS-1'deki dar/geniş senaryo oranları (%60, %150) keyfi; gerçek oyuncu sapmasını temsil ettiği doğrulanamadı.
- Set mining "15–20 kat" kuralının kaynağı.
- Davranış önerilerindeki süreler (20–30 dk bölüm, 25 dk ara, günde 60–90 dk) genel öğrenme literatüründen; poker eğitimine özgü kanıt yok.

## Atlanan roller

- **Data Analyst** (1–6): kullanıcı verisi yok. Uydurma veriyle analiz yapılmaz.
- **Davranış Bilimleri** (2–6): yeni mekanik önerilmedi; 1. çalışmadaki spesifikasyon geçerli.
- **Backend** (2–6): sunucu değişikliği gerekmedi.

## Sonraki öncelikler

1. **Dal durumu kontrolü (P-1).** `claude/wizardly-meitner-9evl2r` ana dala alınmadıysa bu daldan devam et ve kullanıcıya yeniden hatırlat.
2. **Elle yazılmış spotlarda Türkçe ek taraması** (Y-1 devamı) ve ek testinin bütün spotlara genişletilmesi. Küçük, hızlı bir iş.
3. **Gelişmiş istatistikler (Aşama 3) spesifikasyonu:** pozisyon ve konu bazında zaman içinde eğilim (UI/UX → Frontend → Backend, en az yetki). Ödül döngüsü mekaniği olmadan; Davranış Bilimleri değerlendirmesiyle.
4. B-1 ürün kararı gelirse `acceptable` alanı + c39. CS-3 ICM varyantı bunlardan sonra.

## Agent sorumlulukları

Poker Uzmanı: doğruluk ve varsayımlar, sayılar `replay` ile · Poker Eğitim: quiz, spot, konu notları · Data Analyst: yalnızca gerçek veriyle · Davranış Bilimleri: yük ve motivasyon, kanıt düzeyiyle · Content: makale · UI/UX → Frontend → Backend: spesifikasyon ve uygulama (bu rutin Claude Code olduğu için kod da burada yazılabilir) · QA: test planı, regresyon testi, önceki raporların sayılarını da kontrol · CEO: önceliklendirme, kalite kontrolü, hafıza.

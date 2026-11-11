# 8. çalışma: t13/t23 aralık varsayımları, Gelişim kartının üye yolu ve G-1

**Tarih:** 2026-11-11 · **Dal:** `claude/wizardly-meitner-obr3cs` (7. çalışmanın dalı `p01f35` üzerine kuruldu)

## Başlangıç durumu

- Bu çalışmanın dalı (`obr3cs`) varsayılan dalla aynı yerdeydi (`2b7d6b5`) ve `HAFIZA.md` içermiyordu. Hafızadaki talimata göre en güncel dal bulundu (`p01f35`, 7. çalışma) ve dal onun üzerine kuruldu (`git checkout -B … origin/claude/wizardly-meitner-p01f35`).
- P-1 hâlâ açık: varsayılan dal 1–7. çalışmaların hiçbirini içermiyor.
- **Yeni gözlem (P-3):** `ch8abk` dalında 1. çalışmadan sonra iki commit daha var; sonuncusu (`ab8a72b`, 20:15) siteyi **"Poker Defteri" → "Cheers"** olarak yeniden markalıyor (logo, renkler, yazı tipleri). Bu, `p01f35` zincirinde yok. Yeniden markalama bir kullanıcı kararı gibi görünüyor (depo adı `cheers`); ekip bu kararı kendisi vermedi, kodu birleştirmedi. Kullanıcının seçmesi gerekiyor (bkz. "Kullanıcı kararı").
- Sağlık: `npm test` 627/627.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | T-1 (t23) ve t13 aralık varsayımı | İki turnuva spotunun gerekçesini doğrulanabilir hale getirmek | Rakip aralığı `note`'ta; sayılar `replay` ve kendi değerlendiricimizle ölçülmüş; cevap eşiğe 3,5 puandan uzak; regresyon testi | Poker Uzmanı, QA |
| 2 | Gelişim kartı üye yolu + G-1 | Kartı gerçek PostgreSQL ile denemek, 5000 kayıt sınırına karar vermek | Kayıt → cevap → `/profil` akışı tarayıcıda çalışıyor; sayılar SQL ile birebir; 5000 üstünde toplam doğru ve kullanıcı kesintiden haberdar | Backend, Frontend, QA |
| 3 | Dal durumu (P-1, P-3) | Kullanıcıyı bilgilendirmek | Hafızada ve bildirimde net talimat | CEO |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok; testteki 75 + 6000 cevap yapay, analiz edilmedi), **Poker Eğitim, Content, UI/UX, Davranış Bilimleri** (yeni içerik ya da mekanik gerekmedi; B-1 kararı hâlâ bekliyor).

## 1. t13 ve t23 (Poker Uzmanı, QA)

Varsayım: aşağıdaki aralıklar ekip tarafından seçilmiş tahminlerdir, **solver çıktısı değildir**. Equity'ler projenin değerlendiricisiyle ölçüldü.

### t13 — HJ 88, SB 14 BB resteal

- Fiyat (`replay`): 11,8 BB call, çekişilen pot 30 BB → gereken equity **%39,3**.
- Varsayılan resteal aralığı: 22+, A2s+, A8o+, KTs+, KQo, QJs (213 kombinasyon, yaklaşık %16). 88'in equity'si **≈ %55** (Monte Carlo, 200.000 deneme).
- Daha dar aralık (55+, A9s+, ATo+, KQs): **≈ %48**. Daha geniş (`ranges.json` SB 15 BB push aralığı): **≈ %59**.
- Sonuç: üç senaryoda da call, eşiğin en az 8,5 puan üzerinde. Eski "yarı yarıya" ifadesi kabaca doğruydu; artık hangi aralığa göre olduğu yazılı.
- Değişiklik: `note` eklendi, gerekçede sayılar ve dar aralık cümlesi.

### t23 — BB KdTd, Kc7h4s9s, CO turn'de 4 BB

- **T-1 düzeltildi:** spota `ante: 1` eklendi (diğer turnuva spotlarıyla tutarlı). Pot 12,9 → **13,9 BB**, all-in seçeneği 25,8 → **24,8 BB** (ante BB'nin stack'inden düşer).
- Gereken equity: 4 / 17,9 = **%22,3**.
- Varsayılan CO ikinci bahis aralığı: seni yenen eller (AK, KQ, KJ, K9s, 99, 77, 44, 97s), maça ve kent çekişleri (21 belirli kombinasyon), ıskalamış eller (AQ, AJs, ATs, QJs, QTs, JTs, A5s–A3s). River kartı **tek tek sayıldı** (tahmin yok): KT'nin equity'si **≈ %56**.
- Duyarlılık: seni yenen ellere karşı ≈ %6, geri kalana karşı ≈ %84. Seni yenen ellerin payı yaklaşık **%79'a** çıkana kadar call kârlı. Gerekçeye "dörtte üçünü geçmedikçe" diye yazıldı (temkinli yuvarlama).
- Sınırlama: implied odds ve river'daki oyun hesaba katılmadı; equity yalnızca showdown equity'si.

### Testler (`src/lib/poker/hands.test.ts`)

- `t13`: gereken equity 11,8/30; nottaki aralıkta %52–58; dar aralıkta eşiğin 3,5 puandan fazla üzerinde.
- `t23`: gereken equity 4/17,9; river kesin sayımıyla %54–58; "%75 seni yenen el" karışımında bile eşiğin üzerinde.

## 2. Gelişim kartı üye yolu ve G-1 (Backend, Frontend, QA)

### Deneme ortamı

Yerel PostgreSQL 16, `npm run db:migrate`, `npm run build && npm start`, Playwright (Chromium, 390 px ve 1366 px). Test hesabı `example.invalid` alan adında; deneme sonunda veritabanı durduruldu, `.env.local` silindi.

### Sonuçlar

| # | Kontrol | Beklenen | Sonuç |
|---|---|---|---|
| U-1 | `POST /api/auth/register` (18+ onayıyla) | 200, oturum çerezi | ✅ |
| U-2 | `POST /api/attempts`, 3 haftaya yayılmış 75 cevap | `saved: 75` | ✅ |
| U-3 | `/profil` Gelişim kartı haftalık oranları | SQL ile aynı | ✅ 19/25, 20/25, 17/25 — `GROUP BY` sorgusuyla birebir |
| U-4 | İlk görüş + tekrar toplamı | 75 cevap, 56 doğru | ✅ 39 + 36; 27 + 29 |
| U-5 | Pozisyon toplamı | 75 | ✅ 4+2+13+24+6+26 |
| U-6 | 10'dan az cevaplı pozisyonda oran yok | "az veri" | ✅ UTG, HJ, SB |
| U-7 | Konsol hatası | Yok | ✅ |
| G-1a | 6000 eski cevap eklenince "Çözülen soru" | 6075 | ❌ önce 5000 → ✅ düzeltmeden sonra 6075 |
| G-1b | Gelişim kartı kesintiyi söylüyor | Not görünür | ✅ "son 5.000 cevabına göre (toplam 6.075)" |

### G-1 kararı ve uygulama

Karar: istatistik sorgusunu tamamen sunucuya taşımak yerine **toplamı sunucudan almak ve kesintiyi açıkça yazmak.** Gerekçe: 5000'den fazla cevabı olan kullanıcı şu an yok; tam sunucu özeti `stats.ts` mantığını SQL'de ikinci kez yazmayı gerektirir. Sorun büyürse (ör. kullanıcıların %1'i sınırı aşarsa) tekrar ele alınır.

- `GET /api/attempts` artık `{ attempts, totals: { total, ok } }` döndürüyor. Toplam, kullanıcının kendi satırlarına `count(*)` ile hesaplanıyor (yeni veri yok, yalnızca oturumdaki kullanıcı; en az yetki ilkesi değişmedi).
- `store.ts`: `totals` alanı; yeni cevapta artırılıyor, misafirde `null`.
- `Profile.tsx`: "Çözülen soru" ve "Doğruluk" toplamdan.
- `Growth.tsx`: liste kesildiyse not.

### Açık kalan (QA)

- **G-2 (düşük):** "Konu bazında doğruluk" ve "Çalışma önerisi" hâlâ son 5000 cevaba göre ve bunu söylemiyor. CSV/JSON dışa aktarma da son 5000 cevabı içeriyor; kullanıcının "tüm verimi indir" beklentisine (KVKK veri taşınabilirliği) uymayabilir. Önerilen çözüm: dışa aktarma için sayfalı ayrı uç nokta.
- **G-3 (bilgi):** `POST /api/attempts` istemcinin gönderdiği `at` zamanını kabul ediyor (misafir verisini taşımak için gerekli). Kullanıcı yalnızca kendi istatistiğini bozabilir; güvenlik riski yok, ama gelecekte sıralama gibi bir özellik eklenirse sorun olur (bu ürün kararıyla zaten eklenmeyecek).
- Misafir tarayıcıda liste 2000 cevapta kesiliyor; toplam bilinmiyor. Bilinçli olarak bırakıldı.

## 3. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| t13 | Aralık notta, sayılar ölçülmüş, fark > 3,5 puan, test var | ✅ |
| t23 / T-1 | Ante eklendi, pot ve all-in `replay` testinden geçti, aralık notta, kesin sayım testi var | ✅ |
| Üye yolu | Tarayıcıda çalıştı, SQL ile birebir | ✅ |
| G-1 | Toplam doğru, kesinti söyleniyor | ⚠️ Kısmen: konu tablosu ve dışa aktarma için G-2 açık |
| P-1 / P-3 | Kullanıcıya iletildi | ✅ (aksiyon kullanıcıda) |

Poker iddiaları yeniden okundu: "yarı yarıya" ve "iyi bir fiyat" gibi belirsiz ifadeler sayıya bağlandı; her iki spotta da sayıların bir aralık varsayımına dayandığı `note`'ta yazıyor.

Sağlık: `npm test` **629/629**, `npm run typecheck` temiz, `npm run build` temiz.

## Kullanıcı kararı gerekenler

1. **P-1:** `claude/wizardly-meitner-obr3cs` (bu dal; 1–8. çalışmaların tamamını içerir) varsayılan dala alınmalı.
2. **P-3:** "Cheers" yeniden markalaması (`ch8abk`, `ab8a72b`) isteniyorsa, o commit'in bu dalın üzerine ayrıca uygulanması gerekir (`git cherry-pick ab8a72b`; `globals.css`, `layout.tsx`, `page.tsx` gibi dosyalarda çakışma beklenir). Ekip bunu kendi başına yapmadı.
3. **B-1:** karışık stratejili spotlar için `acceptable` alanı.

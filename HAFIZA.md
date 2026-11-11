# Proje hafızası: Poker Defteri (AI ekibi)

Bu dosya zamanlanmış "şirket" rutininin hafızasıdır. Her çalışma önce bunu okur, sonunda günceller.
İlk oluşturulma: 2026-11-11. Ayrıntılı teknik belge: `README.md`. Çalışma çıktıları: `docs/calisma/`.

## Mevcut durum (2026-11-11)

- Next.js 16 + PostgreSQL + Claude API ile Türkçe Texas Hold'em çalışma sitesi. Eğitim amaçlı; gerçek parayla oyun yok, 18+.
- 575 spot var (53'ü elle yazılmış, 522'si üretilmiş). `npm test`: 589 test geçiyor. `npm run typecheck` temiz.
- Aşama 1 MVP'de yalnızca "Yayın" adımı ⬜. Aşama 3'te "Hand history içe aktarma" ve "Gelişmiş istatistikler" ⬜.
- Bilinen sınırlar: asistan gerçek API anahtarıyla denenmedi, Google girişi denenmedi, poker içeriği insan bir uzman tarafından gözden geçirilmedi.

## Bu çalışmada tamamlananlar (2026-11-11)

1. **Elle yazılmış 53 spotun poker denetimi** (Poker Uzmanı + QA) → `docs/calisma/2026-11-11-poker-icerik-denetimi.md`
   - Pot, çağrı tutarı ve gereken equity değerleri yeniden hesaplandı. Equity kendi değerlendiricimizle Monte Carlo ile, ICM üç varsayımsal ödeme yapısıyla hesaplandı.
   - Kritik veya yüksek önemde hata yok. 2 orta önemde bulgu (c03, t22), 4 düşük (c19, c20, c27, t17), 2 bilgi notu (t21, t09).
   - Önerilen 5 yeni test vakası yazıldı (henüz kodlanmadı).
2. **Oturum sağlığı ve Gelişim paneli spesifikasyonu** (Davranış Bilimleri + UI/UX + Frontend + Backend) → `docs/calisma/2026-11-11-oturum-ve-gelisim-spec.md`
   - 20 elde bir durak kartı, "Seri" sayacının kaldırılması, 30 dakikada bir kapatılabilir mola notu, 1/3/7 gün aralıklı tekrar.
   - Pozisyon, oyun tipi ve sokak bazında döküm ile 4 haftalık trend.

## Devam edenler / devredilenler (Claude Code)

| İş | Kaynak belge | Durum |
|---|---|---|
| Spot veri düzeltmeleri: c19, c20, c27, t17 metinleri; t22 elinin değişmesi ya da notlanması; c03'e range notu | denetim, "Bulgular" | ⬜ devredildi |
| `hands.test.ts`'e 5 yeni doğrulama (gerekçedeki sayılar, all-in etiketi, range tutarlılığı, eşik payı, out yüzdesi) | denetim, "QA test planı" | ⬜ devredildi |
| `src/lib/client/stats.ts` ve testleri, `Profile.tsx` "Gelişim" bölümü | spec, 3. ve 5. bölümler | ⬜ devredildi |
| `Trainer.tsx`: durak kartı, mola notu, seri sayacının kaldırılması | spec, 2a ve 5. bölümler | ⬜ devredildi, **seri sayacının kaldırılması için önce proje sahibinin onayı gerekli** |
| `POST /api/attempts` için `at` zaman damgası doğrulaması | spec, 4. bölüm | ⬜ devredildi |

## Alınan teknik ve ürün kararları

- Hafıza dosyası `HAFIZA.md` (depo kökü), çalışma çıktıları `docs/calisma/YYYY-AA-GG-konu.md`.
- İstatistikler için yeni tablo ya da uç nokta yok. Pozisyon, oyun ve sokak bilgisi `hand_id` → `HAND_BY_ID` üzerinden istemcide türetilir (veri minimizasyonu).
- Oturum tercihleri (durak aralığı, mola notu) yalnızca localStorage'da tutulur, sunucuya gitmez.
- Yasaklı mekanikler: push bildirimi, seri kaybı uyarısı, puan veya sanal para, rastgele ödül, liderlik tablosu.
- Elle yazılmış spotlar da üretilenlerle aynı kurala tabi olmalı: equity ile gereken equity arasındaki fark ≥ 3,5 puan, aksi halde spot "tartışmalı" sayılır.
- ICM spotlarında ödeme yapısı belirtilmediği sürece ICM sonuçları "varsayımlarla" etiketlenir.

## Tespit edilen hatalar ve sorunlar (açık)

| # | Önem | Yer | Özet |
|---|---|---|---|
| O-1 | Orta | `hands.ts` c03 ↔ `ranges.json` cash.CO | Spot 76s'i CO'dan açmayı doğru sayıyor, sitenin range aralığı bu eli içermiyor. Range üreticisi suited connector'ları olduğundan düşük tutuyor olabilir. |
| O-2 | Orta | `hands.ts` t22 | T7o'nun call equity'si eşiğin yalnızca ~3 puan üzerinde; sıkı bir aralığa karşı altında kalıyor. |
| D-1 | Düşük | c19 | 8 out için %17 yazıyor; doğrusu %18,2. |
| D-2 | Düşük | c20 | "All-in (≈85 BB)" yazıyor; kalan stack 89,25 BB. |
| D-3 | Düşük | c27 | Turn kararında "backdoor" ifadesi geçiyor. |
| D-4 | Düşük | t17 | QQ'nun kaybetme sıklığı düşük gösterilmiş (≈%29, "5'te 1" değil). |
| G-1 | Düşük | `api/attempts` | İstemcinin gönderdiği `at` zaman damgası doğrulanmıyor. |
| B-1 | Bilgi | replay motoru | Ante'yi kimin ödediği tanımsız (t21'deki maliyet ifadesi buna bağlı). |
| DV-1 | Ürün | `Trainer.tsx` | Sonsuz akış ve "Seri" sayacı; durma noktası yok (spec D1/D3). |

## Atlanan roller ve nedenleri

- **Data Analyst (2026-11-11):** kullanıcı verisi (VPIP/PFR/3-Bet ya da `attempts` dökümü) sağlanmadı. Uydurma veriyle analiz yapılmadı. Veri gelirse ilk iş bu olmalı.
- **Content, Poker Eğitim (2026-11-11):** sitede 575 spot, 138 terim ve 6 blog yazısı zaten var. Bu çalışmada mevcut içeriğin doğruluğu yeni içerikten daha öncelikli görüldü.

## Sonraki öncelikler

1. Claude Code: denetim düzeltmeleri ve 5 yeni test (küçük, yüksek güven kazandıran iş).
2. Proje sahibinden "Seri" sayacının kaldırılması için onay. Ardından durak kartı, mola notu ve Gelişim paneli uygulaması.
3. Range üreticisinin suited connector ağırlığının gözden geçirilmesi (O-1). Poker Uzmanı, cash açılış aralıklarını yaygın kaynaklarla karşılaştırmalı; kaynak doğrulanamazsa öyle etiketlemeli.
4. (Bekleyen) Yayın adımı ve gerçek API anahtarıyla asistan testi: proje sahibinin kimlik bilgisi sağlamasına bağlı.

## Çalışma günlüğü

- 2026-11-11: Hafıza dosyası oluşturuldu. Roller: Poker Uzmanı, QA, Davranış Bilimleri, UI/UX, Frontend, Backend. Kod değişikliği yapılmadı; yalnızca belgeler eklendi.

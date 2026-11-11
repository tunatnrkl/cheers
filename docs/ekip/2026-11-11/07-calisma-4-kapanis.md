# 4. çalışma: hafıza birleştirme, spot düzeltmelerinin kapanışı, ara kartı

**Tarih:** 2026-11-11 · **Roller:** CEO, Poker Uzmanı, Poker Eğitim, Frontend, QA

## CEO önceliklendirme

| # | İş | Hedef | Başarı kriteri | Sonuç |
|---|---|---|---|---|
| 1 | Hafıza ve dal birleştirme | Önceki 3 çalışma iki ayrı dalda, iki ayrı hafıza dosyasıyla kaldı; her çalışma sıfırdan başlıyordu | Tüm önceki çıktılar tek dalda, tek hafıza dosyası, testler yeşil | ✅ |
| 2 | Açık spot metin bulgularının kapanışı | 01 denetimindeki açık bulguları (O-2, O-3, D-1, D-2, D-3, D-5) kapatmak | Her düzeltmenin sayısı yeniden hesaplanmış; D-2'yi yakalayan regresyon testi var | ✅ |
| 3 | Oturum ritmi (03 spesifikasyonu) | `Seri` sayacını kaldırmak, engellemeyen ara kartını eklemek | 7 kabul ölçütünden otomatik test edilebilenler testli; tarayıcıda doğrulanmış | ⚠️ Kısmen (aşağıda) |

**Çalışmayan roller:** Data Analyst (kullanıcı verisi yok), Davranış Bilimleri (spesifikasyonu 1. çalışmada yazıldı, yeni mekanik yok), Content (bekleyen blog taslağı var; yenisini eklemek birikimi artırırdı), UI/UX ve Backend (sunucu değişikliği yok; veri yalnızca tarayıcıda).

## 1. Hafıza birleştirme

- `claude/wizardly-meitner-ch8abk` + `w5y8as` (docs/ekip altındaki çalışmalar 1–2) ve `claude/wizardly-meitner-cg0oun` (kökteki `HAFIZA.md`, çalışma 3) bu dala cherry-pick edildi. Çakışma olmadı.
- Tek hafıza dosyası artık kökteki **`HAFIZA.md`**. `docs/ekip/HAFIZA.md` yalnızca oraya yönlendiriyor.
- Kök neden: zamanlanmış görevin metnindeki `[HAFIZA_DOSYASI_ADI]` yer tutucusu doldurulmamış ve her çalışma ana dalın (bu dal tabanının) temiz kopyasından başlıyor. Önceki çalışmalar birleştirilmediği sürece sonraki çalışma onları göremez. **Kullanıcı kararı gerekiyor** (bkz. HAFIZA.md, "Kullanıcıdan beklenenler").

## 2. Spot düzeltmeleri (Poker Uzmanı + QA)

Varsayımlar: equity'ler projenin kendi değerlendiricisiyle (`evaluator.ts`) ve `ranges.json` aralıklarıyla ölçüldü. Bu aralıklar solver çıktısı değildir. ICM Malmuth-Harville ile, ödül yapısı **varsayım** olarak.

| Bulgu | Spot | Yapılan | Kontrol |
|---|---|---|---|
| O-1, D-4, D-6 | c17, c27, t22 | 3. çalışmada zaten kapatılmıştı | Metinler kontrol edildi |
| O-2 | t10 | `note` alanına "Ödüller: %50 / %30 / %20" eklendi; "yarı yarıya" yerine sayılar | Aşağıya bakın |
| O-3 | c25 | Fiyat ve rakip okumasına bağımlılık yazıldı | 30 / 97.5 = **%30.8** |
| D-1 | c19 | "%17 / tam sınırda" → "%18 (8 / 44), fiyat zaten yeterli" | Gereken 4 / 24 = %16.7 |
| D-2 | c20 | "All-in (≈85 BB)" → "≈89 BB" | `replay`: kalan stack 89.25 |
| D-3 | c21 | Başlık "ikinci per" → "üçüncü per" (board A-T-6-3-K) | — |
| D-5 | t21 | "dörtte birine yakın" → "üçte birinden fazlası (2.5 / 7 BB)" | %35.7 |

### t10 hesabı ve önceki denetimde bulunan hata

- `replay`: SB 50 BB all-in, kahraman BB'de 1 BB koymuş, 29 BB arkada; pot 52 BB.
- SB'nin kahramanı aşan 20 BB'si call gelince geri döner. Gerçek pot 61 BB, **chip hesabı 29 / 61 = %47.5** ister.
- **QA bulgusu (Q-1, orta):** 1. çalışmanın denetimi (01, O-2) bunu 29 / 81 = %35.8 olarak vermişti. Bu, karşılanmamış (uncalled) bahsi pota saymaktan doğan bir hataydı. 3. çalışmanın `risk-primi-hesabi` blog yazısı doğru değeri (%47.5) kullanıyor. Spot metni doğru değerle yazıldı.
- ICM (fold: stack 52 / 29 / 6; kazanırsa 20 / 61 / 6; kaybederse üçüncülük):

| Ödül varsayımı | Fold payı | Kazanırsa | Kaybederse | Başabaş equity |
|---|---|---|---|---|
| %50 / %30 / %20 | 35.20 | 43.65 | 20 | **%64.3** |
| %40 / %33 / %27 | 34.45 | 37.68 | 27 | **%69.8** |

- KJo'nun SB'nin referans 10 BB push aralığına karşı equity'si: **%54.8** (40.000 deneme Monte Carlo, sabit tohum). 1. çalışma %55.4 ölçmüştü; fark örnekleme gürültüsü. Metinde "yaklaşık %55".
- Sonuç: chip hesabıyla call (%55 > %47.5), ICM ile fold (%55 < %64). Spotun doğru cevabı değişmedi.

### c25 notu

1. çalışmanın denetimi c25 için "gereken equity %23.5" yazmıştı. `replay` ile pot 67.5 BB, call 30 BB, call sonrası pot 97.5 BB → **%30.8**. **QA bulgusu (Q-2, düşük):** önceki rapordaki sayı yanlıştı; spota doğru değer yazıldı. Ayrıca river'da da ödeme yapılacağı için gerçek eşiğin daha yüksek olduğu not edildi. "Okuma olmadan call'a yakın" iddiası hâlâ **doğrulanamadı** (solver yok).

### Yeni regresyon testi

`hands.test.ts` → "seçeneklerdeki all-in tutarları": "All-in (N BB)" yazan her seçenekte N, `replay`'deki kalan stack'ten (ya da stack + o sokaktaki bahis) en fazla 1 BB farklı olmalı. Test, c20 eski haline (≈85) getirildiğinde başarısız oluyor; düzeltilmiş haliyle geçiyor.

## 3. Oturum ritmi (Frontend + Poker Eğitim + QA)

Uygulanan (`src/lib/client/rhythm.ts`, `src/app/alistirma/Trainer.tsx`, `src/data/topicNotes.ts`):

- Üst çubuktaki `Seri N` sayacı kaldırıldı.
- `BreakCard`: N elde bir (varsayılan 20) ya da 25 dakikada bir, yalnızca cevaptan sonra "Sonraki el"e basılınca açılır. "Devam et" ve "Burada bırak" eşit görsel ağırlıkta; "Burada bırak" oturum özetine gider.
- Sıklık: 10 / 20 / 40 el ya da kapalı; `localStorage["pd:rhythm"]`, okuma ve yazma `try/catch` içinde.
- Zayıf konu için tek cümlelik hatırlatma: 11 konunun her biri için `TOPIC_NOTES` (Poker Eğitim). Kesin sayı içermez.
- 60 dakikayı aşan oturumda uzun oturum notu ve küçük `/sorumlu-oyun` bağlantısı.
- Erişilebilirlik: `role="dialog"`, `aria-modal="false"`, `aria-labelledby`; açılınca odak başlığa gider. Enter devam, Esc özete geçer. Kart açıkken 1–3 cevap kaydetmez. Butonlar en az 48px.

### Kabul ölçütleri

| # | Ölçüt | Nasıl doğrulandı | Durum |
|---|---|---|---|
| 1 | 20. cevaptan sonra açılır, 19.'da açılmaz | `rhythm.test.ts`; tarayıcıda every=10 ile 10. cevaptan sonra açıldı | ✅ |
| 2 | 25 dakikada el sayısından bağımsız açılır | `rhythm.test.ts` (sahte zaman) | ✅ (yalnızca birim testi) |
| 3 | Kart açıkken 1–3 cevap kaydetmez | Tarayıcı: "1" tuşundan sonra kart açık kaldı | ✅ |
| 4 | every=0 iken açılmaz | `rhythm.test.ts` | ✅ |
| 5 | `localStorage` hata verince varsayılan 20 | `rhythm.test.ts` | ✅ |
| 6 | `Seri` hiçbir yerde görünmez | `grep` ve tarayıcıda metin araması | ✅ |
| 7 | 60 dk sonra uzun oturum notu | `rhythm.test.ts` (yalnızca mantık) | ⚠️ Arayüzde gözle doğrulanmadı |

Playwright ile 390px ve 1280px genişlikte kontrol edildi; konsolda hata yok.

### Spesifikasyondan sapmalar (revizyon notu)

- **Masaüstünde masa arkada soluk görünmüyor;** kart masa ve koç panelinin yerini alıyor. Spesifikasyon masanın arkada kalmasını ve koç panelinin açık kalmasını istiyordu.
- **"Bu bölümü yorumla" koç kısayolu yok.**
- Açılış animasyonu eklenmedi (hareket olmadığı için `prefers-reduced-motion` sorunu da yok).
- "Yeni oturum" düğmesi uzun oturum sayacını sıfırlamıyor; sayaç sayfa yüklenince başlıyor.

Bu yüzden iş 3 "kısmen tamamlandı" olarak işaretlendi.

## CEO kalite kontrolü

- İş 1: Kriter karşılandı. Testler 601/601, `typecheck` temiz.
- İş 2: Kriter karşılandı. Her sayı `replay` ya da Monte Carlo ile yeniden ölçüldü. İki eski denetim sayısı (t10 %35.8, c25 %23.5) yanlış çıktı ve düzeltildi. Bu, önceki raporların da sayısal kontrol gerektirdiğini gösteriyor.
- İş 3: Çekirdek davranış çalışıyor. Masaüstü yerleşimi ve koç kısayolu eksik; tamamlandı olarak işaretlenmedi.
- Poker iddiaları: `TOPIC_NOTES` cümleleri genel ilke olarak yazıldı, sayı içermiyor. "SPR düşükse tek per ile stack'leri ortaya koymak kolaylaşır" genel bir çalışma ilkesidir, solver ile doğrulanmadı.

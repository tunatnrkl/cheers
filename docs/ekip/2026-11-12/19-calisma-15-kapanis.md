# 15. çalışma: 3-bet spotlarının sayısal denetimi ve 3-bet quiz'i

**Tarih:** 2026-11-12 · **Dal:** `claude/wizardly-meitner-stm5g6` (14. çalışmanın dalı `ct3uj1` üzerine kuruldu)

## Başlangıç durumu

- Bu çalışmanın dalı varsayılan dalla aynı yerdeydi (`8ffc135`, 1–8. çalışmalar + Cheers). 9–14. çalışmalar hâlâ varsayılan dalda değil. En yeni hafıza `ct3uj1`'de (14. çalışma); dal onun üzerine kuruldu (`git checkout -B claude/wizardly-meitner-stm5g6 origin/claude/wizardly-meitner-ct3uj1`).
- B-1 kararı gelmedi, kullanıcı verisi yok. Hafızadaki sıraya göre "B-1 yoksa 3-bet spot denetimi + quiz" seçildi.
- Sağlık: `npm test` 696/696.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | 3-bet spotlarının sayısal denetimi (c07, c08, c09, c10, c12) | Quiz'in dayanacağı spotlarda aralık varsayımlarını yazılı ve ölçülmüş hale getirmek | Her spotta rakip aralığı `note`'ta; gerekçedeki equity/blocker iddiaları ölçülmüş; 3,5 puan kuralına göre sınırda olan spot açıkça "sınırda" diyor; regresyon testi var | Poker Uzmanı, QA |
| 2 | `3bet` konusunda quiz | Açık iş 1'i kapatmak | 5–10 soru; yalnızca denetlenmiş spotlara dayanıyor; her sayı `quizzes.test.ts`'te yeniden hesaplanıyor; ilke iddiaları etiketli; 390/1366 px'te taşma ve konsol hatası yok | Poker Eğitim, Poker Uzmanı, QA |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok), **Davranış Bilimleri** (yeni mekanik yok; quiz kuralları 12'de değerlendirildi), **UI/UX, Frontend, Backend** (var olan quiz bileşeni, sunucu değişmedi), **Content** (3-bet yazısı yok; bir sonraki çalışmaya öneri olarak bırakıldı, bu çalışmada iki işle sınırlı kalındı).

## 1. 3-bet spot denetimi (Poker Uzmanı, QA)

Betik: `docs/ekip/arac/3bet-denetim.mts` (Monte Carlo, sabit tohum, 200.000 deneme). Açılış aralıkları `ranges.json`; 3-bet ve flat aralıkları **ekip tahmini** (solver ile karşılaştırılmadı) ve artık spotların `note` alanında yazılı.

| Spot | Varsayılan rakip aralığı | Ölçüm | Sonuç |
|---|---|---|---|
| c07 AQs (BTN) vs CO açılışı | `ranges.json` CO (≈ %27) | AQs ≈ %61; CO kombinasyonlarının %74,5'ine karşı favori | ✅ "çoğundan öndedir" doğru; sayı gerekçeye eklendi |
| c08 A5s (SB) | — | As ile AA 6 → 3, AK 16 → 12 (kesin sayım) | ✅ sayılar gerekçeye eklendi |
| c09 QQ (CO) vs BTN 3-bet | TT+, AQ+, AJs, KQs + A5s, A4s, KJs, QJs, JTs, 76s, 65s (≈ %7) | QQ ≈ %62; yalnızca KK+'ya karşı ≈ %18; call fiyatı 5,5 / 17,5 ≈ %31,4 | ⚠️ **Q-9** düzeltildi |
| c10 AJo (HJ) vs BTN 3-bet | JJ+, AQ+ + A5s, A4s, KQs, 76s (≈ %5) | AJo ≈ %34,5, gereken %31,4 (fark 3,1 puan < 3,5); gereken realization ≈ %91; value kısmına (JJ+, AQ+) ≈ %26; c09'daki daha geniş aralığa karşı ≈ %41 | ⚠️ **Q-10**: sınırda, gerekçe yeniden yazıldı |
| c12 JJ (BB) squeeze | CO: `ranges.json`; BTN flat: 22–JJ, ATs, AJs, KTs, QTs, J9s, T9s, 98s, 87s, AQo, AJo, KQo | JJ vs CO ≈ %67,5; vs BTN flat ≈ %73,5; üç yollu pay ≈ %51,9 (adil pay %33) | ✅ sayılar gerekçeye eklendi |

**Q-9 (düşük):** c09 gerekçesi "yalnızca KK+ ile 3-bet atan bir rakibe karşı call daha güvenli olurdu" diyordu. QQ, KK+'ya karşı ≈ %18; call için gereken %31,4'ü karşılamıyor. Yeni metin: 4-bet büyük hata olur, call da fiyatı karşılamaz, seçim call ile fold arasındadır. Cevap (4-bet) değişmedi.

**Q-10 (düşük–orta):** c10'da fold cevabı ham equity'ye göre eşiğin 3,1 puan *üstünde* (call yönünde). Kuralımıza göre sınırda spot ancak kararı aynı yöne iten ek etken açıkça yazılıysa kalabilir. Gerekçe artık fiyatı, ham equity'yi, gereken realization'ı (%91), dominasyonu ve aralık duyarlılığını (geniş 3-bet aralığında call makul) açıkça söylüyor. Cevap değişmedi; kayıtlı cevaplar etkilenmez. c10, B-1 (`acceptable`) adayları listesine eklendi.

Pot ve seçenek tutarları: c07 3-bet 7,5 (açılışın 3 katı), c08 11, c09 4-bet 20, c10 call 5,5, c12 pot 6,5 — hepsi `replay` ile tutarlı (var olan testler).

**Yeni testler (`hands.test.ts`, "3-bet spotları (c07–c10, c12)", 6 test):** aralık yüzdeleri ve notlardaki listeler; c07 ≈ %61; c08 blocker sayımı; c09 %62 / %18 ve fiyat; c10 eşik, fark < 3,5, realization %89–93, value kısmı, geniş aralık; c12 iki yönlü ve üç yollu equity.

## 2. 3-bet quiz'i (Poker Eğitim, Poker Uzmanı, QA)

`/quiz/3-bet-ve-squeeze`, 7 soru, "Orta–ileri", konu `3bet`. `posts[0] = "pozisyon-neden-onemli"`: bu yazının artık "Quiz ile tekrarla" düğmesi var (önceden yoktu). Sitede 3-bet yazısı yok.

| # | Soru | Doğru cevap | Dayanak | Testte |
|---|---|---|---|---|
| 1 | 2,5 açılışa 7,5 3-bet: cutoff'un gereken equity'si | %30 (5 / 16,5) | c07 | `replay`; yaygın hatalar %43 ve %67 |
| 2 | Maça as + maça beşli: kalan AA ve AK | 3 AA, 12 AK | c08 | kesin sayım; c08 gerekçesiyle aynı metin |
| 3 | Tipik 3-bet blöf adayı | A5s | c08 (ilke) | — (ilke, "solver ile karşılaştırılmadı" diye etiketli) |
| 4 | QQ yalnızca KK+'ya karşı | ≈ %18, 4-bet büyük hata | c09 | equity `hands.test.ts`'te; fiyat ve cevap spotla aynı |
| 5 | AJo: gereken realization | ≈ %91 (31,4 / 34,5) | c10 | fiyat, oran, c10 gerekçesi |
| 6 | 13 BB saf blöf squeeze'i başabaşı | %65 (12 / 18,5) | c12 | `replay` potu, `bluffBreakEven` |
| 7 | 9 BB / 13 BB squeeze'de cutoff'un fiyatı | ≈ %31 / ≈ %36 | c12 | iki `replay` dizisi; yaygın hata %45 / %57 |

Doğru cevap konumları: B, C, A, D, B, C, A. Kart renk sembolü yok (14. çalışma kararı; ilk taslaktaki "A♠5♠" yayından önce yazıyla değiştirildi).

**Eksik konu tespiti:** 3-bet'e karşı **pozisyonda** devam (IP call/4-bet) ve **4-bet'e karşı** karar spotu yok; SB/BB'den butona 3-bet dışında blind-vs-blind 3-bet spotu yok. 3-bet konulu blog yazısı yok.

### Tarayıcı denemesi (QA)

`npm run build && next start`, Playwright (Chromium), 390 ve 1366 px:

| Kontrol | Sonuç |
|---|---|
| 7 sorunun doğru seçeneği seçildi, geri bildirim göründü | ✅ iki boyutta |
| Yatay taşma | ✅ 0 px |
| Konsol hatası, 4xx/5xx | ✅ yok |
| 7 spot bağlantısı | ✅ |
| `/blog/pozisyon-neden-onemli` quiz düğmesi | ✅ `/quiz/3-bet-ve-squeeze` |
| `/quiz` listesinde yeni quiz | ✅ |
| `/alistirma?el=c09`, `c10`, `c12`: "Varsayım:" notu masada görünüyor | ✅ iki boyutta, taşma yok |

Denenmeyen: gerçek ekran okuyucu, GitHub Pages statik derleme, açık tema (bileşen 13'te denendi; bu çalışma yalnızca veri ekledi).

## 3. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| 3-bet spot denetimi | Aralıklar notta, iddialar ölçülü, sınırda spot açıkça söylüyor, testli | ✅ |
| 3-bet quiz'i | 7 soru, her sayı testte, ilke etiketli, tarayıcıda temiz | ✅ (ekran okuyucu ve Pages denenmedi) |

Poker iddiaları yeniden okundu:
- c10'da realization %91 bir *gereken* değerdir, ölçülen değil; "pozisyon dışında bu gerçekçi değil" yargısı solver ya da veriyle doğrulanmadı. Quiz'in 5. sorusunda bu açıkça yazılı.
- c09'da 4-bet'in doğru olması nottaki aralığa bağlı; bu aralık ekip tahmini.
- c12'deki "büyük squeeze butonun sınırlı aralığını cezalandırır" yargısı niteliksel; ölçülen yalnızca equity ve fiyat.
- 3. sorudaki blöf adayı seçimi yaygın ilke; etiketli.
- Parasal kazanç vaadi yok (test geçiyor).

Sağlık: `npm test` **708/708** (696 + 6 spot testi + 6 quiz testi), `npm run typecheck` temiz, `npm run build` temiz.

## Kullanıcı kararı gerekenler

1. **Dal:** `claude/wizardly-meitner-stm5g6` (bu dal) 9–15. çalışmaların hepsini içerir; yalnızca bunu varsayılan dala almak yeterli.
2. **B-1:** karışık stratejili spotlar için `acceptable` alanı (c09, c10, c23, c24, c35, c39).
3. Görev metnindeki `[HAFIZA_DOSYASI_ADI]` hâlâ yer tutucu; öneri `HAFIZA.md`.

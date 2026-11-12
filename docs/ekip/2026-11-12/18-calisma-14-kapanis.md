# 14. çalışma: c-bet spotlarının sayısal denetimi ve c-bet quiz'i

**Tarih:** 2026-11-12 · **Dal:** `claude/wizardly-meitner-ct3uj1` (13. çalışmanın dalı `56jps3` üzerine kuruldu)

## Başlangıç durumu

- Bu çalışmanın dalı varsayılan dalla aynı yerdeydi (`8ffc135`, 1–8. çalışmalar + Cheers markası). 9–13. çalışmalar varsayılan dala alınmamış. En yeni hafıza `56jps3`'te (13. çalışma); dal onun üzerine kuruldu (`git checkout -B … origin/claude/wizardly-meitner-56jps3`).
- B-1 kararı gelmedi, kullanıcı verisi yok. Hafızadaki sıraya göre "B-1 yoksa c-bet quiz'i; önce spot sayıları yeniden okunmalı" işi seçildi.
- Sağlık: `npm test` 688/688.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | C-bet spotlarının sayısal denetimi | Quiz'in dayanacağı spotlarda Q-6 benzeri kaymaları bulmak | c15, c16, c27, c29, t15 (ve quiz'e bağlanan c28) için pot, bahis tutarı, fiyat ve out sayısı `replay` ve evaluator ile ölçülmüş; bulunan hata düzeltilmiş ve bütün spotları kapsayan testle korunuyor | Poker Uzmanı, QA |
| 2 | `cbet` konusunda quiz | Açık iş 1'i (`cbet` quiz'i yok) kapatmak | 5–10 soru; yalnızca var olan spotlara dayanıyor; her sayı `quizzes.test.ts`'te yeniden hesaplanıyor; niteliksel iddialar "ilke, solver ile doğrulanmadı" diye etiketli; 390/1366 px'te taşma, konsol hatası yok; blog düğmesi bu quiz'i açıyor | Poker Eğitim, Poker Uzmanı, QA |
| 3 | Dal durumu | Kullanıcıyı bilgilendirmek | Hafızada ve bildirimde net talimat | CEO |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok), **Davranış Bilimleri** (yeni mekanik yok; quiz kuralları 12. çalışmada değerlendirildi: puan, süre, seri, kayıt yok), **UI/UX, Frontend, Backend** (var olan bileşen kullanıldı, sunucu değişmedi), **Content** (`c-bet-ne-zaman` yazısı zaten var).

## 1. C-bet spot denetimi (Poker Uzmanı, QA)

Pot ve stack'ler `replay`'den alındı. Bahis tutarı = pot × seçenekteki kesir. Blöf başabaşı = bahis / (pot + bahis). Call edenin gereken equity'si = bahis / (pot + 2 × bahis).

| Spot | Pot (veri / replay) | Kontrol | Sonuç |
|---|---|---|---|
| c15 | 5,5 / 5,5 | 1/3 pot = 1,83 ("≈1,8" ✓); blöf başabaşı %25, BB'nin gereken equity'si %20; pot kadar %50 / %33,3 | ✅ |
| c16 | 6,5 / 6,5 | AsKd, 9h8h7c: per yok, floş ve kent çekişi yok ✓ | ✅ |
| c27 | 9,5 / 9,5 | **2/3 pot = 6,33; seçenekte "≈6,5 BB" yazıyordu** | ❌ → düzeltildi (Q-8) |
| c27 | — | River'da kent: evaluator ile yalnızca 4 dam (4/46 ≈ %8,7). Gerekçedeki "as (per) ya da dam (kent)" doğru | ✅ |
| c29 | 8 / 8 | İki call'cu, AcKd 8s7s6d'de çekiş yok ✓ | ✅ |
| t15 | 5,5 / 5,5 (ante 1) | Geride 18 BB, SPR 3,27 ("yaklaşık 3" ✓); 1/3 = 1,83; all-in 18 ✓ | ✅ |
| c28 | 9 / 9 | 2/3 pot = 6, başabaş %40; gutshot gerçekten 4 kart (T) | ✅ |

Diğer pot kesirli seçenekler de tarandı: c20 "2/3 pot (≈15 BB)" → 14,67 ✓; c22 "1/2 pot (≈5,5 BB)" → 5,5 ✓.

**Q-8 (düşük):** c27'nin doğru seçeneği "2/3 pot bahis (≈6,5 BB)" yazıyordu; 9,5 × 2/3 = 6,33. "≈6,3 BB" olarak düzeltildi. Cevap indeksi değişmedi, kayıtlı cevaplar etkilenmez.

**Yeni test (`hands.test.ts`, "seçeneklerdeki pot kesri tutarları"):** "N/M pot bahis (≈X BB)" yazan her seçenekte X, replay potunun N/M'sine yazıldığı basamakta yuvarlanmış olmalı (tam sayıda ±0,5, bir ondalıkta ±0,05). Eski metinle başarısız olduğu ("c27: … doğrusu ≈ 6.33"), düzeltmeyle geçtiği denendi.

Ölçülmeyen: "board açılış yapanın aralığına uyuyor" (range avantajı) iddiaları c15, c16, c27, c29'da niteliksel kaldı. Sitede BB'nin call aralığı tanımlı değil; aralıklar solver çıktısı değil. Bu iddialar quiz'de "genel kabul gören ilke, sitede ölçülmedi" diye etiketlendi.

## 2. C-bet quiz'i (Poker Eğitim, Poker Uzmanı, QA)

`/quiz/c-bet-ve-barrel`, 8 soru, seviye "Orta", konu `cbet`. `posts[0] = "c-bet-ne-zaman"` olduğu için blog yazısındaki "Quiz ile tekrarla" düğmesi artık bu quiz'i açıyor (önceden pot odds quiz'ini açıyordu).

| # | Soru | Doğru cevap | Dayanak | Testte |
|---|---|---|---|---|
| 1 | 1/3 pot blöf c-bet'inin başabaşı | %25 (1,83 / 7,33) | c15 | replay potu, `bluffBreakEven` |
| 2 | BB'nin 1/3 pot c-bet'e gereken equity'si | %20 (1,83 / 9,17) | c15 | `requiredEquity`; 2/3 pot %28,6, pot %33,3 |
| 3 | Hangi flop açılış yapana uyar | K-7-2, üç farklı renk | c15 (ilke) | c15'in doğru cevabı küçük c-bet ve board K-7-2 |
| 4 | İki rakip, her biri %35 yakalıyorsa en az biri | %58 (1 − 0,65²) | c29 | aritmetik; c29'da iki call'cu ve cevap check |
| 5 | AJ, T-6-2-K: river'da kent | 4 / 46 ≈ %8,7 | c27 | evaluator ile 46 kart tek tek; yalnızca Q |
| 6 | 2/3 pot ikinci barrel başabaşı | %40 | c27 | replay potu; seçenek metni ≈6,3 |
| 7 | t15: 1/3 flop + 2/3 turn sonrası river'da geride kalan | ≈ yarısı (10,06 / 21,39 ≈ %47) | t15 | adım adım pot ve stack |
| 8 | Fold etmeyen rakibe 2/3 pot blöf | %40 gerekir → check | c28 | başabaş, c28 notu ve cevabı, gutshot 4 kart |

Varsayımlar quiz'in başında yazıyor: cash 100 BB, rake yok (7. soru turnuva); fiyat, başabaş, out, SPR kesin hesap; "board kime uyuyor" ve rakip aralığı yargıları solver ile karşılaştırılmadı; rakibin gerçek fold sıklığı tahmin edilmiyor. 4. sorudaki %35 açıkça "örnek varsayım" ve bağımsızlığın yaklaşık olduğu gerekçede yazıyor.

Doğru cevap konumları: B, A, C, B, A, C, D, C (ezber önleme testi geçiyor).

Eksik konu tespiti: quiz turn/river barrel'i yalnızca c27 ve c28 üzerinden anlatıyor; **delayed c-bet** ve **check-raise'e karşı c-bet** spotu sitede yok. `3bet` konusunda hâlâ quiz yok.

### Tarayıcı denemesi (QA)

`npm run build && next start`, Playwright (Chromium), 390 ve 1366 px:

| Kontrol | Sonuç |
|---|---|
| 8 sorunun doğru seçeneği "Doğru." geri bildirimi veriyor | ✅ 8/8, iki boyutta |
| Yanlış cevap yolu ("Doğru cevap B.") ve sıfırlama | ✅ |
| Yatay taşma | ✅ 0 px |
| Konsol hatası, 4xx/5xx | ✅ yok |
| Spot bağlantıları (c15, c29, c27, t15, c28) | ✅; `/alistirma?el=c27` masada açılıyor, "≈6,3 BB" görünüyor |
| `/blog/c-bet-ne-zaman` quiz düğmesi | ✅ `/quiz/c-bet-ve-barrel` |
| `/quiz` 6 kart, `/ogren` "6 kısa quiz" | ✅ |

**Bulunan ve yayından önce düzeltilen (A-2, düşük):** ilk taslakta board'lar "K♠ 7♦ 2♣" gibi renk sembolleriyle yazılmıştı. Ekranda kupa emoji olarak büyük, maça küçük glif olarak çiziliyordu; renkler de ayırt edilemiyordu. Sitenin geri kalanıyla tutarlı "K-7-2, üç farklı renk" yazımına geçildi.

Denenmeyen: gerçek ekran okuyucu, GitHub Pages `basePath` ile statik derleme (bileşen 13. çalışmada bu ayarla denenmişti; yeni quiz yalnızca veri ekliyor), açık tema.

## 3. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| Spot denetimi | Pot, tutar, fiyat, out ölçüldü; Q-8 düzeltildi; genel test eklendi ve eski metni yakalıyor | ✅ |
| C-bet quiz'i | 8 soru; her sayı testte; ilke iddiaları etiketli; tarayıcıda iki boyutta temiz; blog düğmesi doğru | ✅ (ekran okuyucu ve Pages denenmedi) |
| Dal durumu | Hafızada ve bildirimde | ✅ (aksiyon kullanıcıda) |

Poker iddiaları yeniden okundu:
- 1. soruda "elin hiç gelişmeyecek gibi sayılır" eklendi; c15'te AQ'nun gelişme şansı başabaşı biraz düşürür, bu yüzden %25 üst sınır gibi okunmalı.
- 3. sorudaki range avantajı açıklaması "genel kabul gören ilke; sitedeki aralıklarla oranı ölçülmedi" diye bitiyor.
- 6. soruda gelişme şansının eşiği ne kadar düşürdüğü için kesin sayı verilmedi (rakibin aralığına bağlı).
- Parasal kazanç vaadi yok (test: "parasal kazanç vaadi yok" geçiyor).

Sağlık: `npm test` **696/696** (688 + 1 pot kesri testi + 7 quiz testi), `npm run typecheck` temiz, `npm run build` temiz.

## Kullanıcı kararı gerekenler

1. **Dal:** `claude/wizardly-meitner-ct3uj1` (bu dal) 9–14. çalışmaların hepsini içerir; yalnızca bunu varsayılan dala almak yeterli.
2. **B-1:** karışık stratejili spotlar için `acceptable` alanı (c39 ve sınırda spotlar buna bağlı).
3. Görev metnindeki `[HAFIZA_DOSYASI_ADI]` hâlâ yer tutucu; öneri `HAFIZA.md`.

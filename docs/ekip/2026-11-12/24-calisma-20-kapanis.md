# 20. çalışma — kapanış raporu (2026-11-12)

## CEO önceliklendirme

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Kalıcı talimat: en az spotlu konu `spr` (6) | `spr`'ye ≥ 50 doğrulanabilir spot | Cevap tam sayımla belirleniyor ve testte üreteçten bağımsız yeniden hesaplanıyor; eşiğe 3,5 puandan yakın spot yok; varsayımlar `note`'ta; önceki 818 üretilmiş spot bayt bayt aynı | Poker Uzmanı, QA |
| 2 | Yeni spotları öğretime bağlama | SPR quiz'i, SPR'nin gereken equity'ye etkisini sayıyla göstersin | Sorular spotlarla aynı sayıları kullanıyor, testli; quiz 5–10 soru sınırında | Poker Eğitim, QA |

Dal: `uaxxzk` (19) ana dala alınmamıştı; çalışma onun üzerine kuruldu. Yan dallarda zincir dışı yeni commit yok (`56jps3`, `hou5l2` bilinen durumda).

## 1. SPR all-in spotları (`sp-…`, 60 spot) — Poker Uzmanı, QA

**Model** (`scripts/generate-ranges.mts`, 10. bölüm, tohum 20261200):
- Turnuva, chip EV (ICM yok). BTN 2 BB açar, SB fold, BB call; toplam ante 1 BB → flop pot 5,5 BB. Flop'ta BB kalan R = S − 2 BB'yi all-in yapar. Kahraman BTN'de (sitedeki BTN açılış aralığından), flop çiftsiz, kahramanın tam olarak tek çifti var.
- Gereken equity = R / (5,5 + 2R): 12 BB → %39,2 (SPR 1,8); 16 → %41,8 (2,5); 22 → %44 (3,6); 30 → %45,5 (5,1); 40 → %46,6 (6,9).
- BB'nin preflop aralığı river value bölümüyle aynı (buton açılış aralığı − AA, KK, QQ, AK). Flop all-in aralığı dört iç içe kuraldan biri: **çok sıkı** (overpair, iki çift+), **sıkı** (üst çift+, floş çekişi), **orta** (ikinci çift+, floş çekişi, açık uçlu/çift gutshot), **geniş** (her çift, her çekiş, elinde as, iki overcard).
- **Varsayım:** stack derinleştikçe all-in aralığı daralır: 12 BB geniş, 16 ve 22 BB orta, 30 BB sıkı, 40 BB çok sıkı.
- Equity Monte Carlo değil: BB'nin her kombinasyonu × turn ve river'ın bütün kombinasyonları (990).
- Cevap varsayılan kuralda **ve bir sıkı, bir geniş komşu kuralda** aynı olmalı, üçünde de eşikten en az 3,5 puan uzak kalmalı. Gerekçe komşu kurallardaki equity'yi de yazıyor.

**Sonuç:** 60 spot, 30 call / 30 fold; eşiğe en yakın spot 5,2 puan uzakta. Örüntü (öğretilen ders bu): üst çift 12–22 BB'de 15 kez call, 30–40 BB'de 5 kez fold; overpair her stack'te call (13); alt çift ve board altı cep çiftleri her stack'te fold.

**QA:**
- Üreteçten bağımsız test (`hands.test.ts`, "SPR all-in spotları"): kurallar testte ayrı yazıldı (kent pencereleri, floş çekişi), pot ve call `replay`'den, 990 runout sayımı; cevap, 3,5 puan payı, gerekçedeki gereken ve aralık equity'si (±0,05 puan) ve komşu equity'leri birebir.
- Mutasyon denemesi: `sp-30-2d2c-Ks7d6s`'nin cevabı ters çevrildi → yakalandı; `sp-16-QsQc-5cJc9h`'nin equity'si 1 puan değiştirildi → yakalandı.
- **QA bulgusu (S-1):** var olan "out oranlarının paydası" testi "20 / 45,5" pot ifadesini "20 / 45" out oranı sanıp 12 spotta hata verdi (yanlış pozitif). Regex ondalıklı paydayı dışlayacak biçimde düzeltildi; denetlenen gerçek oran sayısı değişmedi (> 50).
- `drills.json`'un ilk 818 kaydı eskisiyle bayt bayt aynı; `ranges.json` değişmedi.
- Playwright 390/1366 px: `sp-40-Ah8c-JdKhAd` ve `sp-12-Qc5c-Qh2d7s` `?el=` ile açılıyor, başlık ve "Call (38 BB)" doğru, cevap sonrası "Doğru!" + "Neden?"; taşma 0, konsol/4xx 0. SPR quiz'inde 8–9. sorular görünüyor. (Açık tema, Pages ve ekran okuyucu denenmedi.)

## 2. SPR quiz'i — Poker Eğitim, QA

- `spr-ve-value` quiz'ine 8. ve 9. sorular (artık 9 soru): 12 BB'de 10 / 25,5 ≈ %39,2 → `sp-12-Qc5c-Qh2d7s` (üst çift ≈ %70,1, call); 40 BB'de 38 / 81,5 ≈ %46,6 ve derin all-in aralığının varsayım olduğu → `sp-40-Ah8c-JdKhAd` (A8 ≈ %10, geniş komşuda ≈ %39,8, fold). Varsayım metnine "8–9. sorular: turnuva, ante 1 BB, chip EV" eklendi.
- 2 test (`quizzes.test.ts`): fiyatlar, cevap metni, spotun stack'i, cevabı, `replay` potu ve gerekçedeki sayılar.

## Sağlık

- `npm test` **1089/1089** (19 sonunda 1025), `npm run typecheck` temiz, `npm run build` temiz.
- `npm run ranges` ≈ 3,3 dk (yeni bölümün tam sayımı ≈ 2 dk ekledi). Tekrarlanabilir.

## CEO kalite kontrolü

| İş | Başarı kriteri | Durum |
|---|---|---|
| 1 | 60 ≥ 50 spot, tam sayım, bağımsız test, 3,5 puan payı, önceki çıktı aynı | ✅ |
| 2 | Sayılar spotlarla aynı ve testli, quiz 9 soru | ✅ |

Poker iddialarının gözden geçirilmesi:
- Gerekçelerdeki "SPR büyüdükçe gereken equity %50'ye yaklaşır" kesin matematik (R / (5,5 + 2R) → 1/2). "Derin all-in yapan aralık daha güçlüdür" bir **varsayım**; gerekçede "bu varsayımda" diye yazıldı.
- **Doğrulanamadı:** all-in kurallarının ve stack'e göre daralma varsayımının gerçek oyuncu havuzunu temsil ettiği; solver ya da oyuncu verisiyle karşılaştırılmadı. 12–16 BB'de BTN'nin 2 BB açması ve BB'nin call etmesi (all-in yerine) basitleştirme; bu stack'lerde preflop all-in daha yaygın olabilir. BB'nin preflop aralığı cash'ten türetilen buton aralığı (turnuva BB savunması değil). Kahramanın raise seçeneği yok (all-in'e karşı yalnızca call/fold zaten tam seçenek kümesi). ICM yok.

## Atlanan roller

- **Data Analyst:** kullanıcı verisi yok.
- **Davranış Bilimleri, UI/UX, Frontend, Backend:** yeni mekanik, ekran ya da uç nokta yok; değişiklik yalnızca veri, quiz ve test.
- **Content:** SPR için ayrı yazı bu çalışmaya sığmadı; sonraki öncelik olarak önerildi (yeni yazı yerine quiz yeterli yük).

## Sonraki öncelikler

1. **Kalıcı talimat:** konu sayıları (20 sonu): **`icm` 12**, `value` 63, `3bet`/`blof`/`cbet` 65, `savunma`/`spr` 66, `odds` 75, `acilis`/`callshove` 122, `pushfold` 222. ICM için üretilebilir model var (`ib`/`ip` elle yazılmış yöntemi: tek el Malmuth-Harville, ödül yapısı varsayımı); üreteçte bölüm olarak kurulabilir.
2. SPR yazısı (Content): `sp` örnekleriyle "SPR ve all-in'e karşı fiyat" — gereken equity tablosu ve aralık varsayımı.
3. B-1 kararı geldiyse `acceptable` alanı + c39.

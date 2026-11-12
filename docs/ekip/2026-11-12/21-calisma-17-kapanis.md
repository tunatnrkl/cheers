# 17. çalışma — kapanış raporu (2026-11-12)

Dal: `claude/wizardly-meitner-h9bh3c`, `claude/wizardly-meitner-p4oajz` (16) üzerine kuruldu. Yan dallarda zincir dışı yeni commit yok (`05x26x`, `cg0oun`, `w5y8as`, `hou5l2`, `56jps3` bilinen eski ya da paralel commit'ler).

## 1. CEO önceliklendirme

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Kalıcı talimat: en az spotlu konu | `3bet` (5 spot, `cbet` ile eşit) en az 50 spot | Doğrulanabilir model, `note`'ta aralık, sınırda olan yok, üreteçten bağımsız test, önceki üretilmiş spotlar bayt bayt aynı | Poker Uzmanı, QA |
| 2 | 3-bet yazısı (15'ten devreden) | c07–c12 ve yeni spotların ölçülmüş sayılarıyla yazı; quiz düğmesi bu yazıya | Yazıdaki her sayı testte spotlarla ya da yeniden ölçümle karşılaştırılıyor | Content, Poker Uzmanı, QA |

`3bet` seçildi çünkü 16. çalışmanın önerdiği kısa stack all-in modeli tek formüle iniyor ve test edilebiliyor; `cbet` için turn barrel modeli daha fazla varsayım istiyor.

Çalışmayan roller: Data Analyst (veri yok), Davranış Bilimleri / UI/UX / Backend (yeni mekanik, ekran, uç nokta yok), Poker Eğitim (3-bet quiz'i zaten var; yazı ona bağlandı), Frontend (kod değişikliği yalnızca veri).

## 2. Çıktılar

### Poker Uzmanı — 60 spot: BB'den açılışa 3-bet all-in ya da fold (`r3-…`)

- Senaryo: turnuva, ICM yok (chip EV), efektif 20 ya da 25 BB, toplam ante 1 BB. UTG / HJ / CO / BTN 2 BB açar, aradakiler fold eder, kahraman BB'de. Seçenekler yalnızca Fold ve All-in.
- Fold'a göre fark: **Δ = f × 4,5 + (1 − f) × [eq × (2S + 1,5) − (S − 1)]**. f kesin kombinasyon sayımı (kahramanın kartları çıkarılır), eq Monte Carlo.
- Açanın call aralığı türetilir: açan, BB'nin all-in aralığını push sıralamasının en iyi %X'i sayar (BTN 20 BB: 25; BTN 25 / CO 20: 20; CO 25, HJ, UTG 20: 15; UTG 25: 12) ve açılış aralığındaki ellerden yalnızca bu aralığa karşı call fiyatını karşılayanlarla call eder. Bu aralık `note`'ta açıkça yazılır.
- Üç senaryo (X, 0,75X, 1,35X); cevap üçünde aynı ve |Δ| ≥ 0,5 BB olmalı. Gerekçedeki sayılar 80.000 denemeyle ölçüldü. Sıkı ve geniş senaryonun aralıkları gerekçede yazılı.
- Sonuç: 60 spot, 30 all-in / 30 fold. Bölüm üretecin 7. bölümü (tohum 20261117/20261118); önceki 638 üretilmiş spot bayt bayt aynı.
- **Model bulgusu (önemli):** ilk denemede açanın call aralığı sabit ve dar alındı (push sıralamasının en iyi %10–15'i, ±%60/150). Bu modelde hiçbir el sağlam bir fold çıkmadı: açan sık fold edince her el all-in'de kârlı görünüyordu. Call aralığı, kahramanın all-in aralığına karşı pot odds'tan türetilince fold cevapları ortaya çıktı. Senaryo aralığı ±%60/150'den %75/135'e daraltıldı. Açan bundan daha sıkı call ederse alıştırmadaki fold cevapları geçerli olmaz; bu, yazıda ve README'de açıkça yazıldı.
- Dağılım: BTN açılışlarında fold spotu çıkmadı (hepsi all-in), fold'lar HJ/UTG/CO'dan. Fold cevaplarının hepsi zayıf eller (32o, J3o, T6s gibi); orta güçte "fold" spotu yok.

### QA

- `hands.test.ts` › "3-bet all-in spotları (r3-)": spot metnindeki üç call aralığını geri açar, f'yi kesin sayar, eq'yu ayrı tohumla ölçer (temel 60.000, diğerleri 15.000 deneme); işaret cevapla aynı ve |Δ| ≥ 0,3 BB; gerekçedeki f ±0,5, eq ±1,5 puan, Δ ±0,4 BB. Call aralığının açılış aralığı içinde olduğu, pot 4,5, call edilecek tutar 1 ve sıranın BB'de olduğu da denetleniyor.
- Cevabı ters çevrilmiş bir spotu (`r3-HJ25-Th5s`) yakaladığı denendi.
- İlk sürümde gerekçedeki equity 20.000 denemeden geliyordu ve bağımsız ölçümle 2,3 puan farklı çıktı (AJo: üretici %52, 400.000 deneme %53,4). Gösterilen sayılar 80.000 denemeye çıkarıldı.
- Playwright 390 / 1366 px: yazı (taşma 0, konsol/4xx 0, "Quiz ile tekrarla" → `/quiz/3-bet-ve-squeeze`), `r3-BTN25-Kh9h` masada açıldı, not görünüyor, All-in seçilince "Doğru!" çıkıyor, filtre "3-bet ve 4-bet (65)". Açık tema, Pages, ekran okuyucu denenmedi.
- `npm test` 896/896, `npm run typecheck` temiz, `npm run build` temiz.

### Content — `3-bet-4-bet-ve-kisa-stack-all-in` (11. yazı)

Terimler (3-bet, 4-bet, squeeze, fold equity, blocker, realization), value ve blöf 3-bet'i (c07, c08), aynı elin iki farklı rakibe karşı kararı (c09, c10), squeeze (c12), kısa stack formülü ve üç örnek (K9s/BTN all-in, 77/UTG all-in, T6s/UTG fold). Ayrıca: T6s, UTG yalnızca QQ+ ve AK ile call etseydi ≈ +2,3 BB. Varsayımlar ve sınırlar bölümü, sorumlu oyun notu. Yazıdaki her sayı testte spot gerekçesiyle ya da yeniden ölçümle karşılaştırılıyor. 3-bet quiz'inin `posts[0]`'ı bu yazı; pozisyon yazısının düğmesi hâlâ aynı quiz'i açıyor (testli).

## 3. Kalite kontrolü (CEO)

| İş | Kriter | Sonuç |
|---|---|---|
| 1 | ≥ 50 spot, model doğrulanabilir, aralık notta, sınırda yok, bağımsız test, eski çıktı aynı | ✅ 60 spot. Sınırlama: fold'lar yalnızca bariz zayıf eller, BTN açılışında fold yok |
| 2 | Yazıdaki sayılar testli | ✅ |

Poker iddiaları gözden geçirildi:
- "Kısa stack'te küçük 3-bet stack'i bağlar" genel bir ilke; ölçülmedi.
- Varsayılan all-in aralığı yüzdeleri (%12–25) ve "açan call fiyatına göre call eder" varsayımı ekip modeli; solver ya da Nash tablosuyla karşılaştırılmadı. **Doğrulanamadı.**
- 2 BB'den büyük açılışlar (2,2–2,5 BB) ve flat call seçeneği modellenmedi.

## 4. Sonraki öneriler

1. Kalıcı talimat: en az spotlu konu artık `cbet` (5); sonra `savunma` (6), `spr` (6). `cbet` için turn'de ikinci barrel blöfü (blöf bölümüyle aynı kombinasyon sayımı).
2. `r3` bölümüne orta güçte fold spotları: daha derin stack (30 BB) ya da 2,5 BB açılış ile; ya da SB'den resteal.
3. B-1 kararı gelirse `acceptable` alanı + c39.

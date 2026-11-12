# 18. çalışma — kapanış raporu (2026-11-12)

Dal: `claude/wizardly-meitner-3x1qey`, `claude/wizardly-meitner-h9bh3c` (17) üzerine kuruldu. Bu dal başlangıçta varsayılan dalın (`8ffc135`, 1–8. çalışmalar) üzerindeydi; 9–17 zinciri hâlâ birleştirilmediği için `git checkout -B` ile `h9bh3c`'ye taşındı. Yan dallarda zincir dışı yeni commit yok (`05x26x`, `cg0oun`, `w5y8as`, `hou5l2`, `56jps3` bilinen eski ya da paralel commit'ler).

## 1. CEO önceliklendirme

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Kalıcı talimat: en az spotlu konu | `cbet` (5 spot) en az 50 spot | Doğrulanabilir model, `note`'ta aralık ve call kuralları, sınırda olan yok, üreteçten bağımsız test, önceki üretilmiş spotlar bayt bayt aynı | Poker Uzmanı, QA |
| 2 | Turn barrel yazısı | Yeni spotların sayılarıyla 12. yazı; c-bet quiz'ine bağlı | Yazıdaki her örnek sayı spot gerekçesinde de geçiyor (gerekçeler tam sayımla denetleniyor), başabaş yeniden hesaplanıyor | Content, Poker Uzmanı, QA |
| 3 | C-bet quiz'ine 2 soru (8 → 10) | Yeni spotlara bağlı bir bahis, bir check sorusu | Cevap spotun cevabıyla aynı, sorudaki sayılar spot gerekçesindekilerle aynı (testli) | Poker Eğitim, QA |

Çalışmayan roller: Data Analyst (kullanıcı verisi yok), Davranış Bilimleri / UI/UX / Backend (yeni mekanik, ekran, uç nokta yok), Frontend (kod değişikliği yalnızca veri).

## 2. Çıktılar

### Poker Uzmanı — 60 spot: turn'de ikinci barrel ya da check (`b2-…`)

- Senaryo: cash, 100 BB. BTN 2,5 BB açar, BB call eder. Flop'ta BB check, BTN 1,8 BB c-bet, BB call. Turn'de BB check; pot 9,1 BB. Kahramanın turn'de çifti yok (çekiş olabilir). Seçenekler: Check ya da 6 BB (pot'un yaklaşık üçte ikisi). Board çiftsiz.
- BB'nin aralığı: buton açılış aralığı − AA, KK, QQ, AK (5. bölümle aynı). **Flop call kuralı:** her çift, her floş ve kent çekişi (gutshot dahil), elinde as olan ya da board'un üstünde iki kartı olan eller. **Turn call kuralı (temel):** iki çift ve üstü, board'un ikinci büyük kartı ya da daha yüksek bir çift, floş çekişi, açık uçlu ya da çift gutshot kent çekişi. Check-raise yok.
- Her BB kombinasyonu için kahramanın showdown payı s, 44 river kartının hepsi sayılarak bulunur (Monte Carlo yok). **Varsayım: iki yolda da river'da bahis yok.** Bahsin check'e göre farkı call eden elde 6(2s − 1), fold eden elde 9,1(1 − s).
- Üç turn call senaryosu: sıkı (iki çift+, üst çift/overpair, güçlü çekiş), temel, geniş (her çift, her çekiş). Cevap üçünde aynı ve fark kombinasyon başına en az 0,07 × 6 BB olmalı.
- Sonuç: 60 spot, 30 bahis / 30 check. Üretecin 8. bölümü (tohum 20261181). Önceki 698 üretilmiş spot ve `ranges.json` bayt bayt aynı. `cbet` konusu 5 → 65.
- Gerekçe: call eden pay, onlara karşı showdown payı, call başına kayıp, fold edip seni yenecek pay, toplam (kazanç − maliyet) ve el başına ortalama fark. Kapanış cümlesi sayıya bağlı koşullu: ilk taslaktaki "fold edecek ellerin çoğu seni yenerdi" cümlesi 15 spotta yanlıştı (bkz. hata B2-1); yayından önce düzeltildi.
- **Model bulgusu:** ilk taslakta turn'de her çift call ediyordu; 60 spotun 59'u check çıktı. Bu, gerçekte 2/3 pot bahse zayıf çiftlerle fold eden BB'yi temsil etmiyordu. Temel kural "ikinci çift ve üstü" yapıldı, "her çift" geniş senaryoya alındı.
- Eğilim (bu modelde): board'da as ya da papaz olan spotlar 30 check cevabının 24'ü, 30 bahis cevabının 8'i. Yazıda "eğilim, kural değil" diye geçiyor ve testli.

### QA

- `hands.test.ts` › "turn ikinci barrel spotları (b2-)": kent çekişini pencere kümeleriyle, floş çekişini renk sayımıyla üreteçten bağımsız yeniden yazar; flop ve turn call kurallarını uygular, 44 river kartını sayar; üç senaryoda işaret ve 0,07 eşiği; gerekçedeki call payı, showdown payı, fold-ve-yenen pay ±0,6 puan, ortalama fark ±0,06 BB. Notun kuralları içerdiği, pot 9,1 ve sıranın kahramanda olduğu da denetleniyor.
- İki bozma denemesi yakalandı: cevabı ters çevrilmiş spot (`b2-QcTs-Kd5h3d4d`) ve gerekçede değiştirilmiş yüzde (%5 → %9).
- Yazı testi: üç örneğin sayıları spot gerekçesinde ve yazıda; 6 / 15,1 ≈ %39,7; 24/8 eğilimi.
- Quiz testi: 9. ve 10. soruların cevabı spotun cevabıyla aynı, sayılar spot gerekçesinde de geçiyor; yazı quiz'in `posts` listesinde.
- 1. örnekteki "fold edip seni yenenlerin çoğu elinde as ya da papaz olan eller" iddiası betikle ölçüldü: %53 as, %34 papaz (toplam %87). Testte değil, raporda.
- Playwright 390 / 1366 px: yazı (taşma 0, 15 madde, "Quiz ile tekrarla" → `/quiz/c-bet-ve-barrel`), `b2-QdJs-7s3c6s2d` masada (başlık, 9,1 pot, "Bahis 6 BB", "Doğru!"), "Neden?" → yazılı gerekçe madde listesiyle (API anahtarı yok, 503 beklenen; F-1 yedeği çalıştı), filtre "C-bet ve barrel (65)", quiz'de 9–10. sorular ve cevaptan sonra iki spot bağlantısı (200). Konsol: yalnızca beklenen 503. Açık tema, Pages, ekran okuyucu denenmedi.
- `npm test` 960/960 (ek blog testiyle `hands.test.ts` 867/867), `npm run typecheck` temiz, `npm run build` temiz.

### Content — `turn-ikinci-barrel` (12. yazı)

Terimler (c-bet, ikinci barrel, showdown payı, semi-blöf), %39,7 başabaş kuralı ve turn'deki iki eksiği (aralık flop'ta daralır; elin bazen kazanır ya da gelişir), iki gruplu hesap, üç örnek (QJo 7-3-6-2 bahis, 97s A-2-3-4 check, A5s K-7-4-3 semi-blöf), akılda kalacak üç nokta, varsayımlar ve sınırlar (river'da bahis yok varsayımının semi-blöfleri etkileyebileceği açıkça), alıştırma ve sorumlu oyun notu.

### Poker Eğitim — `c-bet-ve-barrel` quiz'i 9. ve 10. sorular

9: QJo, 7-3-6-2: bahis (fold edecek ellerin çoğu seni yenerdi; ≈ +3 BB). 10: 97s, A-2-3-4: check (fold ettirecek el ≈ %3; ≈ −4,7 BB). Çeldiriciler yaygın hatalar: "her zaman barrel", "board korkutucu", "showdown değeri yok o yüzden blöf". Quiz 10 soruda, üst sınırda.

## 3. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Sonuç |
|---|---|---|
| 1 | 60 ≥ 50 spot; not, bağımsız test, sınırda yok, önceki çıktı bayt bayt aynı | ✅ |
| 2 | Yazıdaki her örnek sayı testli | ✅ (1. örnekteki el bileşimi iddiası yalnızca raporda ölçüldü) |
| 3 | Cevap ve sayılar testli | ✅ |

Poker iddialarının gözden geçirilmesi:
- **River'da bahis yok** varsayımı en büyük basitleştirme. Kahraman çekişini tamamladığında river'da value alamıyor (semi-blöfleri küçümser), BB de güçlü ellerle river'da bahis yapamıyor (check yolunu iyimser gösterir). Net yönü bilinmiyor; doğrulanamadı.
- Flop ve turn call kuralları ekip tahmini; oyuncu havuzu verisi ya da solver ile karşılaştırılmadı. Sıkı/geniş senaryolar cevabın kurala duyarlılığını sınırlıyor ama gerçek frekansları doğrulamıyor.
- Kahramanın flop c-bet aralığı modellenmedi (her elle c-bet). Solver'ların turn'de kullandığı karışık stratejiler ve denge (blöf/value oranı) yok; cevap bu rakip modeline karşı en iyi hamle.
- Tek bahis boyutu (6 BB). Overbet, küçük barrel yok.

## 4. Sonraki öneriler

1. Kalıcı talimat: en az spotlu konular artık `savunma` ve `spr` (6'şar). `savunma` için BB'den açılışa call/fold (pot odds + realization) modeli kurulabilir mi bakılmalı; realization varsayımı sınırda spotları eler.
2. `b2` genişletme: river'da kahramanın value bet'ini modellemek (çekiş tamamlanınca) ya da delayed c-bet (flop check, turn bahis).
3. B-1 ürün kararı geldiyse `acceptable` alanı + c39.

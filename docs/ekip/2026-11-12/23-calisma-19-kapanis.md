# 19. çalışma — kapanış raporu (2026-11-12)

## CEO önceliklendirme

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Kalıcı talimat: en az spotlu konu (`savunma` 6, `spr` 6) | `savunma`'ya ≥ 50 doğrulanabilir spot | Cevap testte bağımsız yeniden ölçülüyor, sınırda olanlar yok, varsayımlar `note`'ta, önceki 758 üretilmiş spot bayt bayt aynı | Poker Uzmanı, QA |
| 2 | Yeni spotları öğretime bağlama | Blind savunması quiz'i ve yazısı yeni yöntemi ("gereken oran") anlatsın | Sayılar testli, quiz 5–10 soru sınırında, yazı varsayımı açıkça söylüyor | Poker Eğitim, Content, QA |

Dal: `3x1qey` (18) ana dala alınmamıştı; çalışma onun üzerine kuruldu. Yan dallarda zincir dışı yeni commit yok (`56jps3`, `hou5l2`, `05x26x` ve eskiler bilinen durumda).

## 1. BB savunması spotları (`bd-…`, 60 spot) — Poker Uzmanı, QA

**Model** (`scripts/generate-ranges.mts`, 9. bölüm, tohum 20261190/91):
- UTG/HJ/CO/BTN sitedeki açılış aralığıyla 2,5 BB açar; CO ve BTN ayrıca 3 BB. SB fold eder. Cash, 100 BB, rake yok.
- Gereken equity = (A − 1) / (2A + 0,5): 2,5 BB → %27,3; 3 BB → %30,8.
- Ham equity açılış aralığına karşı Monte Carlo (gösterilen sayı 80.000 deneme).
- **Varsayım:** pozisyon dışında ham equity'nin bir kısmı kullanılır (equity realization). Temel %80. Call cevabı **%70'te**, fold cevabı **%90'da** da eşikten en az 1 puan uzak olmalı. Arada kalan eller (gri bölge) alınmadı.
- 3-bet seçeneği yok; TT+, AQs+, AQo+ alınmadı.

**Sonuç:** 60 spot, 30 call / 30 fold. Dağılım: UTG 2,5 (6 C / 8 F), HJ 2,5 (6/8), CO 2,5 (6/5), BTN 2,5 (6/0), CO 3 (6/8), BTN 3 (0/1). Butona karşı 2,5 BB'de fold spotu çıkmıyor: en zayıf el bile ~%29 taşıyor, %90 × 29 eşiğe 1 puandan yakın.

**Model revizyonları (yayından önce):**
- D-0: ilk sürümde bant %65–%95'ti; yalnızca 3 fold spotu çıktı (ikinci denemede 17). Zayıf offsuit ellerin pozisyon dışında %90'dan fazlasını kullanması gerçekçi olmadığı için bant %70–%90 yapıldı ve CO/BTN 3 BB açılışı eklendi (c34 ile aynı senaryo).
- D-1: fold gerekçesi "equity'nin yaklaşık %102'sini kullanman gerekirdi" diyordu. Ham equity eşiğin altındaysa artık "tamamını kullansan bile kârlı olmazdı" yazıyor (6 spot); koşul yuvarlanmış sayıya değil gerçek değere bağlı.

**QA:**
- Üreteçten bağımsız test (`hands.test.ts`, "BB savunması spotları"): fiyat `replay`'den, açılış aralığı `ranges.json`'dan, ayrı tohumlu 60.000 denemelik Monte Carlo; call için eq × 0,7 ≥ gereken + 0,5 puan, fold için eq × 0,9 ≤ gereken − 0,5 puan; gerekçedeki equity ±0,9 puan, çarpımlar ±0,1; hariç tutulan eller ve `note`'taki aralık yüzdesi.
- Mutasyon denemesi: `bd-BTN25-Kh8s`'nin cevabı ters çevrildi → yakalandı; `bd-UTG25-AdJc`'nin equity'si 2 puan değiştirildi → yakalandı.
- `drills.json`'un ilk 758 kaydı eskisiyle bayt bayt aynı; `ranges.json` değişmedi.

## 2. Quiz ve yazı — Poker Eğitim, Content, QA

- `blind-savunmasi` quiz'ine 9. ve 10. sorular (artık 10 soru, üst sınır): A7o vs HJ (%70 realization'da bile ≈ %29,7 > %27,3; gereken oran ≈ %64) → `bd-HJ25-Ac7h`; 83s vs CO 3 BB (30,8 / 32,9 ≈ %93, fold; 2,5 BB'de ≈ %83 gri bölge) → `bd-CO3-8s3s`.
- `blind-savunmasi-fiyat-aralik-pozisyon` yazısına "Realization'ı bilmiyorsan: gereken oranı hesapla" bölümü: oran = gereken / ham equity; < %70 call, > %90 fold, arası gri bölge; %70/%90'ın varsayım olduğu açıkça yazıldı. Okuma süresi 6 → 7 dk.
- 3 test (`quizzes.test.ts`): iki equity yeniden ölçülüyor, oranlar, spot gerekçeleriyle aynı sayılar, yazıdaki altı ifade.
- README: 883 spot, 53 quiz sorusu, yeni tablo satırı ve test açıklaması.

## Sağlık

`npm test` **1025/1025**, `npm run typecheck` temiz, `npm run build` temiz. `npm run ranges` ≈ 1,4 dk.

Playwright (sunuculu, veritabanı ve API anahtarı yok), 390 ve 1366 px: `bd-HJ25-Ac7h` masada açılıyor, not görünüyor, "Call (1,5 BB daha)" doğru hamle; `bd-CO3-8s3s`'de yanlış cevap sonrası "Neden?" yazılı gerekçeyi gösteriyor (F-1 yedeği); yazı bölümü, quiz 10. soru, filtre "Blind savunması (66)". Yatay taşma 0, konsol hatası ve 4xx 0. Açık tema, Pages ve ekran okuyucu denenmedi.

## Kalite kontrolü (CEO)

| Çıktı | Kriter | Durum |
|---|---|---|
| 60 `bd-` spotu | ≥ 50, bağımsız test, sınırda yok, varsayım notta, önceki spotlar aynı | ✅ |
| Quiz 9–10, yazı bölümü | Sayılar testli, varsayım açık | ✅ |

**Poker iddialarının gözden geçirilmesi:**
- Realization tüm eller için tek bir sayı kabul ediliyor. Gerçekte suited/bağlantılı eller daha çok, domine olmaya yatkın offsuit eller daha az kullanır. %70–%90 bandı bunu kısmen karşılıyor; ama örneğin A4o vs HJ ya da K5o vs BTN call cevabı, gerçek realization %70'in altındaysa geçersizleşir. **Doğrulanamadı** (solver ya da oyuncu verisi yok).
- Rake yok. Rake, BB'nin call aralığını daraltır; call cevapları rake'li oyunda daha az güvenli.
- 3-bet seçeneği yok; AJs vs CO, KQo vs CO gibi bazı call'larda 3-bet daha iyi olabilir. Soru yalnızca call ile fold'u karşılaştırıyor ve not bunu söylüyor.
- Açılış aralıkları sitenin yaklaşık aralıkları; solver çıktısı değil.

## Atlanan roller

Data Analyst (veri yok), Davranış Bilimleri (yeni mekanik yok; quiz kuralları değişmedi), UI/UX, Frontend, Backend (yeni ekran ya da uç nokta yok).

## Sonraki öncelikler

1. Kalıcı talimat: en az spotlu konu artık **`spr` (6)**. SPR modeli henüz yok: aday, flop'ta "SPR'ye göre all-in/commit mi, pot kontrolü mü" kararı (stack/pot oranı + kesin sayım). Kurulamazsa engel raporlanmalı.
2. `bd` genişletme: SB'ye karşı BB (pozisyonda, farklı realization) ve 2 BB min-raise; turnuvada ante'li savunma.
3. B-1 kararı gelirse `acceptable` alanı + c39.

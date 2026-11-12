# 9. çalışma: tam dışa aktarma ve sunucu konu tablosu (G-2), ICM hesap makinesi girdisi

**Tarih:** 2026-11-12 · **Dal:** `claude/wizardly-meitner-hou5l2` (varsayılan dal `8ffc135` üzerinde)

## Başlangıç durumu

- **P-1 ve P-3 kapandı.** Kullanıcı PR #1 (8. çalışma zinciri) ve PR #2'yi (`ch8abk`, "Cheers" markası) varsayılan dala (`claude/charming-davinci-emhvz1`) aldı. Birleştirme commit'i (`ce7c8ce`) çakışmaları çözmüş; ana zincirle farkı yalnızca marka dosyaları ve 2 yeni test. Ekip kendi dalını ayrıca taşımak zorunda kalmadı.
- Sağlık: `npm test` 631/631, `npm run typecheck` temiz.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | G-2 | Konu tablosu, çalışma önerisi ve dışa aktarma 5000 sınırından etkilenmesin | Konu tablosu SQL `GROUP BY` ile birebir; CSV/JSON 5000'den fazla cevabı eksiksiz ve tekrarsız içeriyor; başka kullanıcının verisi dönmüyor; yükleniyor/hata durumu var; test | Backend, Frontend, QA |
| 2 | ICM hesap makinesi, stack 0 (açık iş 8) | Elenmiş oyuncu ve Türkçe sayı yazımı yanlış sonuç vermesin | Atlanan değerler kullanıcıya söyleniyor; "1.500" 1500 okunuyor; sonuç elle hesapla aynı; test | Poker Uzmanı, Frontend, QA |
| 3 | "Blind savunması" filtresi (açık iş 6) | Tarayıcıda doğrulamak | URL'deki filtre masada seçili kalıyor | QA |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok; testteki 12.075 cevap yapay, analiz edilmedi), **Poker Eğitim, Content** (B-1 kararı bekliyor; gerçek bir içerik açığı tespit edilmedi), **UI/UX, Davranış Bilimleri** (yeni ekran ya da mekanik yok; düğme durumları mevcut desenle yapıldı).

## 1. G-2 (Backend, Frontend, QA)

### Backend

- `GET /api/attempts` artık `totals.byTopic` da döndürüyor: `SELECT topic, count(*), count(*) FILTER (WHERE correct) … GROUP BY topic`, yalnızca oturumdaki kullanıcının satırları. Yeni veri toplanmıyor.
- Yeni `GET /api/attempts/export?after=<id>`: oturumdaki kullanıcının bütün cevapları, id'ye göre 5000'lik sayfalar, `{ attempts, next }`. Giriş yoksa 401; `after` yalnızca 1–18 haneli sayı (aksi 400). `id` yalnızca imleç olarak `next`'te döner, satırlarda yok.
- `db/schema.sql`: `attempts(user_id, id)` dizini (sayfalama için), başlık yorumu "Cheers".
- **En az yetki:** iki sorgu da `user_id = $1` ile oturumdaki kullanıcıya bağlı; başka bir kullanıcının id'si imleç olarak verilse bile yalnızca kendi satırları gelir.

### Frontend

- `store.ts`: `Totals` tipi, `addToTotals` (yeni cevap konu toplamını da artırır), `statsFromCounts`, `fetchAllAttempts` (sayfa sayfa, en fazla 1000 sayfa).
- `Profile.tsx`: konu tablosu ve çalışma önerisi üyede sunucu toplamlarından. CSV/JSON düğmeleri üyede bütün cevapları indiriyor; indirme sürerken düğme "Hazırlanıyor…" ve devre dışı (`aria-busy`), hata olursa `role="alert"` mesajı. Açıklama metni üye/misafir için ayrı ("en fazla son 2.000" misafirde).
- Dosya adı `poker-defteri-<tarih>` → `cheers-<tarih>` (marka kararıyla tutarlı).

### QA (yerel PostgreSQL 16, `npm run build && npm start`, Playwright 390 ve 1366 px)

| # | Kontrol | Beklenen | Sonuç |
|---|---|---|---|
| E-1 | A kullanıcısı: 75 API + 12.000 SQL cevabı; `/api/attempts` toplamı | 12.075 / 4.023 doğru | ✅ |
| E-2 | `byTopic` | SQL `GROUP BY` ile aynı (8 konu) | ✅ birebir |
| E-3 | Dışa aktarma sayfaları | 12.075 satır, tekrarsız | ❌ ilk denemede **17.637** satır → düzeltildi → ✅ 3 sayfa, 12.075 satır, 4.023 doğru |
| E-4 | B kullanıcısı (10 cevap) | Yalnızca kendi 10 satırı, `next: null` | ✅ |
| E-5 | Tam 5000 cevaplı kullanıcı | 1 sayfa, `next: null` (boş ikinci sayfa yok) | ✅ |
| E-6 | Giriş yok / `after=abc` / `after=1;DROP` / 20 haneli sayı | 401 / 400 / 400 / 400 | ✅ |
| E-7 | `/profil` konu tablosu (390, 1366) | SQL ile aynı (ör. 3-bet 802/2415) | ✅ |
| E-8 | Tarayıcıda "CSV indir" | 12.075 alıştırma satırı, 4.023 "evet", `cheers-2026-11-12.csv` | ✅ |
| E-9 | Konsol hatası | Yok | ✅ |

**E-3 hatasının nedeni:** sorguda `id::text AS id` ve `ORDER BY id` vardı. PostgreSQL'de `ORDER BY`'daki yalın ad önce çıktı sütununa bağlanır; sıralama metin olarak yapıldı ("10" < "9"), imleç ise sayı olarak karşılaştırıldığı için satırlar tekrarlandı. `ORDER BY attempts.id` ile düzeltildi, sorguya açıklama yorumu eklendi. Birim testleri bunu yakalayamazdı; gerçek veritabanı denemesi şarttı.

## 2. ICM hesap makinesi (Poker Uzmanı, Frontend, QA)

### Bulgular

- **I-1 (orta):** girdi `split(/[\s;,]+/)` ile ayrılıyordu. Türkçe binlik yazımı "1.500" **1,5** okunuyor, "1,500" ise 1 ve 500 olarak iki oyuncuya bölünüyordu. Sonuç sessizce yanlış çıkıyordu.
- **I-2 (düşük):** 0, negatif ya da okunamayan değerler sessizce atılıyor, satır numaraları kayıyordu. Elenmiş oyuncu yazan kullanıcı neyin hesaplandığını göremiyordu.

### Düzeltme

- `parseNumberList` (`src/lib/poker/math.ts`): "1.500", "12.000", "1.250.000" binlik okunur; "12.5" ya da "0.125" gibi ondalıklar korunur; atlanan değerler sayılır.
- Hesap makinesi atlanan stack/ödül sayısını, 9 oyuncu sınırını ve "N oyuncu için yalnızca ilk N ödül kullanıldı" notunu gösteriyor. Stack sütunu `tr-TR` biçiminde (5.000), kullanıcı ne okunduğunu görüyor.

### Poker doğrulaması

Varsayım: Malmuth-Harville modeli (her sıranın olasılığı kalan chip payıyla orantılı). Bu bir modeldir; gerçek bitiş olasılıklarını, oyuncu becerisini ve gelecek blind'ları hesaba katmaz.

- Elenmiş oyuncu girdiden çıkarılınca kalan oyuncular ilk N ödül için yarışır. Bu, elenen oyuncuların en düşük ödülleri zaten almış olmasıyla tutarlı (ödül yapısı en alttan doluyor).
- El hesabı: 3000/1000, 70/30 → 0,75·70 + 0,25·30 = **60** ve 40. 5000/3000/2000, 50/30/20 → P(1.) = 0,5; P(2.) = 0,3·5/7 + 0,2·5/8 ≈ 0,3393; P(3.) ≈ 0,1607 → **38,39**. Tarayıcıda "5.000, 0, 3.000, 2.000" + "50, 30, 20, 10" girişiyle aynı değerler çıktı (38,39 / 32,75 / 28,86; toplam 100).
- `icm()` doğrudan sıfır stack'le çağrılırsa o oyuncuya 0 verir, diğerleri onsuz hesapla aynı (testli).

### Testler

`math.test.ts`: iki el hesabı, sıfır stack, `parseNumberList` (3 test). `store.test.ts` (yeni): `statsFromCounts` listeden hesapla aynı, sıfır cevaplı konu, `addToTotals` (2 test).

## 3. "Blind savunması" filtresi (QA)

`/alistirma?oyun=cash&konu=savunma` iki boyutta açıldı: konu seçimi `savunma` olarak kalıyor, URL korunuyor, konsol hatası yok. Havuzda 6 savunma spotu var (`hands.ts`). Altı elin tek tek gösterildiği ayrıca tıklanarak denenmedi.

## 4. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| G-2 konu tablosu | SQL ile birebir | ✅ |
| G-2 dışa aktarma | Eksiksiz, tekrarsız, yalnızca kendi verisi, durumlar var | ✅ (bir hata QA'da bulundu ve düzeltildi) |
| I-1 / I-2 ICM | Sessiz hata yok, el hesabıyla aynı, test | ✅ |
| Blind savunması filtresi | Tarayıcıda seçili kalıyor | ✅ (6 elin tamamı tıklanarak sayılmadı) |

Poker iddiaları yeniden okundu: ICM sayıları elle ve testle doğrulandı; modelin varsayımı (Malmuth-Harville) bu raporda ve hesap makinesi açıklamasında "beklenen pay" olarak sunuluyor, kesin sonuç olarak değil.

Sağlık: `npm test` **640/640**, `npm run typecheck` temiz, `npm run build` temiz.

## Açık kalanlar

- Gelişim kartı (G-1) hâlâ son 5000 cevaba göre ve bunu söylüyor; bilinçli karar.
- Misafir tarayıcısı en fazla 2000 cevap saklıyor; artık profilde yazıyor.
- `parseNumberList` "2.250"yi binlik (2250) okur; İngilizce yazımla 2,25 kastedilmişse yanlış olur. "0.125" gibi 0 ile başlayanlar ondalık kalır. Türkçe yazım öncelikli olduğu ve tablo okunan değeri gösterdiği için kabul edildi.

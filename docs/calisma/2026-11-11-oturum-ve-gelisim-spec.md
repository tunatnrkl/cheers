# Alıştırma oturumu sağlığı ve Gelişim paneli: spesifikasyon (2026-11-11)

Roller: Davranış Bilimleri → UI/UX → Frontend → Backend. Kod yazımı Claude Code'a devredildi (en altta).
Gerekçe: README'de Aşama 3'te "Gelişmiş istatistikler (zaman içinde eğilim, pozisyon bazında döküm)" ⬜ duruyor. Ayrıca alıştırma masası bilinçli olarak "soru sayısı yok, eller arka arkaya gelir" diye tasarlandı ve üst çubukta bir "Seri N" sayacı var. Sonsuz akış ile seri sayacının birleşimi, platformun "bağımlılık yaratmama" ilkesiyle gözden geçirilmesi gereken tek mekanik.

---

## 1. Davranış Bilimleri değerlendirmesi

### Mevcut durum (koddan)

- `src/app/alistirma/Trainer.tsx`: eller sonsuz akar. Oturum özeti yalnızca kullanıcı butona basınca açılır. Kullanıcıya hiçbir doğal durma noktası sunulmuyor.
- Aynı dosya, 126–174. satırlar: art arda doğru sayısı `Seri {streak}` olarak gösteriliyor.
- Yanlış cevaplanan eller oturum içinde geri dönüyor. Oturumlar arası tekrar yok.

### Öneriler ve kanıt düzeyi

| # | Öneri | Neden | Kanıt düzeyi |
|---|---|---|---|
| D1 | **Her 20 elde bir "durak kartı":** kısa oturum özeti (doğruluk, en çok hata yapılan konu) ve iki eşit ağırlıklı buton: "Devam et" ve "Bugünlük bu kadar". Akış zorla kesilmez. Kart yalnızca bir duraklama noktası sağlar. | Sonsuz akışta durma işaretinin olmaması, kullanımın planlanandan uzun sürmesiyle ilişkilendirilmiştir. Ayrıca oturum sonu özeti geri bildirim ve öz değerlendirme sağlar. | Düşük–orta. Durma işaretleri konusundaki kanıt çoğunlukla gözlemsel ve küçük örneklemli HCI çalışmalarından geliyor. Belirli künyeler bu çalışmada **doğrulanamadı**. |
| D2 | **Oturumlar arası aralıklı tekrar:** yanlış cevaplanan el 1, 3 ve 7 gün sonra yeniden sorulur (yalnızca kullanıcı alıştırmaya kendisi geldiğinde; bildirim yok). | Aralıklı tekrar (spacing effect) ve geri getirme alıştırması (testing effect), kalıcı öğrenmede en sağlam bulgular arasındadır. | Güçlü. Cepeda ve ark. 2006 aralıklı tekrar meta-analizi; Roediger & Karpicke 2006; Adesope ve ark. 2017 testing effect meta-analizi. |
| D3 | **"Seri N" sayacını kaldır.** Yerine nötr bir oturum göstergesi koy: "Bu oturum: 12 / 15". | Seri sayaçları kaybetme kaygısı (loss aversion) üzerinden çalışır. Ödülü, düşünerek karar vermekten çok seriyi korumaya bağlar ve hızlı, dikkatsiz cevabı teşvik edebilir. Platform kumar bağlamına yakın olduğu için ödül döngüsü üretecek mekanikler bilerek dışarıda tutulmalı. | Düşük–orta. Seri bozulmasının sonraki davranışı etkilediğine dair tüketici davranışı çalışmaları var. Künye **doğrulanamadı**; öneri ihtiyat ilkesine dayanıyor. |
| D4 | **Mola hatırlatması:** 30 dakikalık kesintisiz kullanımdan sonra bir kez, kapatılabilir, sessiz bir not gösterilir: "Yarım saattir çalışıyorsun. Kısa bir mola, odaklanmaya yardımcı olabilir." Ayarlardan kapatılabilir, oturum başına en fazla bir kez çıkar. | Kısa molaların (micro-break) yorgunluğu azalttığı ve canlılığı artırdığı gösterilmiştir. Performans üzerindeki etkisi küçük ve göreve bağlıdır. | Orta. Albulescu ve ark. 2022 (PLoS ONE) mikro-mola meta-analizi; performans etkisi sınırlı. |
| D5 | **Karşılaştırma yalnızca kişinin kendi geçmişiyle yapılır.** Liderlik tablosu, rozet ve günlük seri takvimi yok. | Dış ödüller ve sosyal karşılaştırma içsel motivasyonu zayıflatabilir. Yetkinlik hissi ise kişinin kendi gelişimini görmesiyle desteklenir. | Orta. Öz-belirleme kuramı (Ryan & Deci 2000) güçlü bir çerçeve; eğitim uygulamalarındaki müdahale kanıtı karışık. |
| D6 | **Önerilen çalışma yükü:** günde 20–40 el (yaklaşık 15–25 dk), haftada 4–5 gün. Bu bir hedef değil, öneridir; arayüzde baskı olarak gösterilmez. | Kısa, dağıtılmış oturumlar tek uzun oturumdan daha iyi kalıcılık sağlar (D2 ile aynı kanıt). Kesin dakika sayısı ise kanıta değil, makul varsayıma dayanır. | Dağıtılmış alıştırma için güçlü; belirli sayılar için **doğrulanamadı** (varsayım). |

**Bilerek önerilmeyenler:** push bildirimi, "seriyi kaybetme" uyarısı, sanal para veya puan, rastgele ödül (sürpriz kutu), diğer kullanıcılarla sıralama, "bir el daha" türü teşvikler.

Sorumlu oyun bağlantısı: durak kartında ve mola notunda küçük bir "Sorumlu oyun" bağlantısı (`/sorumlu-oyun`) bulunur. Metin uyarıcı değil, bilgilendiricidir.

---

## 2. UI/UX önerisi

### 2a. Alıştırma masası: durak kartı (D1, D3, D4)

**Mobil (öncelik):**
- 20. elin cevabı ve gerekçesi gösterildikten sonra, aksiyon butonlarının yerine alttan bir kart çıkar (masa görünür kalır, üzeri karartılmaz).
- Kartın içeriği:
  1. Başlık: "20 el tamam"
  2. Tek satır özet: "Doğruluk %70 · En çok zorlanılan: Pot odds"
  3. Bağlantı: "Hatalı 6 eli gör"
  4. Yan yana, aynı boyutta iki buton: "Devam et" ve "Bugünlük bu kadar". İkincisi oturum özetini açar.
  5. Küçük bağlantı: "Sorumlu oyun"
- Butonlar en az 44 px yüksekliğinde, alt menünün üstünde, başparmak bölgesinde.

**Masaüstü:**
- Aynı kart, koç sohbetinin üstünde, sağ sütunda görünür. Masa ve klavye kısayolları çalışmaya devam eder: Enter "Devam et" demektir.

**Üst çubuk:** "Seri N" kaldırılır. Yerine "12 / 15 doğru" yazar; tıklayınca oturum özetini açar.

**Mola notu (D4):** üst çubuğun altında, tek satır, kapatılabilir bir bant. Masayı kaydırmaz, kayan bir pencere (modal) değildir.

### 2b. Profil → "Gelişim" bölümü (Aşama 3 istatistikleri)

**Akış:** Profil → "Gelişim" sekmesi → kartlar → bir kartta "Bu spotu masada çalış" → `/alistirma?konu=…` (mevcut derin bağlantı yapısı).

**Mobil (tek sütun, sırayla):**
1. **Son 4 hafta:** haftalık doğruluk çizgisi. Her noktanın altında el sayısı yazar (n). n < 15 olan haftalar soluk ve kesik çizgiyle gösterilir, "az veri" notu eklenir.
2. **Pozisyona göre:** 6 satırlık yatay çubuk listesi (UTG…BB), her satırda "%62 · 48 el". n < 10 olan satırlarda "Daha fazla el gerekli" yazar.
3. **Oyun tipine göre:** Cash / Turnuva, iki satır.
4. **Sokağa göre:** Preflop / Flop / Turn / River.
5. **Tekrar bekleyen eller:** "Bugün tekrar edilecek 4 el" ve "Masada aç" butonu (D2).

**Masaüstü:** iki sütunlu ızgara. Solda 1 ve 5, sağda 2, 3 ve 4.

**Yazım ilkesi:** "Zayıf" yerine "Çalışılacak alan" ifadesi kullanılır. Yüzdelerin yanında her zaman örneklem büyüklüğü görünür. Küçük örneklemden kesin sonuç çıkarılmaz.

---

## 3. Frontend bileşen spesifikasyonu

| Bileşen | Yer | Props / durum |
|---|---|---|
| `CheckpointCard` | `src/components/` | `answered: number`, `correct: number`, `weakTopic?: Topic`, `wrongIds: string[]`, `onContinue()`, `onStop()` |
| `BreakNotice` | `src/components/` | `onDismiss()`. Görünürlüğü `useSessionTimer` hook'u yönetir. |
| `ProgressPanel` | `src/app/profil/` | `attempts: Attempt[]` (mevcut store'dan) |
| `TrendChart` | `src/app/profil/` | `weeks: {start, n, acc}[]`. Inline SVG; kütüphane yok. |
| `BreakdownList` | `src/app/profil/` | `rows: {label, n, acc}[]`, `minN: number` |
| saf fonksiyonlar | `src/lib/client/stats.ts` | `weeklyTrend(attempts, now)`, `byPosition(attempts)`, `byGame(...)`, `byStreet(...)`, `dueForReview(attempts, now)`. El bilgisi `HAND_BY_ID` üzerinden gelir. |

**Durumlar:**
- **Boş** (0 deneme): "Henüz çözülmüş el yok" ve "Masaya git" butonu. Grafik çizilmez.
- **Az veri** (1–19 deneme): yalnızca sayılar gösterilir. Trend grafiği yerine "Eğilim için en az 20 el gerekli" yazar.
- **Yükleniyor:** kart iskeletleri (sabit yükseklik, layout kayması yok).
- **Hata** (API başarısız): "İstatistikler yüklenemedi" ve "Tekrar dene" butonu. Giriş yapılmamışsa localStorage verisiyle devam edilir ve "Bu cihazdaki veriler" etiketi gösterilir.

**Erişilebilirlik:**
- `TrendChart` için `<figure>` ve `<figcaption>` kullanılır. Görsel grafiğin yanında ekran okuyucuya açık bir `<table>` alternatifi bulunur (görsel olarak gizli).
- Çubuklarda renk tek bilgi taşıyıcısı değildir; yüzde metni her zaman yazılır.
- `CheckpointCard` açılınca odak "Devam et" butonuna gider. Kart `aria-live="polite"` ile duyurulur, odak tuzağı kurulmaz.
- `BreakNotice` için `role="status"` kullanılır. Kapatma butonunun `aria-label` değeri "Mola notunu kapat" olur.
- `prefers-reduced-motion` açıksa kart animasyonsuz açılır. Tüm hedefler en az 44 px.

---

## 4. Backend gereksinimleri

**Karar:** yeni tablo ve yeni uç nokta yok.
- Pozisyon, oyun tipi ve sokak bilgisi `hand_id` üzerinden `HAND_BY_ID`'den türetilir. Bunları `attempts` tablosuna kopyalamak gereksiz veri tekrarı olur.
- Mevcut `GET /api/attempts` zaten en fazla 5000 kaydı yalnızca oturum sahibine döndürüyor. İstatistikler istemcide saf fonksiyonlarla hesaplanır.
- Durak kartı aralığı ve mola notu tercihi (açık/kapalı) **yalnızca localStorage'da** tutulur. Bu tercihler sunucuya gönderilmez (veri minimizasyonu, en az yetki).
- Tekrar takvimi (D2) `attempts` geçmişinden hesaplanır. Ek tablo gerekmez.

**Güvenlik notu (bu çalışmada tespit edildi):**
- `POST /api/attempts`, istemcinin gönderdiği `at` zaman damgasını olduğu gibi kabul ediyor. Trend grafiği bu alana dayanacağı için gelecek tarihli kayıtlar grafiği bozabilir. **Önem: düşük** (yalnızca kullanıcının kendi verisini etkiler).
- Düzeltme: `at` > şimdi + 5 dk ise reddet ya da şimdiye sabitle. 1 yıldan eski kayıtları reddet. Zod şemasına `refine` eklenmeli.

---

## 5. Claude Code'a devredilen görevler

Bu belge bir spesifikasyondur; aşağıdakilerin hiçbiri koda uygulanmadı.

1. `src/lib/client/stats.ts` ve birim testleri: haftalık trend, pozisyon/oyun/sokak dökümü, `dueForReview` (1/3/7 gün). Test vakaları:
   - 0 deneme → boş dizi.
   - Aynı haftada 3 doğru ve 1 yanlış → `{n: 4, acc: 0.75}`.
   - 2 gün önce yanlış cevaplanmış el → bugün tekrar listesinde.
   - Daha sonra doğru cevaplanmış el → listeden çıkar.
2. `Trainer.tsx`: "Seri" sayacını kaldır. 20 elde bir `CheckpointCard`, 30 dakikada bir `BreakNotice` ekle. Klavye: Enter "Devam et".
3. `Profile.tsx`: "Gelişim" bölümü ve 3. bölümdeki dört durum.
4. `api/attempts/route.ts`: `at` doğrulaması.
5. README: Aşama 3 tablosunu ve "Bilinen sınırlar" bölümünü güncelle.

## CEO kalite kontrolü

- Başarı kriterleri:
  - Davranış önerilerinin her biri kanıt düzeyiyle verildi.
  - Mobil ve masaüstü yerleşimi tarif edildi.
  - Dört durum ve erişilebilirlik notları yazıldı.
  - Veri modeli kararı ve güvenlik gereksinimi açık.
  - Devir listesi test vakalarıyla birlikte verildi.

  → **Spesifikasyon olarak karşılandı.**
- Eksikler: özellik kodlanmadı ve kullanıcıyla test edilmedi. "Bilerek önerilmeyenler" listesindeki iki kaynak künyesi (durma işaretleri, seri etkisi) **doğrulanamadı**; uygulamadan önce kontrol edilmeli.
- Ürün kararı notu: D3 (seri sayacının kaldırılması), önceki tasarım kararına dokunan bir değişiklik. Proje sahibinin onayı olmadan uygulanmamalı.

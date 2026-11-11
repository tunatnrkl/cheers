# Alıştırma masasında oturum ritmi: davranış değerlendirmesi ve bileşen spesifikasyonu

**Tarih:** 2026-11-11 · **Roller:** Davranış Bilimleri → UI/UX → Frontend · **İlgili kod:** `src/app/alistirma/Trainer.tsx`

## 1. Davranış Bilimleri değerlendirmesi

### Mevcut durum (koddan)

- Soru sayısı ve oturum sonu yok. Eller arka arkaya gelir ve Enter ya da boşluk tuşu bir sonrakini anında açar (`Trainer.tsx`, `next()`).
- Üst çubukta `Seri N` sayacı var. Art arda 2 ya da daha fazla doğru cevapta görünür.
- Elin yaklaşık %20'sinde daha önce yanlış yapılan bir el geri gelir. Bu bir tekrar mekanizması, ama zamanlaması rastgele.
- Oturum özeti yalnızca kullanıcı isterse açılır. Süreye ya da el sayısına bağlı bir duraklama noktası yok.

### Değerlendirme

| Mekanik | Risk / değer | Kanıt düzeyi |
|---|---|---|
| Sonsuz akış, durak yok | "Bir el daha" döngüsü. Doğal bir bitiş noktası olmayan akışlar oturumları uzatır, ama uzunluk öğrenmeyi artırmaz. Kumar bağlamına yakın bir üründe ayrıca hassas bir nokta. | Düşük–orta: "durma işareti" (stopping cue) kavramı ve sonsuz kaydırmalı akışlar üzerine çalışmalar var, ama bu turda belirli bir kaynak doğrulanamadı. Doğrudan poker eğitimi üzerine çalışma bulunamadı (**doğrulanamadı**). |
| `Seri N` sayacı | Doğru cevabın nedenini değil, art arda doğru gitmeyi ödüllendiriyor. Seri bozulmasın diye zor spotlardan kaçma ya da acele etme davranışı doğurabilir. Kazanma serisi algısı, kumardaki "sıcak el" yanılgısına benzer bir çerçeve. | Düşük–orta: oyunlaştırma literatüründe streak'lerin kısa vadede katılımı artırıp içsel motivasyonu zayıflatabildiği gösterilmiş. Sonuçlar karışık. |
| Yanlışların rastgele geri gelmesi | Faydalı. Geri çağırma alıştırması (retrieval practice) ve aralıklı tekrar (spacing) öğrenmede en sağlam bulgular arasında. Rastgele zamanlama yerine artan aralık daha verimli olur. | Yüksek: Dunlosky ve ark. 2013 derlemesi; Cepeda ve ark. 2006 meta-analizi. |
| Konu filtresi ile tek konu çalışma | Kısa vadede iyi hissettirir. Konuları karıştırmak (interleaving) ise ayırt etme becerisini daha iyi geliştirir. | Orta: Rohrer ve Taylor 2007; Brunmair & Richter 2019 meta-analizi. Etki, materyalin türüne göre değişiyor. |
| Mikro mola | Kısa molaların enerji ve yorgunluk algısını iyileştirdiği gösterilmiş. Performansa etkisi daha zayıf ve tutarsız. | Orta: Albulescu ve ark. 2022 meta-analizi. |

### Öneriler

1. **Yumuşak duraklama noktası.** 20 elde bir ya da 25 dakikada bir (hangisi önce gelirse) masanın yerine kısa bir ara kartı göster. Kart engellemez: tek dokunuşla devam edilebilir. Amaç kullanıcıya bir bitiş noktası sunmak, onu durdurmak değil.
2. **`Seri N` sayacını kaldır.** Yerine, son 20 eldeki doğruluğu konu bazında gösteren nötr bir bilgi koy. Bu zaten özette var, üst çubukta gerek yok. Rozet, puan, liderlik tablosu ya da günlük seri gibi mekanikler **eklenmemeli**.
3. **Ara kartında öğrenme odaklı bilgi.** Bu bölümde en çok hata yapılan konu, bir cümlelik ders notu ve iki seçenek: "Devam et" ve "Burada bırak". İkisi de görsel olarak eşit ağırlıkta olmalı; birini öne çıkarmak kullanıcıyı yönlendirir.
4. **Uzun oturum notu.** 60 dakikayı geçen kesintisiz oturumlarda ara kartına tek cümle eklenir: "Bir saattir çalışıyorsun; kısa bir mola, öğrendiklerini pekiştirmeye yardımcı olabilir." Suçlayıcı ya da ahlak dersi veren bir dil kullanılmaz. Sorumlu oyun sayfasına bağlantı yalnızca bu kartta, küçük ve sakin bir biçimde yer alır.
5. **Ayarlanabilirlik.** Ara kartının sıklığı kullanıcı tarafından değiştirilebilmeli (10 / 20 / 40 el veya kapalı). Tercih `localStorage`'da tutulur.

Süre ve yük için öneri: **20–30 dakikalık bölümler, 3–5 dakikalık aralar, günde toplam 60–90 dakikadan fazlası önerilmez.** Bunlar genel çalışma önerileridir; poker eğitimine özgü bir kanıt yok (**doğrulanamadı**).

## 2. UI/UX: ara kartı

### Kullanıcı akışı

```
El çöz → (cevap ver) → [Sonraki el]
                         │
       20. el veya 25 dk ─┘→ Ara kartı ─┬→ Devam et → yeni el (sayaç sıfırlanır)
                                         ├→ Burada bırak → Oturum özeti (mevcut Summary)
                                         └→ Ayar (dişli) → sıklık seçimi
```

Ara kartı yalnızca **cevap verildikten sonra, "Sonraki el" basıldığında** gelir. El ortasında hiçbir zaman açılmaz.

### Mobil (öncelikli, < 640px)

- Masanın yerini tam genişlikte bir kart alır. Alt menü görünür kalır.
- Üstten alta: başlık "Kısa bir durak" → 3 küçük istatistik (bu bölümde el / doğru / süre) → "Bu bölümde en çok zorlandığın konu: X" + tek cümlelik not → iki eşit buton (yan yana, her biri en az 48px yüksek) → küçük "Sıklığı ayarla" bağlantısı.
- Başparmakla ulaşılsın diye butonlar kartın alt üçte birinde yer alır.

### Masaüstü (≥ 1024px)

- Masa alanının ortasında en fazla 480px genişliğinde bir kart. Masa arkada soluk görünür. Koç sohbeti paneli sağda açık kalır.
- Koç panelinde "Bu bölümü yorumla" kısayolu görünür (mevcut `AiPanel`, `practice` bağlamıyla). Statik sitede (`STATIC_SITE`) bu kısayol gizlenir.

### Bileşenler

| Bileşen | Yeni / mevcut |
|---|---|
| `BreakCard` | Yeni. Ara kartı |
| `Summary` | Mevcut. "Burada bırak" seçeneği buraya gider |
| `topicStats`, `weakTopics` | Mevcut. Bölümün zayıf konusu bunlarla bulunur |
| Üst çubuktaki `Seri` | Kaldırılır |

## 3. Frontend spesifikasyonu

### Durum

```ts
type Rhythm = {
  every: 10 | 20 | 40 | 0;   // 0 = kapalı; varsayılan 20
  blockStart: number;        // Date.now(), bölüm başlangıcı
  blockAnswers: number;      // bu bölümde cevaplanan el sayısı
  sessionStart: number;      // ilk elin zamanı (60 dk notu için)
};
```

- `every` değeri `localStorage["pd:rhythm"]` anahtarından okunur. Okuma ve yazma `try/catch` içinde olmalı; değer yoksa varsayılan 20 kullanılır.
- `next()` çağrısında: `every > 0 && (blockAnswers >= every || now - blockStart >= 25 dk)` koşulu sağlanırsa `showBreak = true` yapılır ve yeni el seçilmez.
- "Devam et": `blockStart = now`, `blockAnswers = 0`, `showBreak = false` ve `show(pickNext(pool))`.
- "Burada bırak": `showBreak = false`, `setSummary(true)`.

### Görünüm durumları

| Durum | Davranış |
|---|---|
| Boş (bu bölümde 0 cevap) | Ara kartı hiç gösterilmez. Yalnızca süre dolduysa ve cevap yoksa sayaç sessizce sıfırlanır |
| Normal | Yukarıdaki yerleşim |
| Zayıf konu yok (`weakTopics` boş) | "Bu bölümde belirgin bir zayıf konu yok." cümlesi gösterilir |
| Yükleniyor / hata | Ara kartı tamamen istemci tarafında çalışır, ağ isteği yapmaz. Yalnızca "Bu bölümü yorumla" kısayolunda `AiPanel`'in mevcut yükleme ve hata durumları geçerli |

### Erişilebilirlik

- Kart `role="dialog"`, `aria-modal="false"` (engellemeyen) ve `aria-labelledby` ile başlığa bağlanır. Kart açıldığında odak başlığa taşınır.
- Klavye: Enter "Devam et"e basar, Esc "Burada bırak"a basar. Mevcut klavye dinleyicisi `showBreak` açıkken 1–3 tuşlarını yok saymalı.
- Hareket: Açılış animasyonu `prefers-reduced-motion` ayarına uyar.
- Kontrast: İki buton da tema token'larıyla en az 4.5:1 kontrast sağlamalı. "Burada bırak" soluk bir ikincil buton olarak tasarlanmamalı (bkz. öneri 3).

### Kabul ölçütleri (QA)

1. `every = 20` iken 20. cevaptan sonra "Sonraki el"e basıldığında ara kartı açılır, 19. cevapta açılmaz.
2. 25 dakika geçtiğinde ara kartı el sayısından bağımsız olarak bir sonraki "Sonraki el" basışında açılır (test için saat sahtelenir).
3. Ara kartı açıkken 1, 2 ve 3 tuşları hiçbir cevap kaydetmez (`addAttempt` çağrılmaz).
4. `every = 0` iken ara kartı hiç açılmaz.
5. `localStorage` erişimi hata fırlattığında sayfa çalışmaya devam eder ve varsayılan 20 kullanılır.
6. `Seri` metni sayfada hiçbir yerde görünmez.
7. 60 dakikayı geçen oturumda ara kartında uzun oturum notu ve `/sorumlu-oyun` bağlantısı görünür. Daha kısa oturumlarda görünmez.

### Devir

Kod Claude Code tarafına devredildi (bkz. `docs/ekip/HAFIZA.md`, "Devredilen işler"). Arka uç değişikliği gerekmiyor: veri yalnızca istemcide tutuluyor ve sunucuya yeni bir kişisel veri gitmiyor.

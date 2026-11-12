# 12. çalışma: quiz bileşeni (4 quiz yayında) ve c35 düzeltmesi

**Tarih:** 2026-11-12 · **Dal:** `claude/wizardly-meitner-iawfi2` (11. çalışmanın dalı `h0lmvh` üzerine kuruldu)

## Başlangıç durumu

- Varsayılan dal (`charming-davinci-emhvz1`, `8ffc135`) 1–8. çalışmaları ve Cheers markasını içeriyor. 9, 10 ve 11 (`h0lmvh`) birleştirilmedi; bu çalışma `h0lmvh`'nin üzerine kuruldu.
- B-1 kararı gelmedi. Kullanıcı verisi yok. `[HAFIZA_DOSYASI_ADI]` hâlâ yer tutucu; `HAFIZA.md` kullanıldı.
- Sağlık (başlangıç): `npm test` 660/660.

## CEO önceliklendirmesi

B-1 gelmediği için hafızadaki 2. öncelik seçildi: 02, 05, 10 ve 11. raporlarda toplam 26 soru bekliyordu ve sitede gösterilecek yer yoktu. Yeni içerik üretmek yerine hazır, denetlenmiş içeriği kullanıcıya ulaştırmak bugünkü en değerli iş.

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Quiz bileşeni ve 4 quiz | Raporlardaki soruları sitede, ödül döngüsü olmadan çözülebilir yapmak | Puan/seri/süre/kayıt yok; seçimden sonra doğru cevap + gerekçe; spot ve yazı bağlantıları; klavye ve ekran okuyucuyla kullanılabilir; 390 ve 1366 px'te taşma yok; statik dışa aktarımla uyumlu | Davranış Bilimleri, UI/UX, Frontend, QA |
| 2 | Quiz sayılarının yeniden doğrulanması | Yayına giren her sayının testle korunması | Fiyat, SPR, kombinatorik, ICM ve equity iddiaları testte yeniden hesaplanıyor; ondalık virgül ve yüzde eki testleri quiz'leri de kapsıyor | Poker Uzmanı, Poker Eğitim, QA |

**Çalışmayan roller:** Data Analyst (veri yok), Backend (sunucuya hiçbir şey gitmiyor; bkz. aşağıda), Content (yeni yazı gerekmedi).

## 1. Davranış Bilimleri: quiz'in yükü ve motivasyonu

| Öneri | Gerekçe | Kanıt düzeyi |
|---|---|---|
| Quiz, okunanı geri çağırmaya zorlar (soru önce, cevap sonra) | Geri getirme pratiği (testing effect): bilgiyi hatırlamaya çalışmak, yeniden okumaktan daha kalıcı öğrenme sağlar (Roediger ve Karpicke 2006; Dunlosky ve ark. 2013 "yüksek fayda") | **Yüksek**, ama laboratuvar ve sınıf ortamı; poker eğitimine özgü çalışma yok. Atıflar hafızadan, bu çalışmada kaynak açılmadı (**doğrulanamadı**) |
| Her sorudan sonra gerekçeli geri bildirim, yalnızca "doğru/yanlış" değil | Ayrıntılı geri bildirim, yalnızca doğruluk bildiriminden daha etkilidir (Shute 2008 derlemesi) | **Orta**; anlık mı gecikmeli mi daha iyi sorusunda bulgular karışık |
| Toplam puan, süre sayacı, seri, rozet yok | Hafızadaki ürün kararı. Puan ve süre, dikkati öğrenmeden performansa kaydırabilir ve kaygıyı artırabilir | **Düşük–orta**; ürün ilkesine dayanıyor, bu bağlamda ölçülmedi |
| Quiz başına 5–8 soru (yaklaşık 5–10 dakika); "Baştan başla" var, zorunlu tekrar ya da hatırlatma yok | Kısa bölümler mevcut oturum ritmi kararıyla (20–30 dk) uyumlu; tekrar kullanıcının seçimi | **Düşük**: süreler genel öğrenme literatüründen, poker eğitimine özgü kanıt yok |
| Cevaplar kaydedilmez, ilerleme yalnızca "8 sorunun 2 tanesine baktın" | Karşılaştırma ve kayıp kaçınması yaratmamak; veri toplamamak | Ürün kararı |

Reddedilen öneriler: doğru cevap sayısını gösteren özet ekranı, "tekrar dene ve puanını yükselt" akışı, günlük quiz hatırlatması.

## 2. UI/UX ve Frontend spesifikasyonu (uygulandı)

**Akış:** `/ogren` → "Tekrar" grubu → `/quiz` (liste) → `/quiz/[slug]`. Blog yazısının altındaki "Okuduğunu dene" kartında ilgili quiz varsa "Quiz ile tekrarla" düğmesi.

**Sayfa (`/quiz/[slug]`):** geri bağlantısı · etiketler (oyun tipi, seviye) · başlık ve özet · katlanır "Varsayımlar" kutusu (`<details>`) · sorular (her biri bir kart) · alt kart: ilerleme notu, "Bu konuda alıştırma yap" (`/alistirma?oyun=…&konu=…`), "Baştan başla", "Diğer quiz'ler" · ilgili yazılar · sorumlu oyun notu.

**Soru kartı:** `fieldset` + `legend` ("Soru n / N" ve soru metni). Seçenekler tam genişlikte, en az 44 px yüksek düğmeler, A/B/C harfli. Seçimden sonra:
- seçilen ve doğru seçenek renk **ve metinle** işaretlenir ("Senin seçimin", "Doğru cevap"); yalnızca renge dayanılmaz;
- düğmeler `aria-disabled` olur, `disabled` değil: tıklanan düğme odağı kaybetmez;
- `aria-live="polite"` bölgede "Doğru." ya da "Doğru cevap B." + gerekçe (sözlük bağlantılı `RichText`) + varsa "Bu fikri masada dene →" (`/alistirma?el=<spot>`).

**Mobil / masaüstü:** tek sütun, en fazla `max-w-2xl`; mobilde kartlar tam genişlik, alt menüyle çakışma yok. Liste sayfası mobilde tek, masaüstünde iki sütun.

**Durumlar:** veri statik ve derleme anında üretiliyor; yükleniyor ve ağ hatası durumu yok. Bilinmeyen kimlik → `notFound()` (404). Boş durum yok (en az 1 quiz testle garanti). Cevap verilmemiş durumda "Baştan başla" gizli.

**Veri:** `src/data/quizzes.ts` (`Quiz`, `QuizQuestion`); seçenek metinleri harfsiz, harfi bileşen ekliyor. `spot` alanı isteğe bağlı.

## 3. Backend

Değişiklik yok, bilinçli olarak. Cevaplar yalnızca sayfa açıkken React belleğinde; `localStorage`'a bile yazılmıyor, sunucuya hiçbir şey gitmiyor. En az yetki / en az veri ilkesine uygun. Quiz cevaplarının `/profil`'de gösterilmesi istenirse ayrı bir karar gerekir (yeni veri türü, KVKK metni).

## 4. Poker Uzmanı + Poker Eğitim: sorular ve doğrulama

- 26 soru 4 quiz'de: blind savunması (8), SPR ve value (7), bubble call/fold (6), bubble push/fold (5). 10 ve 11. raporlardaki açık uçlu sorular çoktan seçmeliye çevrildi; doğru cevap her quiz'de farklı sıralarda.
- Bütün ondalıklar virgüle çevrildi (02 ve 05 raporlarında noktalıydı).
- **Yeniden ölçülen equity'ler** (150.000 deneme, `ranges.json` yaklaşık aralıkları, solver çıktısı değil): 72o butona karşı **%29,5**, T8s **%41,1**, K4o **%41,1**, J4o UTG'ye karşı **%28,9**.
- **Düzeltmeler:**
  - Quiz 02/5: 72o için gereken realization "%93" → **%92** (27,27 / 29,5 = 0,924).
  - Quiz 02/5'teki "çoğu çalışma kaynağı fold önerir" ifadesi kaldırıldı (kaynak gösterilemiyordu); yerine "bu varsayımlarla" dendi.
  - **Q-4 (c35 spotu):** gerekçe "equity'nin yaklaşık %93'ünü" diyordu; 27,27 / 28,9 = 0,944 → **%94**. 5. çalışmadaki %29,2 ölçümü 40.000 denemeydi; yeni ölçüm daha kesin. Test sınırı eklendi (0,92–0,965).
  - Quiz 10/4'te "orta stack, eşit stack'e karşı" seçeneği ölçülmüş bir spota bağlandı: "10 BB ile 10 BB'lik all-in'e karşı" (`ib01`, eşik %41,9 → %51,5).
- Eksik konu: final masası ödül sıçramaları için hâlâ ne spot ne quiz var. c39/B-1 bekliyor.

## 5. QA

### Test planı ve sonuçlar

| Kontrol | Beklenen | Sonuç |
|---|---|---|
| `src/data/quizzes.test.ts` (19 test): yapı (tekil kimlik, 5–10 soru, doğru indeks geçerli, seçenekler tekil, bağlanan spot/yazı var, doğru cevap tek sırada değil) | Geçer | ✅ |
| Metin: ondalık virgül, yüzde eki (`pctSuffixProblem`), "garanti/para kazan" yok | Geçer | ✅ |
| Fiyatlar: 1,5/5,5; 1/4,5; 1,5/8; 1,2/5,9 ve `t25`, `c36` `replay` ile aynı | Geçer | ✅ |
| SPR 17,7 / 4,7 / 1,7; set olasılığı C(48,3)/C(50,3) kesin; c38 7,2 < 7,5; blöf oranı 1/3 | Geçer | ✅ |
| ICM: `ib01` `replay` + `icm()` → Fold %16,4, Kazanç %31,9, Kayıp 0, eşik %51,5; call 9, pot 21,5 | Geçer | ✅ |
| Equity: 72o, T8s, K4o, J4o aralıkları ve realization oranları (60.000 deneme, sabit tohum) | Geçer | ✅ |
| Playwright 390 ve 1366 px: liste (4 kart), 4 quiz sayfası, yatay taşma 0, konsol hatası 0 | Geçer | ✅ |
| Seçimden sonra odak tıklanan düğmede; ikinci seçim yok sayılıyor; klavyeyle (Enter) seçim; "Baştan başla" sıfırlıyor | Geçer | ✅ |
| Erişilebilirlik ağacı: `group "Soru 1 / 8 …"`, `button "A ) %20"` | Harf ekran okuyucuya okunur | ✅ (ilk sürümde harf `aria-hidden` idi, geri bildirim "Doğru cevap B" diyordu; düzeltildi) |
| Bağlantılar: blogdan quiz'e, `/ogren`'den `/quiz`'e, "Bu fikri masada dene" (`/alistirma?el=ip01` açıldı) | Geçer | ✅ |
| `npm test` **679/679**, `npm run typecheck` temiz, `npm run build` temiz (`/quiz` ve 4 `/quiz/[slug]` statik) | | ✅ |

Denenmeyenler: gerçek ekran okuyucu (NVDA/VoiceOver) ile dinleme; açık tema ekran görüntüsü (renkler tema değişkenlerinden geliyor, kontrast ayrıca ölçülmedi); GitHub Pages `basePath` altında bağlantılar (yalnızca `next start` ile denendi).

### Hatalar (önem sırasıyla)

| # | Önem | Durum |
|---|---|---|
| Q-4: c35 gerekçesinde realization %93 (doğrusu ≈ %94) | Düşük | Düzeltildi, testli |
| A-1: quiz seçenek harfi ekran okuyucudan gizliydi | Düşük | Yayından önce düzeltildi |
| Q-5: 02 raporunda 72o realization %93 (≈ %92) ve ondalık noktalar | Bilgi | Sitedeki sürümde düzeltildi; rapor tarihsel kayıt olarak bırakıldı |

## 6. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| Quiz bileşeni | Ödül döngüsü yok, gerekçe, bağlantılar, klavye/ekran okuyucu, iki boyutta taşma yok, statik | ✅ (gerçek ekran okuyucu ve açık tema denenmedi) |
| Sayıların doğrulanması | Her sayı testte | ✅ Yalnızca ICM push quiz'indeki sayılar (ip01–ip03) quiz testinde yeniden hesaplanmıyor; aynı sayılar `hands.test.ts`'teki spot testleriyle korunuyor |
| Davranış değerlendirmesi | Kanıt düzeyiyle | ✅ Atıflar hafızadan (**doğrulanamadı**) |

Poker iddiaları yeniden okundu. Bütün equity değerleri yaklaşık referans aralıklara, ICM değerleri varsayılan ödül yapısına (%50/%30/%20) ve tek el modeline bağlı; solver ya da bağımsız ICM aracıyla karşılaştırılmadı. Blöf oranı yalnızca basitleştirilmiş river modelinde kesin.

## Kullanıcı kararı gerekenler

1. **Dal:** `claude/wizardly-meitner-iawfi2` (bu dal) 9, 10, 11 ve 12. çalışmaları içeriyor; yalnızca bunu birleştirmek yeterli.
2. **B-1:** `acceptable` alanı (c39 ve sınırda spotlar).
3. **P-4:** `admiring-babbage-*` dalları.

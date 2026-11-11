# Proje hafızası — Poker Defteri

AI ekibinin (CEO Agent ve roller) her çalışmada önce okuduğu, sonunda güncellediği dosya. Ürünün ayrıntılı teknik dokümantasyonu `README.md`'dedir; burada yalnızca durum, kararlar ve öncelikler tutulur.

Son güncelleme: 2026-11-11

## Mevcut durum

- Next.js 16 + React 19 + PostgreSQL + Claude API. Türkçe Texas Hold'em çalışma sitesi; gerçek parayla oyun yok, 18+.
- 575 spot (53 elle yazılmış + 522 üretilmiş), 593 test yeşil, typecheck ve `next build` temiz.
- Aşama 1'de yalnızca **yayın** (barındırma, alan adı, gerçek API anahtarıyla asistan testi) açık. Bu adım kullanıcı kararı/erişimi gerektiriyor.
- Aşama 3'te açık: hand history içe aktarma, gelişmiş istatistikler.
- Blog: 7 yazı. Sözlük: 138 terim.

## Bu çalışmada tamamlananlar (2026-11-11)

Roller: CEO, Poker Uzmanı, QA, Content. Kod değişiklikleri doğrudan bu Claude Code rutininde yapıldı.

1. **Elle yazılmış 53 spotun sayısal denetimi** (Poker Uzmanı + QA). Rapor: `docs/denetim/2026-11-11-elle-yazilmis-spotlar.md`.
   - Düzeltilen: t22 (sınırda el → A2o), c27 (turn'de "backdoor" hatası), c17 (tek kart oranı notu), c20 ("çekişsiz" ifadesi), c21 (gerçekçi olmayan flop overbet).
2. **Regresyon testi**: `hands.test.ts` → "elle yazılmış spotlardaki equity iddiaları" (t05, t06, t22 Monte Carlo; c26 kesin sayım).
3. **Blog yazısı** (Content + Poker Uzmanı): `risk-primi-hesabi` — t07, t10, t17 üzerinden ICM başabaş hesabı; varsayımlar açıkça yazılı.

## Devam eden / açık işler

- t23: turnuva spotu ama ante yok (tutarsızlık, düşük önem).
- t13: "88 resteal aralığına karşı yarı yarıya" iddiası doğrulanamadı (referans resteal aralığı yok).
- Postflop range avantajı iddiaları solver ile karşılaştırılmadı.
- Yayın adımı ve gerçek API anahtarıyla asistan testi (kullanıcı erişimi gerekli).
- ICM hesap makinesi: stack'i 0 olan (elenmiş) oyuncuya ödül vermiyor. Hesap aracında bunun nasıl gösterildiği kontrol edilmedi.

## Alınan teknik kararlar

- Elle yazılmış spotlarda da üretilen spotlardaki kural uygulanır: cevap, gereken equity'ye referans aralıklarla **3,5 puandan yakınsa** spot ya değiştirilir ya da "sınırda" diye açıkça yazılır.
- Gerekçedeki her sayısal equity iddiası mümkünse testle sabitlenir; rakip aralığı varsayımı `ranges.json` (solver çıktısı değil, yaklaşık çalışma aralığı).
- ICM örneklerinde ödül dağılımı her zaman "varsayım" olarak belirtilir; elenen oyuncunun garanti ödülü (ör. 3.lük) hesaba katılır.
- Blog yazıları `POSTS` dizisine kronolojik sırayla eklenir (liste ters çevrilerek gösterilir).

## Tespit edilen hatalar

| Tarih | Hata | Önem | Durum |
|---|---|---|---|
| 2026-11-11 | t22 cevabı eşiğe 1 puandan yakındı | Orta | Düzeltildi |
| 2026-11-11 | c27 turn'de "backdoor" ifadesi | Düşük-orta | Düzeltildi |
| 2026-11-11 | c17 tek call için iki kart oranı | Düşük-orta | Düzeltildi |
| 2026-11-11 | c20 "çekişsiz board" | Düşük | Düzeltildi |
| 2026-11-11 | c21 sıkı rakipte pot üstü flop bahsi | Düşük | Düzeltildi |
| 2026-11-11 | t23 turnuva spotunda ante yok | Düşük | Açık |

## Sonraki öncelikler

1. **Gelişmiş istatistikler (Aşama 3)** — UI/UX + Frontend + Backend: profil sayfasında pozisyon ve spot türüne göre doğruluk eğilimi; mevcut `attempts` tablosu yeterli mi, yeni uç nokta gerekir mi? Önce spesifikasyon, sonra kod.
2. **Spot ↔ içerik bağlantıları** — Poker Eğitim: blog yazılarından ilgili spotlara (`/alistirma?el=t07` vb.) ve spot gerekçelerinden blog yazılarına bağlantı; seviyeye göre çalışma planı.
3. **Kalan doğrulanamayan iddialar** — t13 için resteal aralığı varsayımı belirleyip test; t23 ante kararı.
- Kullanıcı kararı bekleyen: yayın ortamı ve gerçek API anahtarı.

## Agent sorumlulukları ve notlar

- **Data Analyst**: Kullanıcı verisi (VPIP/PFR/3-Bet vb.) sağlanmadı; 2026-11-11'de atlandı. Uydurma veriyle analiz yapılmaz.
- **Davranış Bilimleri**: Yeni çalışma planı üretilmediği için bu çalışmada gerekmedi. Mevcut tasarım (soru sayacı yok, oturum özeti) ödül döngüsü kurmuyor; yeni istatistik sayfası tasarlanırken seri/streak, sıralama tablosu gibi mekanikler önerilmemeli.
- **UI/UX, Frontend, Backend**: Bir sonraki çalışmada gelişmiş istatistikler için devreye girecek.
- Tüm poker içeriği "bu varsayımlarla" diliyle yazılır; kazanç vaadi ve kumar teşviki yok.

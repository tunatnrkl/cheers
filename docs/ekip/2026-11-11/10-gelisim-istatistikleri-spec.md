# Gelişim istatistikleri (Aşama 3) — spesifikasyon ve uygulama

**Çalışma:** 7 · **Roller:** Davranış Bilimleri, UI/UX, Frontend, Backend, QA · **Durum:** uygulandı (`/profil`, "Gelişim" kartı)

## Hedef ve başarı kriteri

Kullanıcı, alıştırma cevaplarından **zaman içindeki eğilimini** ve **pozisyona göre** doğruluğunu görebilsin; bunu yaparken:

1. Yeni kişisel veri toplanmaz, sunucuya yeni uç nokta eklenmez.
2. Küçük örneklerde oran kesinmiş gibi gösterilmez.
3. Ödül döngüsü mekaniği yok (seri, günlük hedef, rozet, sıralama).
4. 390 px ve 1366 px'de yatay kaydırma yok, konsol hatası yok.
5. Hesaplamalar birim testli.

Beşi de karşılandı (bkz. QA).

## Davranış Bilimleri değerlendirmesi

| Karar | Gerekçe | Kanıt düzeyi |
|---|---|---|
| Takvim haftası yerine **kayan 7 günlük pencereler**; günlük ısı haritası/takvim **yok** | Pazartesi sıfırlanan sayaç ve boş gün kareleri "zinciri kırma" baskısı yaratır. Zincir/seri mekaniklerinin uzun vadeli öğrenmeye katkısı belirsiz, bırakma ve kaygı ile ilişkisi raporlanmış | Düşük–orta (oyunlaştırma literatürü karışık; poker eğitimine özgü çalışma yok) |
| **İlk görüşte / tekrarda** ayrımı | Masada yanlışlar geri döndüğü için genel doğruluk tekrarlarla şişer. Geri getirme (retrieval) ve aralıklı tekrarın öğrenmeye etkisi güçlü; ama ilerlemeyi dürüst göstermek için yeni spot performansı ayrı görünmeli | Yüksek (retrieval practice ve distributed practice, ör. Dunlosky ve ark. 2013 derlemesi) — kaynak bu çalışmada yeniden açılıp doğrulanmadı |
| **10 cevaptan az** veride oran yok, "az veri" yazar; kartın başında "10 cevapta bile ±25 puan" notu | Gürültüyü gerçek değişim sanmak yanlış sonuca ve gereksiz hayal kırıklığına götürür | Matematiksel (Wilson aralığı, testli) |
| Kırmızı/yeşil "düştün/yükseldin" vurgusu, ok işaretleri **yok**; tüm çubuklar tek nötr renk | Geri bildirim kişiye değil göreve odaklanmalı; kişiye yönelen geri bildirimin performansı düşürebildiği raporlanmış | Orta (Kluger ve DeNisi 1996 meta-analizi) — kaynak bu çalışmada yeniden doğrulanmadı |
| Cevap **sayısı** küçük ve gri, oran ön planda | Hacmi ödüllendirmek "daha çok el çöz" baskısı yaratır; amaç anlamak | Uzman görüşü |
| Zayıf pozisyonda "range matrisine bak" bağlantısı (alıştırmaya zorlayan değil, okumaya yönlendiren) | Bir sonraki adım çalışma; daha fazla el değil | Uzman görüşü |

## UI/UX

Mobil öncelikli, tek sütun kart; masaüstünde profilin sol sütununda "İlerleme" kartının altında.

```
┌ Gelişim ───────────────────────────────┐
│ 10 cevaptan azında oran gösterilmez…   │
│ İlk görüşte ve tekrarda                │
│ ┌─────────┐ ┌─────────┐                │
│ │   %58   │ │   %71   │                │
│ │İlk · 40 │ │Tekrar·80│                │
│ └─────────┘ └─────────┘                │
│ Haftalara göre doğruluk (en yeni üstte)│
│ Son 7 gün        %71 (20/28)  ▓▓▓▓▓▓░  │
│ 7–14 gün önce    %68 (19/28)  ▓▓▓▓▓░░  │
│ 28–35 gün önce   az veri (8 cevap)     │
│ Pozisyona göre  [Tümü][Cash][Turnuva]  │
│ UTG … BB         %   (ok/total)  ▓▓░   │
│ → range matrisine bak                  │
└────────────────────────────────────────┘
```

Akış: Profil → (cevap varsa) Gelişim kartı → oyun tipi seçimi → pozisyon listesi güncellenir → range matrisine bağlantı.

## Frontend

- `src/lib/client/stats.ts`: `weeklyTrend`, `positionStats`, `firstVsRepeat`, `wilson`, `MIN_SAMPLE = 10`. Saf fonksiyonlar.
- `src/app/profil/Growth.tsx`: kart. "Şimdi" bileşen açılışında bir kez alınır.
- **Durumlar:** cevap yok → kart görünmez (mevcut "İlk alıştırmanı yap" boş durumu yeterli); tek haftada veri → "en az iki farklı haftada cevap gerekiyor"; seçilen oyun tipinde cevap yok → "Bu oyun tipinde henüz cevap yok"; yükleniyor → üst bileşenin mevcut "Yükleniyor…" durumu; hata → depo zaten localStorage'a düşüyor, ek hata durumu yok.
- **Erişilebilirlik:** başlık `aria-labelledby`; oyun tipi `radiogroup`/`radio` + `aria-checked`; çubuklar `aria-hidden`, değer metin olarak okunur; liste `aria-label="Son 8 hafta, en yeni üstte"`. Renk tek başına bilgi taşımaz.

## Backend

- **Yeni uç nokta yok.** `GET /api/attempts` zaten `handId`, `correct`, `topic`, `at` döndürüyor; pozisyon ve oyun tipi `HAND_BY_ID` ile istemcide türetilir.
- En az yetki: istatistik için ek kolon, ek tablo, analitik olayı ya da üçüncü taraf yok. Misafirde veri cihazdan çıkmaz.
- Bilinen sınır: `GET /api/attempts` en fazla 5000 kayıt döndürür; 8 haftalık pencere için yeterli, ama "tüm zamanlar" ilk görüş oranı çok aktif kullanıcıda en eski kayıtları kaçırabilir (bkz. hata G-1).

## QA

| Vaka | Beklenen | Sonuç |
|---|---|---|
| 12 cevap (9 doğru) dün, 3 cevap 8 gün önce, 10 cevap 20 gün önce | Pencereler: %75, az veri, %50, boş | ✅ birim testi |
| Tam 7 gün önceki cevap | 2. pencereye düşer | ✅ |
| Gelecek tarihli, geçersiz tarihli, 100 gün önceki cevap | Sayılmaz | ✅ |
| Kütüphanede olmayan `handId` | Pozisyon tablosunda atlanır | ✅ |
| c02 (cash BTN) ve t24 (turnuva BTN) | Oyun filtresi ayırır | ✅ |
| Aynı el iki kez | İlki "ilk görüş", ikincisi "tekrar"; sıra tarihe göre | ✅ |
| Wilson 7/10 | 0,397–0,892 | ✅ |
| 390 px / 1366 px, 120 örnek cevap | Kaydırma yok, konsol hatası yok, metinler doğru | ✅ Playwright (ekran görüntüsü incelendi) |
| Giriş yapmış kullanıcıyla (PostgreSQL) | Aynı görünüm | ⬜ Denenmedi (ortamda veritabanı yok) |

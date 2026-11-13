# Erişilebilirlik ve performans denetimi (brif 8) · 2026-11-13

Ölçülen: statik derleme (`STATIC_EXPORT=1 NEXT_PUBLIC_STATIC=1 next build --webpack`, `src/app/api` geçici taşındı), `out/` → `srv/cheers/`.
Araç: Lighthouse 12.8.2 (proje dışındaki geçici dizine kuruldu), Chromium 1243 (`/opt/pw-browsers/chromium`, `--headless=new --no-sandbox`), varsayılan simüle kısıtlama. Mobil = varsayılan Moto G profili, masaüstü = `--preset=desktop`. Her ölçüm tek koşu; performans puanı koşudan koşuya ±5 oynayabilir.

İki sunucuyla ölçüldü:
- **python**: `python3 -m http.server` (brifte istenen). Sıkıştırma yapmaz; Lighthouse "metin sıkıştırması" için ~1,4 MB kayıp gösterir, bu yüzden mobil performans GitHub Pages'tekinden kötü çıkar.
- **gzip**: GitHub Pages'e benzeyen küçük Node sunucusu (gzip, `Cache-Control: max-age=600`, `404.html`). Yayındaki duruma daha yakın olan budur.

"Önce" = `9c11ea1`, "sonra" = bu dalın son hâli. Hücre: Performans / Erişilebilirlik / En iyi uygulamalar / SEO.

## python http.server

| Sayfa | Mobil önce | Mobil sonra | Masaüstü önce | Masaüstü sonra |
|---|---|---|---|---|
| / | 64 / 96 / 100 / 100 | 70 / 100 / 100 / 100 | 97 / 96 / 100 / 100 | 98 / 100 / 100 / 100 |
| /alistirma/ | 45 / 100 / 100 / 100 | 68 / 100 / 100 / 100 | 90 / 100 / 100 / 100 | 95 / 100 / 100 / 100 |
| /ogren/ | 59 / 100 / 100 / 100 | 70 / 100 / 100 / 100 | 90 / 100 / 100 / 100 | 91 / 100 / 100 / 100 |
| /range/ | 67 / 90 / 100 / 100 | 74 / 100 / 100 / 100 | 97 / 89 / 100 / 100 | 98 / 100 / 100 / 100 |
| /sozluk/ | 69 / 100 / 100 / 100 | 81 / 100 / 100 / 100 | 97 / 100 / 100 / 100 | 99 / 100 / 100 / 100 |
| /profil/ | 45 / 100 / 100 / 63 | 66 / 100 / 100 / 63 | 67 / 100 / 100 / 63 | 92 / 100 / 100 / 63 |
| /blog/ | 74 / 100 / 100 / 100 | 84 / 100 / 100 / 100 | 99 / 100 / 100 / 100 | 99 / 100 / 100 / 100 |

## gzip sunucusu (Pages benzeri)

| Sayfa | Mobil önce | Mobil sonra | Masaüstü önce | Masaüstü sonra |
|---|---|---|---|---|
| / | 76 / 96 / 100 / 100 | 89 / 100 / 100 / 100 | 100 / 96 / 100 / 100 | 100 / 100 / 100 / 100 |
| /alistirma/ | 65 / 100 / 100 / 100 | 67 / 100 / 100 / 100 | 93 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| /ogren/ | 67 / 100 / 100 / 100 | 85 / 100 / 100 / 100 | 99 / 100 / 100 / 100 | 99 / 100 / 100 / 100 |
| /range/ | 87 / 90 / 100 / 100 | 94 / 100 / 100 / 100 | 100 / 89 / 100 / 100 | 100 / 100 / 100 / 100 |
| /sozluk/ | 89 / 100 / 100 / 100 | 94 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| /profil/ | 60 / 100 / 100 / 63 | 88 / 100 / 100 / 63 | 77 / 100 / 100 / 63 | 100 / 100 / 100 / 63 |
| /blog/ | 92 / 100 / 100 / 100 | 93 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

Kayma (CLS, mobil): /alistirma 0,387 → 0; /profil 0,583 → 0; /ogren 0,155 → 0.

## Hedefe (≥ 90) göre durum

- **Erişilebilirlik, en iyi uygulamalar:** bütün sayfalarda 100.
- **SEO:** /profil dışında 100. /profil 63 bilerek: sayfa kişisel ilerleme gösterir ve `robots: noindex` taşır (tek kayıp `is-crawlable`). Kaldırılmadı.
- **Performans:** masaüstünde her sayfa ≥ 91 (gzip'te ≥ 99). Mobilde gzip'le /range, /sozluk, /blog ≥ 90; /, /profil, /ogren 85–89; /alistirma 67. Hedefin altında kalan sayfalarda kalan maliyet Next.js çatısı ve React (~130 KB gzip) ile içeriğin tarayıcıda çizilmesi (ogren, profil, alıştırma `useSearchParams` ve localStorage'a bağlı; LCP öğesi hidrasyondan sonra çiziliyor). Bunu kapatmak derleme ayarı (`next.config.ts`, ör. `experimental.inlineCss`) ya da bu sayfaların sunucuda çizilecek biçimde yeniden yapılması demek; ikisi de bu iş kolunun dokunma alanı dışında, açık iş olarak bırakıldı.

## Bulunan ve düzeltilen sorunlar

| Sorun | Nerede | Düzeltme |
|---|---|---|
| `aria-required-children` / `aria-required-parent` (kritik, 170 düğüm) | Range matrisi: `role="grid"` içinde satırsız `gridcell` butonlar | Matris `role="group"` ve açıklayıcı ad; hücreler `aria-pressed`'li butonlar |
| Kontrast 2,36 ve 3,1 | Ana sayfa masa önizlemesi: fold koltukları `opacity-45`, aksiyon şeridi `opacity-60` | Soluk ama AA (kesikli kenar, `opacity-80`; şeritte saydamlık yok) |
| Kontrast 3,59 | Ana sayfa önizlemesi "Call" (beyaz / #1f9a5e) | Masadaki buton renkleri (#157347 vb.) |
| Yazı tipleri 266 KB, hepsi yüksek öncelikli | Fraunces "full" (SOFT, WONK, opsz, wght) latin + latin-ext, Manrope | SOFT=100, WONK=1 sabitlendi (sitede yalnızca bu değerler), latin-ext yalnızca Türkçe harfler: 95 KB (`src/app/fonts`, betik `font-kucult.py`, OFL) |
| Kayma 0,387 | /alistirma: footer önce görünüp JS ile gizleniyordu | `body:has([data-sayfa="alistirma"]) > footer { display: none }` |
| Kayma 0,583, LCP hidrasyondan sonra | /profil: Suspense yer tutucusu boştu, öğrenme kartı `null` dönüyordu | Başlık yer tutucuda çizilir, içerik alanı en az 100vh, öğrenme kartı yer tutucusu |
| Kayma 0,155 | /ogren: 60vh yer tutucu, içerik gelince "Kaynaklar" kayıyordu | Yer tutucu 100vh |
| Odak BODY'ye düşüyor | Alıştırma: aksiyon butonu pasifleşince | Aksiyon alanı (`role="region"`, `tabIndex=-1`) odağı tutar; el sonu başlığına taşıma korunur |
| Sekme rolü bağlantıda | Cash/Turnuva geçişi `role="tab"` olan bağlantı | `nav` + `aria-current="page"` |
| `dl` içinde `dd` `dt`'den önce | Profil ve hesap makinesi ölçü kutuları | `dt` önce, görsel sıra CSS ile |

## axe-core (4.10.3, wcag2a/aa, wcag21a/aa, wcag22aa, best-practice)

15 sayfa × 2 boyut (390x844, 1440x900), gzip sunucusu:

| | Önce | Sonra |
|---|---|---|
| Ana sayfa | color-contrast (9 / 15 düğüm) | 0 |
| Range | aria-required-children (1), aria-required-parent (169) | 0 |
| Diğer 13 sayfa | 0 | 0 |

Not: "önce" ölçümünde 404 sayfası python sunucusunun kendi hata sayfasıyla geldi (landmark uyarıları); gzip sunucusunda `404.html` ile 0 ihlal.

Ekran görüntüleri: `docs/ekip/2026-11-13/sayfalar/` (konsol hatası 0, yatay taşma 0).

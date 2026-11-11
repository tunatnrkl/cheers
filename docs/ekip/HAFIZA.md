# Proje hafızası: Poker Defteri AI ekibi

Bu dosya, zamanlanmış "CEO Agent" çalışmalarının ortak hafızasıdır. Her çalışma önce bu dosyayı okur, sonunda günceller. Çalışma çıktıları `docs/ekip/<tarih>/` altında durur.

Son güncelleme: **2026-11-11** (1. çalışma)

## Mevcut durum

- Uygulama: Next.js 16 + React 19, PostgreSQL, Claude API koçu. Ayrıntılar `README.md` içinde.
- İçerik: 575 spot (53 elle yazılmış + 522 üretilmiş), 138 sözlük terimi, 6 blog yazısı.
- Sağlık (2026-11-11): `npm test` 589/589 geçti, `tsc --noEmit` temiz.
- Yayın (README Aşama 1, adım 10) hâlâ yapılmadı. Asistan gerçek API anahtarıyla denenmedi.
- Kullanıcı verisi (VPIP/PFR, alıştırma geçmişi dökümü) ekibe hiç sağlanmadı.

## Bu çalışmada tamamlananlar (2026-11-11)

| Çıktı | Rol | Durum |
|---|---|---|
| [`2026-11-11/01-spot-denetimi.md`](2026-11-11/01-spot-denetimi.md): 53 elle yazılmış spotun denetimi, 3 orta + 7 düşük + 1 bilgi bulgusu, QA test önerileri | Poker Uzmanı, QA | ✅ Tamamlandı (düzeltmeler devredildi) |
| [`2026-11-11/02-blind-savunmasi-paketi.md`](2026-11-11/02-blind-savunmasi-paketi.md): 8 soruluk blind savunması quizi ve replay'den geçen 4 spot taslağı | Poker Eğitim | ⚠️ Quiz tamam. c34 spotu revizyon bekliyor |
| [`2026-11-11/03-oturum-ritmi-spec.md`](2026-11-11/03-oturum-ritmi-spec.md): sonsuz akış ve `Seri` sayacı için davranış değerlendirmesi, ara kartı UI/UX ve frontend spesifikasyonu | Davranış Bilimleri, UI/UX, Frontend | ✅ Spesifikasyon tamam (kod devredildi) |

## Devam edenler / devredilen işler (Claude Code)

1. **Spot metin düzeltmeleri.** Denetim bulguları O-1, O-2, O-3 ve D-1…D-7, `src/data/hands.ts` içinde düzeltilecek. QA'nın önerdiği iki yeni test eklenecek (seçenekteki stack değeri `replay` ile ±1 BB; ondalık virgül yasağı).
2. **`acceptable?: number[]` alanı** (bulgu B-1). Karışık stratejili spotlarda ikinci seçenek "kabul edilebilir" sayılacak. Etkilenen spotlar: c09, c23, c24, ileride c34.
3. **Blind savunması spotları.** c35, c36 ve t25 eklenmeye hazır. c34 için önce revizyon gerekiyor: 3 BB açılışa çevrilecek ya da `acceptable` alanı beklenecek.
4. **Ara kartı (`BreakCard`) ve `Seri` sayacının kaldırılması.** Spesifikasyon ve 7 kabul ölçütü `03-oturum-ritmi-spec.md` içinde.

Bu çalışmada kod yazılmadı. Yukarıdaki 4 iş Claude Code görevine devredildi.

## Alınan teknik ve ürün kararları

- Ekip çıktıları depoda `docs/ekip/` altında tutulur. Hafıza dosyası `docs/ekip/HAFIZA.md`.
- Equity iddiaları projenin kendi değerlendiricisiyle (`evaluator.ts`) ve `ranges.json` aralıklarıyla Monte Carlo yöntemiyle kontrol edilir. Bu aralıklar yaklaşıktır, solver çıktısı değildir; her raporda böyle belirtilir.
- ICM spotlarında ödül yapısı `note` alanında yazılı olmalı. Yazılı değilse karar doğrulanamaz.
- Ödül döngüsü mekanikleri eklenmeyecek: seri, rozet, liderlik tablosu, günlük hedef zinciri. Mevcut `Seri N` sayacının kaldırılması önerildi.
- Spot gerekçelerinde pot odds hesabı tek sokak (bir sonraki kart) üzerinden yapılır. İki kartlık yüzde ancak all-in ya da açıkça iki sokak garanti olduğunda kullanılır.

## Tespit edilen hatalar

| # | Yer | Önem | Durum |
|---|---|---|---|
| O-1 | c17: tek bahsin fiyatı, iki kartlık equity ile karşılaştırılmış | Orta | Kapandı |
| O-2 | t10: "KJo yarı yarıya" (ölçülen %55); ödül yapısı yazılmamış | Orta | Kapandı |
| O-3 | c25: exploit fold, fiyat (%23.5) belirtilmemiş | Orta | Kapandı |
| D-1…D-7 | c19, c20, c21, c27, t21, t22, t23: sayı ve ifade hataları | Düşük | Kapandı (all-in miktarı ve ondalık virgül için test eklendi; `drills.json`'daki 70 ondalık virgül de düzeltildi) |
| B-1 | Karışık stratejili spotlarda tek doğru cevap var | Bilgi | Ürün kararı bekliyor |

## Doğrulanamayan konular

- Solver karşılaştırması yapılamadı. c09, c23, c24, c25 ve c34'teki "karışık strateji" yorumları genel bilgiye dayanıyor.
- t07 ve t09'da ödül yapısı yok; ICM kararlarının yönü makul, ama sayısal olarak doğrulanamadı.
- Davranış önerilerindeki süreler (20–30 dk bölüm, günde 60–90 dk) genel öğrenme literatüründen geliyor. Poker eğitimine özgü bir kanıt bulunamadı.

## Atlanan roller ve nedenleri

- **Data Analyst:** Kullanıcı verisi sağlanmadı, bu yüzden atlandı. Uydurma veriyle analiz yapılmaz. Veri gelirse `/profil` sayfasındaki CSV/JSON dışa aktarımı kullanılabilir.
- **Backend:** Bu turdaki işlerin hiçbiri sunucu değişikliği gerektirmiyor.
- **Content:** Uzun bir makale yerine quiz ve spot üretmek daha öncelikliydi. Blind savunması rehberi bir sonraki tura bırakıldı.

## Sonraki öncelikler

1. Devredilen 4 işin uygulanıp uygulanmadığını kontrol et (`git log`, `src/data/hands.ts`). Uygulandıysa bulguları "Kapandı" olarak işaretle.
2. Üretilen 522 spot için örneklem denetimi: özellikle `callshove` grubunda, eşiğe 3.5 puan mesafe kuralının aralık varsayımlarına ne kadar duyarlı olduğu.
3. Zayıf kalan `value` (3 spot) ve `spr` (4 spot) konuları için Eğitim ve Content paketi; ayrıca blind savunması rehber yazısı.
4. Gelecekte: README Aşama 3'teki "gelişmiş istatistikler" (zaman içinde eğilim, pozisyon bazında döküm) için UI/UX ve Backend spesifikasyonu. Kullanıcı verisi olmadan Data Analyst çalışmaz.

## Agent sorumlulukları (kısa)

Poker Uzmanı: doğruluk ve varsayımlar · Poker Eğitim: quiz ve spot · Data Analyst: yalnızca gerçek veriyle · Davranış Bilimleri: yük ve motivasyon, kanıt düzeyiyle · Content: makale · UI/UX → Frontend → Backend: spesifikasyon, kod Claude Code'a · QA: test planı ve doğrulama vakaları · CEO: önceliklendirme, kalite kontrolü, hafıza.

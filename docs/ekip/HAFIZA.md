# Proje hafızası: Poker Defteri AI ekibi

Bu dosya, zamanlanmış "CEO Agent" çalışmalarının ortak hafızasıdır. Her çalışma önce bu dosyayı okur, sonunda günceller. Çalışma çıktıları `docs/ekip/<tarih>/` altında, tekrar kullanılabilir analiz betikleri `docs/ekip/arac/` altında durur.

Son güncelleme: **2026-11-11** (2. çalışma)

## Mevcut durum

- Uygulama: Next.js 16 + React 19, PostgreSQL, Claude API koçu. Ayrıntılar `README.md` içinde.
- İçerik: 575 spot (53 elle yazılmış + 522 üretilmiş), 138 sözlük terimi, 6 blog yazısı.
- Sağlık (2026-11-11, 2. çalışma): `npm test` 589/589 geçti.
- Yayın (README Aşama 1, adım 10) hâlâ yapılmadı. Asistan gerçek API anahtarıyla denenmedi.
- Kullanıcı verisi (VPIP/PFR, alıştırma geçmişi dökümü) ekibe hiç sağlanmadı.
- **Dal durumu:** 1. çalışma `claude/wizardly-meitner-ch8abk` dalına, 2. çalışma `claude/wizardly-meitner-w5y8as` dalına itildi (1. çalışmanın commit'i bu dala cherry-pick edildi). Hiçbiri ana dala birleştirilmedi. Sonraki çalışma en güncel ekip dalından başlamalı.
- **Devredilen kod işlerinin hiçbiri henüz uygulanmadı** (2. çalışmada kontrol edildi: `acceptable` alanı yok, `Seri` sayacı duruyor, spot metinleri değişmemiş).

## Tamamlananlar

### 2. çalışma (2026-11-11)

| Çıktı | Rol | Durum |
|---|---|---|
| [`2026-11-11/04-callshove-duyarlilik.md`](2026-11-11/04-callshove-duyarlilik.md): 126 üretilmiş `callshove` spotunun aralık varsayımına duyarlılığı; 2 orta, 3 düşük bulgu; QA test planı. Betik: [`arac/callshove-duyarlilik.mts`](arac/callshove-duyarlilik.mts) | Poker Uzmanı, QA | ✅ Tamamlandı (düzeltmeler devredildi) |
| [`2026-11-11/05-spr-value-paketi.md`](2026-11-11/05-spr-value-paketi.md): 7 soruluk SPR/value quizi, `replay`'den geçen 3 spot taslağı (c38, c39, t26), 1 reddedilen taslak (c37) | Poker Eğitim, Poker Uzmanı | ✅ Tamamlandı (spotlar devredildi) |
| [`2026-11-11/06-blind-savunmasi-rehberi.md`](2026-11-11/06-blind-savunmasi-rehberi.md): blog taslağı, sayılar yeniden ölçüldü | Content, Poker Uzmanı | ✅ Taslak tamam (`blog.ts`'e ekleme devredildi) |

### 1. çalışma (2026-11-11)

| Çıktı | Rol | Durum |
|---|---|---|
| [`2026-11-11/01-spot-denetimi.md`](2026-11-11/01-spot-denetimi.md): 53 elle yazılmış spotun denetimi | Poker Uzmanı, QA | ✅ (D-7 ve QA test önerisi 3, 2. çalışmada CS-5 ile değiştirildi) |
| [`2026-11-11/02-blind-savunmasi-paketi.md`](2026-11-11/02-blind-savunmasi-paketi.md): 8 soruluk quiz, 4 spot taslağı | Poker Eğitim | ⚠️ Quiz tamam. c34 revizyon bekliyor |
| [`2026-11-11/03-oturum-ritmi-spec.md`](2026-11-11/03-oturum-ritmi-spec.md): ara kartı ve `Seri` sayacının kaldırılması | Davranış Bilimleri, UI/UX, Frontend | ✅ Spesifikasyon tamam |

## Devredilen işler (Claude Code) — hepsi açık

1. **Spot metin düzeltmeleri** (01: O-1…O-3, D-1…D-6). D-7 artık geçersiz; yerine CS-5.
2. **Ondalık ayırıcı kararı (CS-5).** Kullanıcıya görünen bütün metinlerde virgül. Elle yazılan 53 spotun seçenek ve gerekçelerindeki noktalı sayılar virgüle çevrilecek; test `/\d\.\d/` yasaklayacak (yalnızca görünen metinde; `seq` ve `potBB` gibi veri alanları hariç).
3. **`acceptable?: number[]` alanı** (B-1). Etkilenen spotlar: c09, c23, c24, c34 (taslak), c39 (taslak).
4. **Yeni spotlar:** c35, c36, t25 (02), c38, c39, t26 (05). c34 revizyon bekliyor.
5. **Ara kartı ve `Seri` kaldırma** (03, 7 kabul ölçütü).
6. **Üretici iyileştirmeleri** (04): deneme sayısını 20.000'e çıkar (CS-2); dar/geniş aralık senaryosunda cevabı değişen 19 spota "rakibin aralığı" cümlesi ekle (CS-1); `GEN` ek tablosu ile "SB'nin / CO'nun" (CS-4). Sonra `npm run ranges` ve `npm test`.
7. **Blog yazısı:** `06-blind-savunmasi-rehberi.md` → `src/data/blog.ts`, 7. yazı.

## Alınan teknik ve ürün kararları

- Ekip çıktıları `docs/ekip/` altında; hafıza dosyası `docs/ekip/HAFIZA.md`. Analiz betikleri `docs/ekip/arac/` altında, depoya göreli yollarla ve sabit tohumla.
- Equity iddiaları projenin kendi değerlendiricisiyle (`evaluator.ts`) ve `ranges.json` aralıklarıyla kontrol edilir. Bu aralıklar yaklaşıktır, solver çıktısı değildir; her raporda böyle belirtilir. Mümkünse (flop/turn spotları) Monte Carlo yerine tam sayım yapılır.
- **Rakip aralığına bağlı spotlarda aralık `note` alanında açıkça yazılır.** Aralık tek cümleyle tarif edilemiyorsa spot eklenmez (c37 bu nedenle reddedildi).
- ICM spotlarında ödül yapısı `note` alanında yazılı olmalı.
- Ödül döngüsü mekanikleri eklenmeyecek: seri, rozet, liderlik tablosu, günlük hedef zinciri.
- Pot odds gerekçeleri tek sokak üzerinden yapılır; iki kartlık yüzde yalnızca all-in ya da iki sokak garantiliyse.
- **Ondalık ayırıcı:** görünen metinde virgül (Türkçe yazım, arayüzdeki `fmt()` ile uyumlu). Veri alanlarında (`seq`, `potBB`) nokta.

## Tespit edilen hatalar

| # | Yer | Önem | Durum |
|---|---|---|---|
| O-1 | c17: tek bahsin fiyatı iki kartlık equity ile karşılaştırılmış | Orta | Açık |
| O-2 | t10: "KJo yarı yarıya" (ölçülen %55); ödül yapısı yok | Orta | Açık |
| O-3 | c25: exploit fold, fiyat (%23.5) yazılmamış | Orta | Açık |
| CS-1 | 19 `callshove` spotu aralık varsayımına duyarlı, gerekçe söylemiyor | Orta | Açık |
| CS-2 | s6-SB-85o (pay 2.4) ve s10-CO-A4s (pay 3.3), 3.5 puan kuralını ihlal ediyor | Orta | Açık |
| D-1…D-6 | c19, c20, c21, c27, t21, t22: sayı ve ifade hataları | Düşük | Açık |
| CS-3 | 8 call spotu ICM'e duyarlı (hata değil, gelecek varyant için not) | Düşük | Bilgi |
| CS-4 | Üretilen gerekçelerde "SB'un", "CO'un" | Düşük | Açık |
| CS-5 | Ondalık ayırıcı tutarsız: elle yazılanlar nokta, üretilen 70 spot ve `fmt()` virgül | Düşük | Açık (karar verildi: virgül) |
| D-7 | t23 "25,8 BB" | — | **Geçersiz**, CS-5 ile değiştirildi |
| B-1 | Karışık stratejili spotlarda tek doğru cevap | Bilgi | Ürün kararı bekliyor |

## Doğrulanamayan konular

- Solver karşılaştırması yapılamadı. c09, c23, c24, c25, c34 ve c39'daki "karışık strateji" yorumları genel bilgiye dayanıyor.
- t07, t09'da ödül yapısı yok; ICM kararları sayısal olarak doğrulanamadı.
- Push aralıklarının Nash push/fold tablolarına yakınlığı bilinmiyor. Duyarlılık senaryolarındaki %60/%150 oranları keyfi.
- Set mining için "kalan stack, call'un 15-20 katı" kuralının kaynağı doğrulanamadı; c38 bu kurala değil, doğrudan hesaba dayandırıldı.
- Davranış önerilerindeki süreler (20–30 dk bölüm, günde 60–90 dk) genel öğrenme literatüründen; poker eğitimine özgü kanıt yok.

## Atlanan roller ve nedenleri

- **Data Analyst** (1. ve 2. çalışma): Kullanıcı verisi sağlanmadı. Uydurma veriyle analiz yapılmaz.
- **Backend, UI/UX, Frontend** (2. çalışma): Bu turdaki işler sunucu ya da arayüz değişikliği gerektirmiyor; önceki spesifikasyon hâlâ uygulanmayı bekliyor, yenisini eklemek birikimi artırırdı.
- **Davranış Bilimleri** (2. çalışma): Yeni bir çalışma planı ya da mekanik önerilmedi.

## Sonraki öncelikler

1. **Devredilen 7 işin durumu.** Hiçbiri uygulanmadıysa yeni içerik üretmek yerine bunu kullanıcıya bildir; birikim büyüyor. Uygulandıysa `npm test` çalıştır ve bulguları "Kapandı" yap.
2. **Üretilen 115 açılış ve 211 push/fold spotunun örneklem denetimi** (callshove ile aynı yöntem: aralık sınırına uzaklık, hedef yüzde ±%30 senaryosu).
3. **README Aşama 3 "gelişmiş istatistikler"** için UI/UX + Backend spesifikasyonu (veri modeli zaten `attempts` tablosunda). Kullanıcı verisi gelmeden Data Analyst çalışmaz.

## Agent sorumlulukları (kısa)

Poker Uzmanı: doğruluk ve varsayımlar · Poker Eğitim: quiz ve spot · Data Analyst: yalnızca gerçek veriyle · Davranış Bilimleri: yük ve motivasyon, kanıt düzeyiyle · Content: makale · UI/UX → Frontend → Backend: spesifikasyon, kod Claude Code'a · QA: test planı ve doğrulama vakaları · CEO: önceliklendirme, kalite kontrolü, hafıza.

# Proje hafızası — Poker Defteri AI ekibi

Zamanlanmış "CEO Agent" çalışmalarının ortak hafızası. Her çalışma önce bu dosyayı okur, sonunda günceller. Ürünün teknik dokümantasyonu `README.md`'de. Çalışma çıktıları `docs/ekip/<tarih>/`, analiz betikleri `docs/ekip/arac/`, spot denetimleri `docs/denetim/` altında.

Son güncelleme: **2026-11-11, 4. çalışma**

## Kullanıcıdan beklenenler (önemli)

1. **Dallar birleştirilmeli.** Her çalışma ana dalın temiz kopyasından başlıyor. 1–3. çalışmalar ayrı dallarda kaldığı için 3. çalışma ilk ikisini görmedi ve ikinci bir hafıza dosyası açtı. 4. çalışma hepsini `claude/wizardly-meitner-wcrqqc` dalında birleştirdi. Bu dal ana dala alınmazsa bir sonraki çalışma yine sıfırdan başlar.
2. **Görev metnindeki `[HAFIZA_DOSYASI_ADI]` doldurulmalı.** Öneri: `HAFIZA.md` (depo kökü).
3. Yayın ortamı ve gerçek `ANTHROPIC_API_KEY` ile asistan testi (README Aşama 1, adım 10).
4. Kullanıcı verisi (VPIP/PFR/3-Bet ya da alıştırma geçmişi dökümü). Gelmezse Data Analyst çalışmaz.

## Mevcut durum

- Next.js 16 + React 19 + PostgreSQL + Claude API. Türkçe Texas Hold'em çalışma sitesi, gerçek parayla oyun yok, 18+.
- 575 spot (53 elle yazılmış + 522 üretilmiş), 138 sözlük terimi, 7 blog yazısı.
- Sağlık (4. çalışma): `npm test` **601/601**, `npm run typecheck` temiz. `next build` bu çalışmada çalıştırılmadı (3. çalışmada temizdi).
- Alıştırma masasında `Seri` sayacı yok; engellemeyen ara kartı var (varsayılan 20 elde bir ya da 25 dakikada bir, ayarlanabilir).

## Tamamlananlar

### 4. çalışma — rapor: [`docs/ekip/2026-11-11/07-calisma-4-kapanis.md`](docs/ekip/2026-11-11/07-calisma-4-kapanis.md)

| Çıktı | Rol | Durum |
|---|---|---|
| Üç dalın ve iki hafıza dosyasının birleştirilmesi | CEO | ✅ |
| Spot düzeltmeleri: t10 (O-2), c25 (O-3), c19 (D-1), c20 (D-2), c21 (D-3), t21 (D-5); sayılar yeniden ölçüldü | Poker Uzmanı, QA | ✅ |
| Regresyon testi: seçeneklerdeki all-in tutarı `replay` ile ±1 BB | QA | ✅ |
| `Seri` sayacının kaldırılması, `BreakCard`, `rhythm.ts` + 7 birim testi, 11 konuluk `TOPIC_NOTES` | Frontend, Poker Eğitim, QA | ⚠️ Kısmen: masaüstü yerleşimi ve koç kısayolu eksik |

### 3. çalışma — rapor: [`docs/denetim/2026-11-11-elle-yazilmis-spotlar.md`](docs/denetim/2026-11-11-elle-yazilmis-spotlar.md)

- Düzeltilen spotlar: t22 (A2o'ya çevrildi), c27, c17, c20 ("çekişsiz"), c21 (bahis boyutu).
- Equity regresyon testleri (t05, t06, t22 Monte Carlo; c26 kesin sayım).
- Blog: `risk-primi-hesabi` (t07, t10, t17 ile ICM başabaş hesabı).

### 1. ve 2. çalışma — `docs/ekip/2026-11-11/01`–`06`

| Çıktı | Durum |
|---|---|
| 01 spot denetimi | ✅ Bulguların çoğu kapandı (bkz. hata tablosu). **Dikkat:** O-2 ve O-3'teki sayılar yanlıştı (Q-1, Q-2) |
| 02 blind savunması paketi (quiz, 4 spot taslağı) | ⚠️ Quiz tamam; c35, c36, t25 eklenmedi; c34 revizyon bekliyor |
| 03 oturum ritmi spesifikasyonu | ✅ 4. çalışmada büyük ölçüde uygulandı |
| 04 callshove duyarlılık denetimi + betik | ✅ Rapor; CS-1, CS-2, CS-4 düzeltmeleri açık |
| 05 SPR/value paketi (quiz, c38, c39, t26 taslakları) | ⚠️ Spotlar eklenmedi |
| 06 blind savunması rehberi (blog taslağı) | ⚠️ `blog.ts`'e eklenmedi |

## Devam eden / açık işler

1. **Ara kartı tamamlama:** masaüstünde masa arkada soluk kalsın ve koç paneli açık kalsın; "Bu bölümü yorumla" kısayolu (`AiPanel`, `practice` bağlamı, `STATIC_SITE`'ta gizli); 60 dk notunun arayüzde doğrulanması.
2. **Yeni spotlar:** c35, c36, t25 (02), c38, c39, t26 (05). c34 revizyon bekliyor. Eklemeden önce her birinin sayıları `replay` ile yeniden kontrol edilmeli (Q-1 dersi).
3. **`acceptable?: number[]` alanı** (B-1): c09, c23, c24 (+ c34, c39 taslakları). Ürün kararı da gerekiyor.
4. **Üretici iyileştirmeleri** (04): deneme sayısı 20.000 (CS-2), 19 callshove spotuna "rakibin aralığı" cümlesi (CS-1), "SB'nin / CO'nun" (CS-4). Sonra `npm run ranges` ve `npm test`.
5. **Ondalık ayırıcı (CS-5):** görünen metinde virgül. Elle yazılan spotlarda nokta duruyor (4. çalışmada eklenen metinler de mevcut biçime uyması için nokta kullandı). Test: görünen metinde `/\d\.\d/` yasak.
6. **Blog:** `06-blind-savunmasi-rehberi.md` → `blog.ts`.
7. t23 turnuva spotunda ante yok; t13 "88 yarı yarıya" iddiası için resteal aralığı yok.
8. ICM hesap makinesinde elenmiş (stack 0) oyuncunun gösterimi kontrol edilmedi.

## Alınan teknik ve ürün kararları

- **Hafıza dosyası kökteki `HAFIZA.md`.** `docs/ekip/HAFIZA.md` yalnızca yönlendirme.
- Equity iddiaları projenin kendi değerlendiricisiyle ve `ranges.json` ile kontrol edilir. Bu aralıklar yaklaşıktır, solver çıktısı değildir; her raporda böyle yazılır. Mümkünse tam sayım yapılır.
- **Pot hesabında karşılanmayan (uncalled) bahis pota sayılmaz.** Gereken equity = call / (call sonrası gerçekten çekişilen pot). Sayılar `replay` çıktısından alınır, elle değil.
- Cevap, gereken equity'ye referans aralıklarla 3,5 puandan yakınsa spot değiştirilir ya da "sınırda" diye açıkça yazılır.
- Rakip aralığına bağlı spotlarda aralık `note`'ta yazılır; tek cümleyle tarif edilemiyorsa spot eklenmez.
- ICM spotlarında ödül yapısı `note`'ta yazılır ve "varsayım" olarak belirtilir; kaybedenin garanti ödülü hesaba katılır.
- Pot odds gerekçeleri tek sokak üzerinden; iki kartlık oran yalnızca all-in ya da iki sokak garantiliyse.
- **Ödül döngüsü mekanikleri yok:** seri, rozet, liderlik tablosu, günlük hedef zinciri. Ara kartındaki iki seçenek eşit görsel ağırlıkta.
- Oturum ritmi verisi yalnızca tarayıcıda (`localStorage["pd:rhythm"]`); sunucuya kişisel veri gitmez.
- Ondalık ayırıcı: görünen metinde virgül (karar verildi, uygulanmadı). Veri alanlarında nokta.
- Blog yazıları `POSTS` dizisine kronolojik sırayla eklenir.

## Tespit edilen hatalar

| # | Yer | Önem | Durum |
|---|---|---|---|
| Q-1 | 01 denetimi, t10: chip eşiği 29/81 (%35.8) verilmiş; doğrusu 29/61 (%47.5) | Orta | Düzeltildi (4) |
| Q-2 | 01 denetimi, c25: gereken equity %23.5 verilmiş; doğrusu %30.8 | Düşük | Düzeltildi (4) |
| O-1 | c17 iki kartlık oran | Orta | Kapandı (3) |
| O-2 | t10 ödül yapısı yok, "yarı yarıya" | Orta | Kapandı (4) |
| O-3 | c25 fiyat yazılmamış | Orta | Kapandı (4) |
| CS-1 | 19 callshove spotu aralığa duyarlı, gerekçe söylemiyor | Orta | Açık |
| CS-2 | s6-SB-85o, s10-CO-A4s 3,5 puan kuralını ihlal ediyor | Orta | Açık |
| D-1…D-6 | c19, c20, c21, c27, t21, t22 | Düşük | Kapandı (3 ve 4) |
| CS-4 | "SB'un", "CO'un" | Düşük | Açık |
| CS-5 | Ondalık ayırıcı tutarsız | Düşük | Açık |
| T-1 | t23 turnuva spotunda ante yok | Düşük | Açık |
| UX-1 | Ara kartı masaüstünde masanın yerini alıyor, koç kısayolu yok | Düşük | Açık |
| B-1 | Karışık stratejili spotlarda tek doğru cevap | Bilgi | Ürün kararı bekliyor |

## Doğrulanamayan konular

- Solver karşılaştırması yapılamadı (c09, c23, c24, c25, c34, c39'daki karışık strateji yorumları; postflop range avantajı iddiaları).
- t07, t09 ödül yapısı yok. t13 resteal aralığı yok.
- Push aralıklarının Nash tablolarına yakınlığı bilinmiyor.
- Set mining "15–20 kat" kuralının kaynağı.
- Davranış önerilerindeki süreler (20–30 dk bölüm, 25 dk ara, günde 60–90 dk) genel öğrenme literatüründen; poker eğitimine özgü kanıt yok.

## Atlanan roller

- **Data Analyst** (1–4): kullanıcı verisi yok. Uydurma veriyle analiz yapılmaz.
- **Davranış Bilimleri** (2–4): yeni mekanik önerilmedi; 1. çalışmadaki spesifikasyon geçerli.
- **Backend** (2–4): sunucu değişikliği gerekmedi.

## Sonraki öncelikler

1. **Dal durumu kontrolü.** Bu dal ana dala alınmadıysa yeni iş üretme; önce kullanıcıya hatırlat, sonra bu daldan devam et.
2. **Bekleyen içeriği siteye almak:** 6 spot taslağı (sayılar `replay` ile yeniden kontrol edilerek) ve blind savunması blog yazısı. Yeni içerik üretmeden önce bunlar.
3. **Ara kartının masaüstü yerleşimi ve koç kısayolu** (UX-1) ya da üretici iyileştirmeleri (CS-1, CS-2, CS-4). Biri seçilmeli.
4. Gelişmiş istatistikler (Aşama 3) için UI/UX + Backend spesifikasyonu, 2 ve 3'ten sonra.

## Agent sorumlulukları

Poker Uzmanı: doğruluk ve varsayımlar, sayılar `replay` ile · Poker Eğitim: quiz, spot, konu notları · Data Analyst: yalnızca gerçek veriyle · Davranış Bilimleri: yük ve motivasyon, kanıt düzeyiyle · Content: makale · UI/UX → Frontend → Backend: spesifikasyon ve uygulama (bu rutin Claude Code olduğu için kod da burada yazılabilir) · QA: test planı, regresyon testi, önceki raporların sayılarını da kontrol · CEO: önceliklendirme, kalite kontrolü, hafıza.

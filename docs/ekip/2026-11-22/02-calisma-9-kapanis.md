# 9. CEO çalışması: kapanış (2026-11-22)

## Başlangıç durumu

- `HAFIZA.md` son kez 2026-11-11'de (8. çalışma) güncellenmişti. Arada yeniden tasarım (kapı 1 → H) yapıldı ve PR #5–#9 ile varsayılan dala (`claude/charming-davinci-emhvz1`, `8bb0faf`) alındı. Son commit 2026-11-13; o günden beri depoda hareket yok.
- Geçici kural (yalnızca `docs/`) yürürlükte: yeniden tasarım bitmedi, müfredatta 187 dersin 96'sı dolu. Boş üniteler: cash c9–c13, turnuva t5–t10 (iskelet numaralandırmasıyla).
- Sağlık (bu çalışmada çalıştırıldı): `npm test` **800/800**, `npm run typecheck` temiz. Statik derleme çalıştırılmadı.
- Görev metnindeki `[HAFIZA_DOSYASI_ADI]` hâlâ doldurulmamış; dosya kökteki `HAFIZA.md` olarak okundu.

## CEO önceliklendirme

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | t5 (Push/fold) içerik öncesi doğruluk paketi | Sıradaki boş turnuva ünitesinin sayılarını içerik yazılmadan doğrulamak | Her sayı betikle ya da elle tekrar edilebilir; varsayımlar yazılı; doğrulanamayanlar etiketli; 10 soruluk quiz cevap + gerekçeyle; QA vakaları denetim betiğinin tiplerine eşlenmiş | Poker Uzmanı, Poker Eğitim, QA |
| 2 | Açık engellemeyen bulguların tek listesi | Kapı kararlarına dağılmış açık işleri önem sırasıyla Claude Code'a devretmek | Her madde kaynağa (kapı) bağlı, önem derecesi var | QA |
| 3 | Hafızanın yeniden tasarım sonrası duruma getirilmesi | Sonraki çalışmaların eski dal/sayı bilgisiyle yanlış başlamasını önlemek | Eskimiş maddeler (P-1, P-3, sayılar) güncel | CEO |

Çalışmayan roller: **Data Analyst** (kullanıcı verisi yok), **Davranış Bilimleri** (yeni mekanik yok; t5 dersleri mevcut ders süresi ve ustalık kurallarını kullanacak), **Content** (makale yerine ünite paketi daha değerli; ders anlatımı uygulayıcı ajanın işi), **UI/UX, Frontend, Backend** (yeni ekran yok; kod geçici kural gereği yazılamaz).

## Çıktılar

1. [`01-t5-pushfold-dogruluk-paketi.md`](01-t5-pushfold-dogruluk-paketi.md) ve betik [`../arac/pushfold-t5.mts`](../arac/pushfold-t5.mts).
2. Aşağıdaki açık bulgular listesi.
3. `HAFIZA.md` güncellendi.

## Açık bulgular (QA, önem sırasıyla) · Claude Code'a devredildi

| # | Kaynak | Bulgu | Önem |
|---|---|---|---|
| T5-1 | bu çalışma | `t5-d4` kazanımı ("aralık iyice genişler") ante'li modelde sayıyla desteklenmiyor; en zayıf eller 6 BB'de 10 BB'den kötü | Orta (içerik yazılmadan düzeltilmeli) |
| K-C1 | Kapı C | 360x640'ta koç açıkken pencere hero kartlarını ve board'u örtüyor; 18+ satırı pencerenin altında kalıyor | Orta (18+ görünürlüğü değişmez 3'e dokunuyor) |
| K-G1 | Kapı G | `/gizlilik` statik sürümde yapay zekanın veriyi nasıl işlediğini anlatıyor; `/yapay-zeka` statik derlemede duruyor | Orta (yanlış bilgi) |
| K-G2 | Kapı G | Aksiyon butonu pasifleşince klavye odağı `BODY`'ye düşüyor | Orta (erişilebilirlik) |
| K-G3 | Kapı G | Kutlama el sonu ekranında 1,7 sn başlığı örtüyor | Düşük |
| K-B1 | Kapı B | 17 spotta hero BTN açılış aralığı dışındaki bir elle açmış görünüyor | Düşük (pot odds hesabını etkilemiyor, öğretici tutarsızlık) |
| T5-2 | bu çalışma | `ranges.json` push aralıkları ante modeli içermiyor; turnuva pisti BB ante 1 BB varsayıyor | Düşük |
| K-A1 | Kapı A | Bölünen potta artan chip SEATS sırasına gidiyor (butonun solundaki ilk oyuncu olmalı) | Düşük |
| S-1 | bu çalışma | Sözlükte "Risk primi" teriminin kimliği `stall` (`src/data/glossary.ts:208`); bağlantı `#stall` oluyor. "Stall" ayrı bir turnuva kavramı (oyunu bilerek yavaşlatmak), ileride çakışır | Düşük |
| K-E1 | Kapı E | Site menüsünde bazı bağlantılar 44 px genişliğin altında (24 px'i geçiyor) | Bilgi |
| G-2 | 8. çalışma | Konu tablosu ve dışa aktarma son 5000 cevapla sınırlı, söylemiyor | Düşük |

## CEO kalite kontrolü

| Çıktı | Kriter | Sonuç |
|---|---|---|
| t5 paketi: aritmetik | Her oran elle yeniden hesaplandı (9/21, 14/31, 5/13, 9,5/12, 14,5/17, 5,5/8, 7,8/22,5, 12,8/31,5) | ✅ |
| t5 paketi: model sayıları | K5o örneği formülle elle yeniden kuruldu (+1,05); `ranges.json` yüzdeleri kombinasyon sayımıyla | ✅ (Monte Carlo, ±0,5 puan payı yazılı) |
| t5 paketi: varsayımlar | Ante, kapsama, en iyi cevap ≠ denge, ICM yok, ante'siz aralık | ✅ |
| t5 paketi: doğrulanamayanlar | Nash tablo sayıları, 15 BB push/açılış sınırı, çok oyunculu call aralıkları etiketli | ✅ |
| t5 paketi: quiz | 10 soru, cevap ve gerekçe; 5 tanesi denetim tipine eşli | ✅ |
| t5 içeriği (`t5.json`) | — | ❌ **Yazılmadı** (geçici kural). Devredildi. |
| Açık bulgular | Kaynaklı ve önem sıralı | ✅ (yalnızca liste; hiçbiri bu çalışmada düzeltilmedi) |

Poker iddiaları ikinci kez gözden geçirildi: "72o push kârlı" sonucu genellenmiyor, bunun yerine d7'de tuzak örneği olarak öneriliyor; "chip EV" para değil diye yazıldı.

## Sonraki öncelikler

1. **Uygulayıcı ajan (Claude Code):** t5 içeriği bu pakete göre, önce T5-1 kararı (Onay Ajanı'na sapma olarak). Ardından c9.
2. **Claude Code:** K-C1, K-G1, K-G2 (değişmezlere ve erişilebilirliğe dokunan üç açık bulgu).
3. **CEO çalışması:** c9 (Flop: board ve c-bet) için doğruluk paketi. Range/nut avantajı iddiaları solver'a dayandığı için önce "neyi sayıyla gösterebiliriz" listesi (board'a göre aralık equity'si projenin değerlendiricisiyle).

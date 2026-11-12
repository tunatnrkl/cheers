# Karar günlüğü (Onay Ajanı)

Ürün sahibi 2026-11-12'de aşama onaylarını ve açık kararları Onay Ajanı'na devretti. Görev tanımı: [`ONAY-AJANI.md`](ONAY-AJANI.md). Her kapı kararı buraya eklenir.

## 2026-11-12 · Kapı 1: repo analizi ve altı açık karar · PLAN: ONAY

| # | Konu | Karar | Koşullar |
|---|---|---|---|
| 1 | Derleme aracı | Next.js'te kal | **Brif sapması** (aşağıda). `out/` üzerinde "harici istek yok" testi. Yeni çalışma anı bağımlılığı yok. |
| 2 | Koç canlı sitede | Pages'te yazılı ve kural tabanlı koç; sunuculu kurulumda aynı pencere yapay zekaya bağlanır | Pages'te pencere kendini "yapay zeka" diye tanıtmaz. Yalnızca spot verisindeki doğrulanmış sayılar. Çıktıda anahtar ya da API adresi olmadığı testle doğrulanır. |
| 3 | Rakip eli | 70 pot odds spotu rakip aralığına karşı yeniden üretilir; rakip eli veride durmaz, showdown'da türetilir | Kimlikler değişmez. Aralık "varsayım" olarak yazılır. Cevabı değişen spotlar önce/sonra tablosuyla raporlanır. Ayrı kapıdan geçer. O kapı geçilmeden pot odds spotlarına dokunan özellik yayınlanmaz. |
| 4 | XP, günlük seri, kutlama | Brif uygulanır, sınırlarla | XP, günlük seri, seviye yalnızca Öğren'de. Alıştırmada yalnızca 5 ve 10'luk seride "Şerefe!". XP sabit; rastgele ödül, sandık, çarpan, can, rozet, liderlik tablosu, bildirim, geri sayım yok. Seri kopunca nötr dil. Ara kartı korunur. |
| 5 | Zamanlanmış ekip çalışmaları | `HAFIZA.md` başına kural: yeniden tasarım süresince yalnızca `docs/` | Uygulayan ajan her aşama başında varsayılan dalda `src/` altında yabancı commit arar; kural çiğnenirse ürün sahibine bildirir. |
| 6 | Yayın | Aşama aşama | Yayın iş akışına derlemeden önce `npm test` ve `npm run typecheck` eklenir. Bitmemiş bölüm bağlantısız kalır. |

### Brif sapmaları

- **Karar 1.** Brif "derleme aracı yok, saf HTML/CSS/JS" diyor. Site Next.js ile derlenmeye devam ediyor; yayınlanan çıktı saf statik HTML/CSS/JS ve çalışma anında harici kütüphane yok. Gerekçe: 577 spot ve 631 testi elle yazılmış koda taşımak veri ve doğruluk için en yüksek risk. Son söz ürün sahibinde.
- **Karar 4, kalıcı sayaç.** Brif alıştırma üst çubuğunda bira ikonlu seri sayacı istiyor; ajan kalıcı sayacın geri gelmemesini koşul koydu. Uygulama: sayaç yalnızca seri 5'e ulaştığında görünür.

### Ek kurallar

1. Her kapıda kanıt: `npm test`, `npm run typecheck`, statik derleme, ekran görüntüsü.
2. Brif metninden her sapma bu dosyada "brif sapması" olarak yazılır.
3. İlerleme şemasına dokunan her değişiklikte eski `pd-…` anahtarlarını okuyan geçiş testi; XP ve seri yeni anahtarlarda.
4. Yeni poker sayıları üreticiden gelir ve testle sabitlenir; emin olunmayan "doğrulama gerekli".
5. Sızıntı testi ve "harici istek yok" testi her yayında zorunlu kapı.

Ajanın denetim notu: depo salt okunur incelendi; test ve derleme ajan tarafından çalıştırılmadı, spot ve test sayıları uygulayan ajanın beyanıdır.

## 2026-11-12 · Kapı 2a: müfredat iskeleti · DÜZELT → düzeltildi

Ajan `npm test` ve typecheck'i kendisi çalıştırdı; 13 düzeltme istedi, hepsi uygulandı:

- **Önkoşul delikleri:** `o3-d1`, `o4-d1`, `t3-d1` artık önceki ünitenin kontrolünü istiyor. İki yeni test: pistin ilk dersi dışında önkoşulsuz ders olamaz; bitirme testine ulaşmak pistteki bütün kontrol derslerini gerektirir.
- **Erken kullanılan kavramlar:** equity `c6-d1` ve `t3-d5` içinde, 3-bet `c6-d4` içinde, kombinasyon sayımı `o4-d1` içinde tanımlanıyor; `t5-d7` ICM'e ileri atıfla yazıldı. `c7-d2` kazanımına value/blöf dengesi eklendi.
- **Eksik ders:** turnuva pistine "Turnuvada açılış aralıkları" (`t3-d2`) eklendi.
- **Ortak testler:** `o2-t` ve `o4-t` yalnızca ortak üniteleri açar; piste özgü üniteler kendi testleriyle açılır.
- **Sızıntı denetimi:** simgeli ve bitişik yazım ("A♠ K♦", "Q♥Q♦"), hero eliyle aynı soruda geçen rakip eli ve seçenek metinleri de yakalanıyor; testleri eklendi.

Onaylanan tercihler: ortak temel üniteler (o1–o4), bankroll yönetiminin dışarıda kalması, tekrar derslerinin zorunlu olmaması.

### Brif sapması

- **Seviye testleri 20 alıştırma hedefliyor** (brif: ders başına 8–12). Test birkaç üniteyi örneklediği için.

Yayın: düzeltmeler yeşil olduğunda yeniden kapı gerekmeden birleştirilebilir (iskelet bağlantısız, kullanıcıya görünmez).

İçerik aşamasına notlar: `c9-d4` ve `t8-d3` "çoğunlukla" ile yumuşatılacak; `c8-d1`'deki equity sayıları üreticiden gelip testle sabitlenecek; dolu derslerde sözlük bağlantısı beklenir.

## 2026-11-12 · Çalışma düzeni: uygulayıcı ajanlar

Ürün sahibi "bana sormak yerine her seferinde bir ajan ata ve işi bitir" dedi. Bundan sonra:

- İşler birbirine dokunmayan iş kollarına bölünür ve her biri ayrı bir uygulayıcı ajana verilir (ayrı çalışma kopyasında). Koordinatör (Claude Code) sonuçları birleştirir, testleri ve derlemeyi çalıştırır.
- Her iş kolunun çıktısı Onay Ajanı kapısından geçer; ONAY alan ve testleri yeşil olan iş yayınlanır.
- Sıra sorusu (önce görünen işler mi, müfredat mı) paralel çalışmayla ortadan kalktı. İlk tur: (A) el motoru, (B) rakip eli sızıntısı ve 70 pot odds spotunun yeniden üretimi, (D) müfredat o1–o2 içeriği, (E) Öğren yol haritası ve ders ekranı. İkinci tur: (C) alıştırma ekranı ve koç penceresi (A ve B'ye dayanır), animasyonlar, kalan üniteler, ana sayfa, kutlama.

## 2026-11-12 · Kapı B: rakip eli sızıntısı ve 70 pot odds spotu · ONAY

Ajan 5 spotu projenin değerlendiricisini kullanmadan kendi yazdığı hesaplayıcıyla yeniden hesapladı (5/5 tuttu); `npm test` 662/662 ve typecheck'i kendisi çalıştırdı. Koordinatör statik derlemeyi yeşil gördü ve masanın ekran görüntüsünü aldı (`2026-11-12/kapi-b-masa.png`): rakip koltuğunda yalnızca kart sırtı, not aralıkla anlatıyor.

- **Görevden sapma:** 22 spotta hero eli değişti (4'ü sınırdaydı; 18'i aralığa karşı %10'un altında equity'li "ölü el"di, `DEAD_BELOW = 0.1`). Kimlikler, board, aksiyon dizisi ve pot değişmedi. Kabul edildi.
- Kimliğinde kart yazan 22 spotta kimlik eski hero elini taşıyor; kimlik arayüzde görünmüyor, rakip elini taşımıyor. Kabul edildi.
- 25 call cevabı, rakibin çekişle all-in yaptığı varsayımına bağlı; gerekçeler bunu söylüyor. Dar/geniş aralık sınırı "doğrulama gerekli" olarak raporda.
- **Ayrı iş olarak kayda alındı:** 17 spotta hero BTN'den açılış aralığı dışındaki bir elle açmış görünüyor (eski üretimden); pot odds hesabını etkilemiyor.
- **El motoru (A) kabul ölçütüne eklendi:** showdown'da rakip eli aralıktan sabit tohumla türetilir; el bitmeden hiçbir yerde bulunmaz.

## 2026-11-12 · Kapı D: müfredat o1–o2 içeriği · DÜZELT → düzeltildi (ONAY sayılır)

Ajan 58 kural/terim sorusunun hepsini ve betikli 111 sorunun neredeyse tamamını kendisi çözdü; doğrulukta hata yok. İstenen dört metin düzeltmesi uygulandı: preflop/postflop, pot, chip ve board ilk kullanıldıkları derste tanımlanıyor; "cep çifti" yerine "kapalı kartlarındaki çift"; bahis turunun bitiş kuralı tamamlandı ("elde kalan herkes en az bir kez konuşmuş ve aynı miktarı koymuşsa"); raporlardaki betik iddiası gerçeğe indirildi (pot ve sayı sorularında terimler elle girilir, betik işlemi doğrular). Kapının koşuluna göre testler yeşil olunca yeni kapı gerekmeden ONAY sayılır. İçerik, Öğren ekranı bağlanınca görünür olacak.

## 2026-11-12 · Kapı A: el motoru · ONAY

Ajan 699/699 testi ve typecheck'i kendisi çalıştırdı; eksik all-in, min raise, BB preflop seçeneği, postflop ve heads-up konuşma sırası, yan pot ve iade, ante senaryolarını elle kurup doğruladı. Gizlilik: rakip eli durumda tutulmuyor, yalnızca showdown olayında görünüyor; testler bunu tüm spotlarda iki hatla kanıtlıyor. Değerlendirme: ilk karardan sonra her karar "tahmini"; gerekçelerde kesinlik dili yok; MC tohumlu, aynı durum aynı kademeyi verir. Rakip: 2082 aksiyonun yaklaşık %5'i all-in, nuts ile fold yok.

Uygulayıcı kararları kabul edildi: seçeneklerde olmayan preflop hamlesi "hata"; stack'i bitiren call "call" (olayda stack 0); hero fold edince el oynatılmaz; board ve rakip elleri yalnızca spot kimliğine bağlı; küçük MC (tahmini etiketiyle); gizlilik kriptografik değil.

Engellemeyen notlar: bölünen potta artan kuruş butonun solundaki ilk oyuncuya gitmeli (şu an SEATS sırası); heroNet BB ante'yi düşmüyor (replay.ts ile aynı model).

Arayüz (C) için kabul ölçütleri: olaylar sırayla oynatılır, son rakip aksiyonu son `aksiyon` olayından türetilir, miktarlar sokakta toplamdır; arayüz ve koç isteği yalnızca `state` ve `olaylar` kullanır, `gizliDagitim`/`araliklar.ts` import edilmez; "Bu eli tekrar oyna" aynı kartları getirdiği için arayüz bunu açıkça söyler; tahmini kararlar "Tahmini değerlendirme" etiketiyle, özet ekranında "solver değildir" notu; hero fold edince çok oyunculu potta "el oynatılmadı" denir.

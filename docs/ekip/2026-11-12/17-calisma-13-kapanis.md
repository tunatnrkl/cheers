# 13. çalışma: pot odds quiz'i, c19 düzeltmesi (Q-6), quiz'lerin Pages ve açık tema QA'sı

**Tarih:** 2026-11-12 (ek: kullanıcı talimatıyla 60 value spotu) · **Dal:** `claude/wizardly-meitner-56jps3` (12. çalışmanın dalı `iawfi2` üzerine kuruldu)

## Başlangıç durumu

- Varsayılan dal (`charming-davinci-emhvz1`, `8ffc135`) hâlâ 1–8. çalışmaları ve Cheers markasını içeriyor. 9–12 (`iawfi2`) birleştirilmedi. Bu çalışma `iawfi2`'nin üzerine kuruldu; dal bu yüzden 9–13'ü içeriyor.
- B-1 kararı gelmedi. Kullanıcı verisi yok. `[HAFIZA_DOSYASI_ADI]` hâlâ yer tutucu; `HAFIZA.md` kullanıldı.
- Sağlık (başlangıç): `npm test` 679/679.

## CEO önceliklendirmesi

B-1 gelmediği için hafızadaki 2. ve 3. öncelikler seçildi. Final masası ICM paketi (CS-3 son adımı) yeni bir model ve betik gerektiriyor; tek çalışmada güvenilir biçimde bitmez, bu yüzden ertelendi.

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | Pot odds quiz'i | `odds` konusunda ilk quiz; yalnızca var olan, testli spotlara dayanıyor | 5–10 soru; her sayı `quizzes.test.ts`'te yeniden hesaplanıyor; out sayıları evaluator ile kart kart sayılıyor; bağlanan spotlar aynı sayıları kullanıyor; doğru cevap farklı sıralarda | Poker Uzmanı, Poker Eğitim, QA |
| 2 | Quiz QA eksikleri (12'den) | GitHub Pages `basePath` ve açık tema | `basePath=/cheers` statik derlemede bütün iç bağlantılar önekli, 404 yok; iki temada metin kontrastı ≥ 4,5 (WCAG AA); 390/1366 px taşma 0, konsol 0 | QA, Frontend (gerekirse) |

**Çalışmayan roller:** Data Analyst (veri yok), Davranış Bilimleri (yeni mekanik yok; quiz bileşeni 12'de değerlendirildi), UI/UX ve Backend (yeni ekran ya da uç nokta yok), Content (pot odds yazısı zaten var; quiz ona bağlandı).

## 1. Poker Uzmanı + Poker Eğitim: `pot-odds-ve-cekisler` (8 soru)

| # | Konu | Doğru cevap | Kaynak spot | Test edilen sayı |
|---|---|---|---|---|
| 1 | Fiyat; paydaya call'u eklememe hatası | %29 | c17 | 3,7 / 12,9 ≈ %28,7 (`replay`); hatalı %40 ve %67 |
| 2 | Tek kart / iki kart oranı | ≈ %19 | c17 | 9/47 ≈ %19,1; river'a kadar %35,0 |
| 3 | Gutshot'a pot kadar bahis | Fold | c18 | 4/46 ≈ %8,7; gereken %33,3; başabaş için ≈ 102 BB ek kazanç, geride 72,25 BB; evaluator ile 4 out |
| 4 | Görülmeyen kart sayısı (rakip kapalı) | 8/46 ≈ %17,4 | c19 | evaluator ile 8 out / 46; gereken 4/24 ≈ %16,7 |
| 5 | Görülmeyen kart sayısı (rakip açık) | 44 | `o-QhKc-6cAh7hJc` | evaluator ile 9 out / 44; gereken ≈ %43,2 |
| 6 | 4 kuralının yüksek out'ta hatası | %54 | — | 15 out kesin %54,1, kural %60; 9 out kural %36, kesin %35,0 |
| 7 | Implied odds ve derinlik (set mining) | 200 BB + güçlü aralık | c13 | set ≈ %11,8 (kesin kombinasyon) |
| 8 | Yarım pot bahsin fiyatı | %25 | — | %25 / %33 / %20 |

- Doğru cevap sıraları: B, C, A, B, D, C, A, B.
- Varsayımlar sayfada: rake yok, out'lar temiz sayılır, kapalı rakip kartları görülmeyen kartlara dahil, implied odds için kesin sayı yok.
- Quiz dizinin başına eklendi: `pot-odds-adim-adim` yazısının "Quiz ile tekrarla" düğmesi artık bu quiz'i açıyor (önceden `spr-ve-value`'yu açıyordu, çünkü onun da ilk yazısı buydu).
- "Set mining 15–20 kat" kuralı bilinçli olarak kullanılmadı (kaynağı doğrulanamadı); soru 7 yalnızca kesin set olasılığına ve niteliksel implied odds koşullarına dayanıyor.

### Q-6: c19 gerekçesindeki hata (düzeltildi)

c19 gerekçesi "8 out'la river'da yaklaşık %18 (8 / 44); fiyat tek başına zaten yeterli" diyordu. Rakibin kartları kapalı; turn'de görülmeyen kart 46'dır: **8 / 46 ≈ %17,4**. Gereken equity 4 / 24 ≈ %16,7; fark 1 puanın altında, yani "rahatça yeterli" değil, kıl payı. 44, açık kartlı üretilmiş pot odds spotlarının paydasıdır; c19'a büyük olasılıkla oradan kaymış.

- Cevap değişmedi (Call): fark küçük ama aynı yöne iten iki etken (pozisyon, geride 72 BB ile implied odds) gerekçede açıkça yazılı. Hafızadaki "sınırda spot" kuralıyla uyumlu.
- Yeni gerekçe: "gereken equity 4 / 24 ≈ %16,7 … 8 / 46 ≈ %17,4 … fiyat kıl payı yetiyor, fark 1 puanın altında. Call'u rahatlatan, pozisyonda olman ve geride 72 BB varken tutarsan ek chip kazanabilmen (implied odds)."
- Benzer kayma var mı: bütün spotlardaki 71 "N / 4x" oranı tarandı, başka hata yok; bu tarama kalıcı test oldu.
- Test: out sayısı evaluator ile (KQ'ya karşı 8 river kartı), payda 46, fark 0–1 puan, metinde "8 / 46" var ve "8 / 44" yok.

Elle yazılmış diğer `odds` spotlarının sayıları da yeniden okundu: c17 (%28,7; 9/47 %19,1; %35,0), c18 (12/36; 4/46) doğru. c13 ve t14'te sayısal iddia yok, yalnızca implied odds gerekçesi.

## 2. QA

### Test planı ve sonuçlar

| Kontrol | Beklenen | Sonuç |
|---|---|---|
| `quizzes.test.ts` +8 test (pot odds quiz'i): `replay` fiyatları, evaluator ile out sayımı, kesin olasılıklar | Geçer | ✅ |
| Var olan yapı/metin testleri yeni quiz'i de kapsıyor (5–10 soru, tekil seçenek, spot var, ondalık virgül, yüzde eki, kazanç vaadi yok) | Geçer | ✅ |
| Genel payda testi (`hands.test.ts`): gerekçelerdeki 71 "N / 4x" oranının paydası görülmeyen kart sayısıyla aynı (kapalı rakip: 47/46, açık: 45/44). Eski c19 metniyle denendi, yakalıyor | Geçer | ✅ |
| `npm test` **688/688**, `npm run typecheck` temiz, `npm run build` temiz (`/quiz/pot-odds-ve-cekisler` statik) | | ✅ |
| **Pages statik derleme** (`STATIC_EXPORT=1`, `basePath=/cheers`, API klasörü çıkarılarak; workflow ile aynı), `/cheers/` altında sunuldu | Bütün iç bağlantılar `/cheers` önekli, 4xx yanıt yok | ✅ 5 quiz sayfası + liste, iki genişlik, iki tema: öneksiz bağlantı 0, 4xx 0, konsol hatası 0 |
| Quiz → "Bu fikri masada dene" (`/cheers/alistirma/?el=o-QhKc-6cAh7hJc`) | Alıştırma masası o spotu açar | ✅ |
| Blog → "Quiz ile tekrarla" (`/cheers/blog/pot-odds-adim-adim/`) | `/cheers/quiz/pot-odds-ve-cekisler/` | ✅ |
| **Kontrast** (açık ve koyu tema, her quiz sayfasında, bütün seçenekler işaretlendikten sonra; `main` içindeki metin öğeleri, ~193 öğe/sayfa) | ≥ 4,5 (büyük metin ≥ 3) | ✅ En düşük: koyu 5,53 ("Senin seçimin"), açık 4,79 (etiketler ve "Doğru cevap") |
| Cevaptan sonra soluklaşan seçenekler (`opacity-70`) | ≥ 4,5 | ✅ Opaklık hesaba katılınca açık 6,32, koyu 7,91 |
| Yatay taşma 390 / 1366 px, iki tema | 0 | ✅ |

Ölçüm yöntemi ve sınırları: kontrast WCAG göreli parlaklık formülüyle, metnin kendi rengi ve ilk opak üst öğenin arka planıyla hesaplandı. Yarı saydam arka planlar opak sayıldı; ikon ve kenarlık kontrastı (WCAG 1.4.11) ölçülmedi. Açık temanın en düşük değeri (4,79) eşiğe yakın: renk değişkenleri değiştirilirse yeniden ölçülmeli. Gerçek ekran okuyucu (NVDA/VoiceOver) hâlâ denenmedi. Yayındaki GitHub Pages sitesi değil, aynı ayarlarla yerelde üretilen statik çıktı denendi.

### Hatalar (önem sırasıyla)

| # | Önem | Durum |
|---|---|---|
| Q-6: c19 gerekçesi 8/44 ≈ %18 ve "fiyat tek başına zaten yeterli"; doğrusu 8/46 ≈ %17,4, gereken %16,7 (fark < 1 puan) | Düşük–orta (öğretilen yöntem yanlıştı, cevap doğruydu) | Düzeltildi, testli |
| Q-7: `pot-odds-adim-adim` yazısının quiz düğmesi SPR quiz'ini açıyordu (ilk `posts` girdisi çakışması) | Bilgi | Yeni quiz dizinin başına alınarak çözüldü, tarayıcıda doğrulandı |

Bulunmayan: Pages `basePath` altında kırık bağlantı, kontrast hatası.

## 3. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| Pot odds quiz'i | 8 soru, her sayı testte, out'lar evaluator ile, spotlarla aynı sayılar, cevap sıraları farklı | ✅ |
| Q-6 düzeltmesi | Sayı doğru, sınırda spot kuralına uygun, testli | ✅ |
| Quiz QA eksikleri | basePath ve kontrast | ✅ (gerçek ekran okuyucu ve yayındaki site denenmedi; kontrastta ikon/kenarlık ölçülmedi) |

Poker iddiaları yeniden okundu. Soru 2 ve 7'deki niteliksel ifadeler ("as gelince bazı ellere karşı öne geçmen", "sık pes eden rakip set tuttuğunda daha az ödeme yapar") ilk taslakta daha kesindi; yumuşatıldı. Implied odds için hiçbir yerde kesin sayı verilmedi. Out sayıları "temiz" varsayımına dayanıyor; bu varsayım sayfada yazılı.

## Ek: kullanıcı talimatı — en az spotlu konuya 50+ alıştırma

Kullanıcı 13. çalışmanın sonunda kalıcı bir talimat verdi: her çalışmada en az spotu olan konuya en az 50 alıştırma eklenecek. Talimat `HAFIZA.md`'nin başına yazıldı.

**Ölçüm (başlangıç):** `value` 3, `3bet` 5, `cbet` 5, `blof` 5, `savunma` 6, `spr` 6, `icm` 12, `odds` 75, `acilis` 122, `callshove` 122, `pushfold` 222. En az spotlu konu `value`.

**Çıktı:** 60 river value spotu (`v-<kahraman>-<board>`), 30 "bahis", 30 "check".

- **Senaryo:** BTN 2,5 BB açtı, BB call etti; flop ve turn check-check; river'da BB check etti. Pot 5,5 BB, seçenekler Check / Bahis 1,8 BB.
- **Varsayımlar (`note`'ta tek cümle):** BB'nin aralığı sitedeki buton açılış aralığı eksi AA, KK, QQ, AK (3-bet ederdi), önceki check'lerle daralmamış; bahse çift ve üstüyle call eder, çiftsiz ellerle fold eder; check-raise yok. Bu aralıklar solver çıktısı değildir.
- **Karar:** BB'nin her kombinasyonu tek tek sayılır. Bahsin check'e göre farkı: call eden elde B(2s − 1), fold eden elde P(1 − s). Board tek başına çiftsiz, kahramanın kendi kartıyla en az bir çifti var (fold eden çiftsiz eller kahramana kaybeder).
- **Sağlamlık:** Sıkı senaryoda (yalnızca üst çift, overpair ve üstü call) cevap aynı olmalı; iki senaryoda da fark kombinasyon başına en az 0,07 × bahis; sıkı senaryoda en az 20 call eden kombinasyon. Gerekçe iki senaryonun showdown payını da yazıyor.
- **Tekrarlanabilirlik:** üreteçte 5. bölüm, kendi tohumu (20261113). `npm run ranges` sonrası önceki 518 üretilmiş spot bayt bayt aynı.

**QA:** `hands.test.ts`'te üreteçten bağımsız yeniden hesap (aynı formül, ayrı kod): en az 50 spot, iki tarafta en az 15'er, her spotta pot 5,5, iki senaryoda işaret ve pay. Bir spotun cevabı ters çevrildiğinde test başarısız oldu (`v-Ac8h-2c5h4s8sQs geniş`). Tarayıcı (`next start`, 390/1366 px): `?el=v-KhQh-6h2cJh3h9c` açılıyor, not görünüyor, "Bahis" → "Doğru hamle"; "Value bet (63)" filtresi; taşma 0, konsol hatası 0. `npm test` **750/750**, typecheck ve build temiz.

**Sınırlar (doğrulanamadı):** BB'nin gerçek river call davranışı yalnızca el kategorisine bağlı değildir; check-raise ve önceki sokaklardaki aralık daralması modellenmedi; tek bahis boyutu. Check spotlarının bir kısmı (ör. düşük çift) kolay; zorluk dağılımı ayrıca ayarlanmadı.

## Kullanıcı kararı gerekenler

1. **Dal:** `claude/wizardly-meitner-56jps3` (bu dal) 9–13. çalışmaları içeriyor; yalnızca bunu birleştirmek yeterli. `iawfi2` ayrıca birleştirilmemeli (bu dalın içinde).
2. **B-1:** `acceptable` alanı (c39 ve sınırda spotlar).
3. **P-4:** `admiring-babbage-*` dalları.

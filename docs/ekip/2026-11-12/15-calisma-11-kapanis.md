# 11. çalışma: bubble'da push/fold (CS-3 devamı) ve ICM push yazısı

**Tarih:** 2026-11-12 · **Dal:** `claude/wizardly-meitner-h0lmvh` (10. çalışmanın dalı `syhmqe` üzerine kuruldu)

## Başlangıç durumu

- Varsayılan dal (`charming-davinci-emhvz1`, `8ffc135`) 1–8. çalışmaları ve "Cheers" markasını içeriyor. 9 (`g2abma`) ve 10 (`syhmqe`) birleştirilmemiş. En yeni hafıza `syhmqe`'deydi; dal onun üzerine kuruldu.
- B-1 kararı gelmedi. Kullanıcı verisi yok.
- Sağlık: `npm test` 654/654.

## CEO önceliklendirmesi

| # | İş | Hedef | Başarı kriteri | Roller |
|---|---|---|---|---|
| 1 | CS-3 devamı: bubble'da **push** tarafı | Call tarafındaki 3 spotun eşi olarak SB'den all-in/fold kararı | 2–3 spot; ödül yapısı ve BB call aralığı `note`'ta; ICM ile push EV ve fold EV; cevap eşiğe 3,5 puandan uzak; daha geniş call eden BB senaryosunda cevap değişmiyor ya da gerekçe söylüyor; regresyon testi; betik | Poker Uzmanı, QA |
| 2 | ICM push yazısı + quiz | Call ve push tarafını birleştiren, varsayımları açık bir yazı | Terimler ilk geçtiği yerde açıklanmış; sayılar spotlarla aynı; sınırlar ve sorumlu oyun notu; yüzde eki testi geçiyor; 5 soruluk quiz | Content, Poker Eğitim |
| 3 | Dal durumu | Kullanıcıyı bilgilendirmek | Hafızada ve bildirimde tek satırlık talimat | CEO |

Çalışmayan roller: **Data Analyst** (veri yok), **Davranış Bilimleri, UI/UX** (yeni mekanik ya da ekran yok), **Backend** (sunucu değişikliği yok), **Frontend** (mevcut bileşenler yeterli; yalnızca veri eklendi).

## 1. Push/fold modeli (Poker Uzmanı)

Betik: `docs/ekip/arac/icm-push.mts` (`node docs/ekip/arac/icm-push.mts`).

**Model ve varsayımlar**

- 4 oyuncu, ilk 3 ödül, ödüller %50 / %30 / %20 (varsayım). SB 0,5, BB 1, toplam ante 1 BB (ölü para; `replay` ile aynı).
- Herkes SB'ye kadar fold etti. SB fold ya da all-in; BB yalnızca call ya da fold.
- Push EV = (1 − c) × Ç + c × [eq × K + (1 − eq) × L] (beraberlik ayrıca sayılıyor). c, kahramanın kartları çıkarıldıktan sonra BB'nin call kombinasyonu / 1225 (kesin sayım).
- **BB'nin call aralığı:** SB'nin referans push aralığına (`ranges.json`, SB 10 BB ya da 15 BB) karşı BB'nin **kendi ICM eşiğini** geçen eller (169 el, her biri 20.000 deneme), gürültü temizlenip kısaltıldı. Duyarlılık için BB'nin ICM'i yok sayıp **chip eşiğine** göre call ettiği daha geniş aralık da hesaplandı.
- Solver çıktısı değildir. Tek el ICM; gelecek eller (FGS) yok.

**Sonuçlar** (400.000 deneme; ödül payı, havuzun yüzdesi)

| Spot | Stack'ler (CO/BTN/SB/BB) | El | BB call | Equity | Görülünce gereken | Fold | All-in | Cevap |
|---|---|---|---|---|---|---|---|---|
| ip01 | 40/27/**8**/25 | K6o | %34,7 (ICM) | %38,4 | %24,2 | 10,15 | 11,16 | All-in |
| ip01 geniş | | | %43,4 (chip) | %42,4 | %32,4 | 10,15 | 11,06 | All-in |
| ip02 | 4/34/**12**/50 | KJo | %31,2 (ICM) | %47,4 | %58,8 | 20,60 | 19,68 | Fold |
| ip02 geniş | | | %34,3 (chip) | %49,2 | %60,6 | 20,60 | 19,58 | Fold |
| ip03 | 18/17/**45**/20 | T9s | %2,0 (ICM, JJ+) | %20,4 | (her elle kârlı) | 34,75 | 35,58 | All-in |
| ip03 geniş | | | %25,3 (chip) | %41,1 | %36,6 | 34,75 | 34,94 | All-in |

- ip02, chip hesabıyla rahat all-in (görülünce gereken %23,9). Fark tamamen ICM'den: 4 BB'lik CO masadayken 12 BB'lik SB'nin elenme maliyeti.
- ip03'te BB'nin ICM eşiği %66,8 (chip eşiği %46,3). ICM baskısı push edenin lehine.
- **Kalite kontrolünde düzeltildi:** ip01 gerekçesinin ilk taslağı "ICM baskısı BB'yi sıkıştırır, fold equity bu yüzden değerli" diyordu. Ölçüm: BB'nin ICM eşiği %44,3, chip eşiği %41,2; fark yalnızca 3 puan. Kararı belirleyen ICM değil, potun stack'e oranı. Gerekçe ve blog düzeltildi, iddia testle korunuyor.
- Elenen adaylar: ip03 için Qh8h, Kh6h, Jh8h, Qh9h (geniş senaryoda fark < 3,5 puan, bazıları cevap değiştiriyor); 15/15 BB'lik bir senaryo (BB'nin ICM aralığı %5, chip aralığı %27; cevap senaryoya göre tersine dönüyor).

## 2. Spotlar ve testler (QA)

- `src/data/hands.ts`: `ip01`, `ip02`, `ip03` (`topic: "icm"`). `ip02` notunda "küçük raise seçeneği yok" yazıyor.
- `src/lib/poker/hands.test.ts`: 3 test. Fold/all-in ödül payları `replay` başlangıç stack'lerinden; BB call sıklığı kesin sayım; equity Monte Carlo (60.000). Kontroller: cevap, fark > 3,5 puan, geniş senaryoda cevap aynı, nottaki "%35 / %31 / %25" sıklıkları, ip01'de BB eşiği %43,5–45, ip03'te BB eşiği %66–67,5 ve "JJ geçer, TT geçmez".
- Tarayıcı (Playwright, 390 ve 1366 px): üç spot `/alistirma?el=ipXX` ile açıldı, "ICM ve bubble (12)" filtresi, yeni yazı ve blog listesi; yatay taşma yok, konsol hatası yok.
- Sağlık: `npm test` **660/660**, `npm run typecheck` temiz, `npm run build` temiz.

## 3. Blog yazısı (Content)

`bubble-push-fold-icm` — "Bubble'da all-in: fold equity, ICM ve kimin baskı altında olduğu" (9. yazı). Bölümler: terimler (bubble, ICM, fold equity), dört sayı + call olasılığı yöntemi, üç örnek (ip01–ip03), call ve push tarafını birlikte düşünmek, varsayımlar ve sınırlar, alıştırma masası ve sorumlu oyun notu.

## 4. Quiz: bubble'da push/fold (Poker Eğitim, 5 soru, seviye 2–3)

Sitede yayınlanmadı (quiz bileşeni yok); sayılar spotlarla aynı.

1. **SB'den all-in yaptığında iki kazanma yolu nedir?**
   *Cevap:* BB fold eder ve pot çekişmeden senindir (fold equity), ya da BB call eder ve elin kazanır.
2. **8 BB ile SB'desin, ortada 2,5 BB var, BB ellerin yaklaşık %35'iyle call ediyor. Görüldüğünde K6o'nun %38 equity'si yeterli mi?**
   *Cevap:* Evet. Görüldüğünde gereken yaklaşık %24 (ICM ile). Üç elden ikisinde pot çekişmeden geldiği için gereken equity düşer (`ip01`).
3. **Doğru mu yanlış mı: "Bubble'da kısa stack, ödüle girmek için her eli fold etmelidir."**
   *Cevap:* Yanlış. `ip01`'de all-in, fold'dan ödül havuzunun yaklaşık 1 puanı kadar fazla getirir.
4. **12 BB ile SB'desin, CO'da 4 BB'lik bir oyuncu var, BB 50 BB ile seni kapsıyor. KJo chip hesabıyla rahat all-in. ICM ile neden fold?**
   *Cevap:* CO elenirse ödüle girersin; BB'ye kaybedersen ödülsüz elenirsin. All-in'in kârlı olması için görüldüğünde yaklaşık %59 equity gerekir, KJo %47 taşır (`ip02`).
5. **45 BB'lik chip lideri olarak SB'desin; BB, CO ve BTN 17–20 BB. BB neden neredeyse hiç call edemez ve bu senin için ne demek?**
   *Cevap:* BB kaybederse ödülsüz 4. olur; kendi ICM hesabıyla call için yaklaşık %67 equity gerekir (yalnızca JJ+). Fold equity çok yüksek olduğu için T9s gibi bir el bile all-in yapabilir (`ip03`).

**Eksik konu:** final masası ödül sıçramaları (ör. 3 kişiden 2'ye) için ICM'li push/call spotu yok; satellite yalnızca blogda.

## 5. Kalite kontrolü (CEO)

| İş | Başarı kriteri | Durum |
|---|---|---|
| Push spotları | Varsayımlar notta, fark > 3,5 puan, geniş senaryo ölçülmüş, test, betik | ✅ |
| Blog | Terimler, sayılar spotlarla aynı, sınırlar, sorumlu oyun notu, testten geçiyor | ✅ |
| Quiz | 5 soru, cevap ve gerekçe | ✅ (sitede yayında değil) |
| ip01 gerekçesi | İlk taslakta abartılı ICM iddiası | ✅ Düzeltildi, testli |

Poker iddiaları yeniden okundu. Bütün sayılar ödül yapısı varsayımına, BB'nin varsayılan call aralığına ve tek el ICM'ine bağlı; bağımsız bir ICM aracıyla ya da solver ile karşılaştırılmadı (**doğrulanamadı**). ip03'ün geniş senaryodaki farkı küçük (yaklaşık 4,5 puan); gerekçe "az farkla" diyor.

## Kullanıcı kararı gerekenler

1. **Dal:** `claude/wizardly-meitner-h0lmvh` (bu dal) 9, 10 ve 11. çalışmaları içeriyor; yalnızca bunu birleştirmek yeterli.
2. **B-1:** `acceptable` alanı (c39 ve sınırda spotlar).
3. **P-4:** `admiring-babbage-*` dalları.

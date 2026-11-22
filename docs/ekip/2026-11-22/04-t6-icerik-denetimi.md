# t6 (All-in'e call) içeriğinin bağımsız denetimi (kapı K öncesi)

**10. CEO çalışması, 2026-11-22.** Roller: Poker Uzmanı, QA (bir alt ajan denetledi, CEO iki ana bulguyu dosyadan yeniden doğruladı).
**Denetlenen:** `origin/claude/wizardly-meitner-ch8abk` → `scripts/mufredat/icerik/t6.json` (106 alıştırma).
**Yöntem:** Projenin `evaluate7` değerlendiricisi ve `ranges.json`; `denetle.mts`'ten bağımsız bir üreteç ve tohumla Monte Carlo, değer başına 300.000 deneme (%95 güvenle ±0,18 puan). Gereken equity = call / (call sonrası toplam pot). Aralık yüzdeleri kombinasyon sayımıyla.

> Eğitim amaçlıdır. Sayılar chip cinsindendir, para değildir; hiçbir sonuç gerçek para oyununda kazanç garantisi değildir.

## Sonuç

- **68 soru** sayıyla ya da equity ölçümüyle yeniden hesaplandı (10'u betikle denetlenmeyen sorular): **hepsinde hata yok**. 27 aralığa karşı equity değerinin hepsi içerikten 1 puandan az sapıyor (en büyük sapma T9o +0,67).
- Hiçbir spot kararı gereken equity'ye 3,5 puandan yakın değil (en yakını 54s: %38,6, gereken %42,9).
- Kesinlik dili yalnızca yanlış seçeneklerde. Kaynaksız Nash ya da solver sayısı yok.
- **Bulgular:** 1 yüksek, 1 orta, 5 düşük.

## Bulgular

| # | Yer | Sorun | Önem |
|---|---|---|---|
| T6-1 | `t6-d5` a11 | "BTN'de CO'nun all-in'ine karşı … SB fold etti; arkanda yalnızca BB kaldı." Preflop sıra CO → BTN → SB → BB: BTN karar verirken SB henüz konuşmamıştır. Soru imkânsız bir durum kuruyor (CEO dosyadan doğruladı). Öneri: kahramanı SB'ye al ("CO all-in, BTN fold etti, arkanda yalnızca BB var"). | **Yüksek**: oyun kuralı hatası |
| T6-2 | `t6-d3` anlatım 3. paragraf | "Bağlantılı eller (JTs, 54s) geniş aralıkta çiftlerden … daha düşük equity taşır." Ünitenin kendi sayıları da çelişiyor: SB 10 BB aralığına karşı JTs %48,6, 22 %47,8 (CEO metni doğruladı). Yalnızca 54s için doğru. Öneri: "54s gibi küçük bağlantılı eller orta ve yüksek çiftlerden düşük equity taşır". | Orta |
| T6-3 | `t6-d6` anlatım 3. paragraf ve a11 | 88 çok dar aralığa (TT+, AK) karşı "eşiğe yaklaşır": ölçüm %31,4, eşik %39,3, yani 8 puan altında. "Eşiğin altına düşer" denmeli. | Düşük |
| T6-4 | `t6-d6` a10 | "Aralık bilinmiyorsa call kararının eşikten uzak olması gerekir" (doğru cevap). Chip EV'de en iyi tahmine göre eşiğin üstündeki call kârlıdır; güvenlik payı kural gibi sunulmuş. "Yakın kararda sonuç varsayıma bağlıdır" yeterli. | Düşük |
| T6-5 | `t6-t` a13 | "Nash push/fold tabloları ICM'i hesaba katmaz." Yalnızca chip EV tabloları için doğru; ICM'li Nash hesaplayıcıları var. "Chip EV Nash tabloları" denmeli. | Düşük |
| T6-6 | `t6-t` a11 gerekçesi | "Küçük bir 3-bet zaten stack'in büyük kısmıdır" (15–25 BB). 25 BB'de 5–6 BB'lik 3-bet stack'in ~%20–25'i; yalnızca alt uçta doğru. | Düşük |
| T6-7 | `t6-d5` a6 | Soru "Bu spotta" diyor ama spot tanımlı değil; "UTG: ilk konuşan" seçeneği shove'dan önce konuşmuş bir koltuk, geçersiz çeldirici. | Düşük |
| T6-8 | Ünite geneli | Kahramanın stack'i hiçbir soruda yazmıyor; call tutarları kahramanın rakibi kapsadığını varsayıyor. "Rakibi kapsıyorsun" notu eklenmeli. | Bilgi |

## Doğrulanamayanlar

- Çok oyunculu all-in senaryolarında arkadaki oyuncuların call aralıkları (model yok).
- `t6` spotlarının arayüzdeki kart gösterimi (tarayıcıda bakılmadı).
- t13 spotunun kartları (`drills.json` içinde bulunamadı; yalnızca 88 sınıfı ölçüldü).

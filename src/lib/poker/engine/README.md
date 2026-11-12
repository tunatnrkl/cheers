# El motoru

Bir spotu (`Hand`) karar anından alıp eli river'a ve showdown'a kadar oynatan saf TypeScript modülü. React, DOM ya da `Math.random` kullanmaz; tüm rastgelelik spot kimliğinden türetilen tohumla üretilir. Arayüz bu modülün yalnızca `index.ts` üzerinden dışa açılan API'sini kullanmalıdır.

> **Bu bir solver değildir.** Rakiplerin kararları ve ilk karardan sonraki değerlendirmeler sade kurallarla üretilen **tahminlerdir**. Arayüzde "tahmini değerlendirme" olarak gösterilmelidir.

## API

```ts
import { createHand, legalActions, applyHero, evaluate, summarize } from "@/lib/poker/engine";

createHand(hand: Hand): EngineState
legalActions(state: EngineState): LegalActions
applyHero(state: EngineState, action: HeroAksiyon): { state: EngineState; olaylar: Olay[] }
evaluate(state: EngineState, action: HeroAksiyon): Degerlendirme
summarize(state: EngineState): ElOzeti
optionKind(option: string): ActKind   // PokerTable.tsx'teki mantığın kopyası
toSpot(hand: Hand): Spot              // motorun kullandığı, rakip kartı içermeyen kopya
```

- **`createHand`**: `replay(hand)` çıktısından karar anındaki durumu kurar (stack'ler, sokaktaki bahisler, pot, board, sıra). Sıra hero'dadır. `hand.villain`, `note` ve `reasoning` alanları okunmaz.
- **`legalActions`**: sıra hero'da değilse ya da el bittiyse `{}` döner. Dönebilecek alanlar:
  - `check: true` ya da `fold: true` ile `call: <eklenecek chip>`
  - `bet` (önünde bahis yokken) ya da `raise` (bahis varken): `{ min, max, kısayollar }`. `min`/`max` sokakta **toplam** kaça çıkılacağıdır. Kısayollar: `1/3 pot`, `1/2 pot`, `3/4 pot`, `Pot`, `All-in`. Raise kısayolları "önce call, sonra oluşan potun x katı kadar artış" ile hesaplanır ve 0,5 BB'ye yuvarlanır.
- **`applyHero`**: hero'nun aksiyonunu uygular, ardından rakipler sırayla oynar; durum bir sonraki hero kararına ya da elin sonuna kadar ilerler. Girdi durumu değişmez; dönen durum `Object.freeze` ile dondurulmuştur. Yasal olmayan aksiyon Türkçe mesajlı `Error` fırlatır.
  - `HeroAksiyon`: `{tür:"fold"}`, `{tür:"check"}`, `{tür:"call"}`, `{tür:"bet"|"raise", miktar}` (sokakta toplam), `{tür:"allin"}`.
- **`evaluate`**: aksiyon uygulanmadan önceki durumda çağrılır (`applyHero` bunu kendisi yapıp `state.decisions` içine yazar).
- **`summarize`**: el sonu özeti (aşağıda).

## Durum makinesi

`kurulum → preflop → flop → turn → river → showdown → sonuç`. Saklanan durumda `asama` yalnızca sokaklardan biri ya da `"sonuç"` olur; kurulum ve showdown geçiş adımlarıdır.

Kurallar:
- Bahis yokken check/bet, bahis varken fold/call/raise. Minimum bahis 1 BB; minimum raise son tam artış kadardır.
- Stack'i yetmeyen all-in **eksik raise** ise aksiyonu yeniden açmaz: son tam artırmadan beri konuşmuş oyuncular yalnızca call ya da fold yapabilir. Art arda eksik all-in'ler toplamda tam artışa ulaşırsa aksiyon yeniden açılır.
- Stack call'a yetmiyorsa call kalan stack kadardır. Karşılanmayan bahis fazlası sokak sonunda sahibine iade edilir (`iade` olayı).
- Herkes konuştuğunda ve bahisler eşitlendiğinde sokak biter. Konuşabilecek tek oyuncu kalırsa (diğerleri all-in) kalan kartlar sırayla otomatik açılır.
- Yan potlar her oyuncunun el boyunca koyduğu toplamdan kurulur. Fold edenlerin parası ve ante ana pota girer; bölünen potta artan kuruş ilk kazanana gider.
- Heads-up (SB buton): preflop SB, flop sonrası BB önce konuşur. Ante ölü para olarak pota girer.
- **Hero fold ederse el hemen biter.** Tek rakip kaldıysa pot ona gider. Birden çok rakip kaldıysa el oynatılmaz, pot dağıtılmaz (`sonuç.potlar` boş). Hiçbir rakip kartı açılmaz.
- `state.toplamChip` el boyunca sabittir: `pot + Σ stack` (testle doğrulanır).

## Olaylar

Sıralı ve JSON'a çevrilebilir; arayüz animasyonu için `applyHero` dönüşündeki `olaylar` sırayla oynatılabilir (`state.olaylar` karar anından beri tüm olayları tutar). Miktarlar BB'dir; metin gösteriminde `replay.ts` içindeki `fmt` kullanılmalıdır (ondalık virgül).

| `tür` | Alanlar | Ne zaman |
|---|---|---|
| `aksiyon` | `koltuk, aksiyon, miktar` (sokakta toplam), `eklenen`, `stack` (sonrası), `pot` (sonrası) | Her oyuncu aksiyonu |
| `iade` | `koltuk, miktar, pot` | Karşılanmayan bahis fazlası geri döner |
| `sokak` | `sokak, kartlar` (yeni), `board` (tümü), `pot` | Flop, turn, river açılır |
| `showdown` | `board, eller: {koltuk, kartlar, elAdi}[]` | River sonrası elde birden çok oyuncu varsa. **Rakip kartları yalnızca burada görünür.** |
| `sonuç` | `neden` (`showdown` / `herkes-fold` / `hero-fold`), `pot`, `potlar` (ana + yan), `kazananlar`, `heroNet` | Her zaman son olay |

`aksiyon.aksiyon` değerleri: `fold, check, call, bet, raise, allin`. Stack'i bitiren call `call` olarak kalır (`replay.ts` ile aynı); olayda `stack: 0` görünür.

El adları Türkçe: yüksek kart, per, iki per, üçlü, kent, floş, full house, kare, kent floş, royal floş.

## Gizlilik

- Rakip elleri ve açılmamış board kartları `EngineState` içinde **hiçbir alanda durmaz**. `araliklar.ts` içindeki `gizliDagitim(spot)` bunları tohumdan yeniden türetir ve yalnızca bir `WeakMap` önbelleğinde tutar; `index.ts` bu fonksiyonu dışa açmaz.
- `JSON.stringify(state)` ve showdown olayından önceki olaylar rakip kartı içermez. Showdown'a gidilmezse rakip eli hiç açıklanmaz. `spotlar.test.ts` bunu tüm spotlarda, pasif ve karışık hatlarla denetler.
- Sınır: motor tarayıcıda çalışan açık koddur. Kodu okuyan biri tohumdan rakip elini hesaplayabilir; gizlilik, sayfa içeriğinde, erişilebilirlik etiketlerinde ve koç isteğinde elin görünmemesini sağlar, kriptografik bir saklama değildir.

## Determinizm

Tohum = `hashStr(spot.id)` (FNV-1a), PRNG = mulberry32. Rakip elleri ve kalan board yalnızca spota bağlıdır (hero'nun hattı board'u değiştirmez). Rakip kararlarının rastgele bileşeni `tohum | koltuk | aksiyon sayısı` etiketiyle ayrı bir akıştan gelir. Böylece **aynı spot + aynı hero aksiyon dizisi her zaman aynı rakip hattını, aynı board'u ve aynı olayları üretir.**

## Rakip motoru (`rakip.ts`, `araliklar.ts`)

### Rakip elinin seçimi
Her rakibin eli, spotun karar anına kadarki **açık aksiyon hattına** uyan bir aralıktan ağırlıklı olarak, tohumla seçilir; hero kartları, board ve diğer rakiplerin kartlarıyla çakışmaz.
- Açılış: `ranges.json` cash açılış aralığı (pozisyona göre); 20 BB ve altı all-in açılışta `push` aralıkları (stack'e göre 6/10/15 BB tablosu).
- Limp ya da açılışı görmeden call: sıralamanın %6–%60 dilimi. Açılışa call: BB'de %2–%50, diğer koltuklarda %2,5–%20 (en güçlüler azaltılmış ağırlıkla, çünkü onlar çoğunlukla 3-bet eder). 3-bet: ilk %5 + A2s–A5s yarım ağırlıkla; 4-bet ve üstü: ilk %3; all-in'e call: all-in boyutuna göre daralan üst dilim (%35'ten %6'ya). Sıralama `ranges.json`'daki en geniş itme listesi, ardından rastgele ele karşı equity'dir.
- Postflop: her aksiyon, elin o sokaktaki board'a göre güç yüzdeliği ve çekişlerine (floş, iki uçlu kent) göre ağırlıklandırılır. Bahis: güçlü el ağırlıklı, çekişler ve blöfler azaltılmış ağırlıkla; raise: daha kutuplu; call: orta güç ve çekişler; check: çok güçlü eller azaltılmış.

Aynı aralık modeli hero'nun değerlendirmesinde de kullanılır (rakibin **aralığına** karşı equity).

### Rakip kararları
- Preflop: önünde artırma yoksa açılış tablosuna göre aç ya da fold (bazen SB tamamlar); artırmaya karşı aralık equity'si ile pot odds karşılaştırması, güçlü ellerle 3-bet/4-bet, kısa stack'te all-in.
- Postflop: kendi elinin, karşısındaki oyuncunun aralığına karşı tohumlu Monte Carlo equity'si (120 deneme; river'da tam sayım), board dokusu (ıslak/kuru), SPR, çekişler. Güçlü elle value bahsi (ara sıra slow play), çekişle yarı blöf, flop'ta c-bet, river'da seyrek blöf; bahse karşı equity ≥ gereken equity ise call, çok güçlüyse raise. Çok oyunculu potta equity kabaca düşürülür.
- Kuralın ürettiği hamle yasal değilse en yakın yasal hamleye indirilir.

### Sınırlar
- **Solver değildir.** Denge stratejisi, karışık stratejiler, boyut seçimi ya da rakip tipi modellemesi yoktur. Aralıklar ve eşikler "makul varsayımlardır"; doğrulanmış strateji iddiası taşımaz.
- Preflop aralık daraltma kaba bantlarla yapılır; 4-bet ve sonrasında, limp'li ve çok oyunculu potlarda belirgin biçimde yaklaşıktır.
- Monte Carlo deneme sayısı (rakip 120–140, değerlendirme 300) hız için küçüktür; equity tahminlerinde birkaç puan sapma olabilir.
- Çok oyunculu potta equity, tek rakibe karşı equity'nin kuvvetiyle kabaca düşürülür; tam çok oyunculu hesap yapılmaz.

## Değerlendirme (`degerlendir.ts`)

`{ kademe: "en-iyi" | "kabul" | "hata", tahmini: boolean, gerekce: string }` (gerekçe Türkçe tek cümle).

- **İlk karar** (spotun karar anı): hero'nun serbest aksiyonu spot seçeneklerine eşlenir (`optionKind` + metindeki BB / pot kesri boyutu; en yakın boyut). Doğru seçenekse `en-iyi`; tür doğru ama boyut önerilenden %25'ten fazla farklıysa `kabul`; başka seçenekse `hata`. `tahmini: false`.
  - Seçeneklerde karşılığı olmayan hamle: preflop'ta spot yazarı bu hamleyi bilerek dışarıda bırakmıştır, `hata` (`tahmini: false`, önerilen seçenek gerekçede). Postflop'ta kural tabanlı tahmine düşülür (`tahmini: true`).
- **Sonraki kararlar**: her zaman `tahmini: true`. Rakibin aralığına karşı equity ile call için gereken equity karşılaştırılır; fark ±5 puan içindeyse `kabul`. Çekişte ve arkada chip varken call için sınır biraz gevşer. Bahis/raise için el gücü (equity), çekiş, board dokusu, SPR (derin stack'te all-in) ve çok oyunculu pot hesaba katılır. River'da son konuşan olarak güçlü elle check `hata` sayılır.
- Gerekçeler "yaklaşık", "görünüyor", "bu varsayımlarla", "savunulabilir" diye kurulur; kesinlik iddiası yoktur.

## El sonu özeti (`summarize`)

`{ kararlar, potSeyri, sonuc, showdown, sonucMetni, ders }`:
- `kararlar`: sokak sokak hero aksiyonu, miktarı, karardan önceki pot ve değerlendirme.
- `potSeyri`: karar anındaki pot, her yeni sokağın başındaki pot ve dağıtılan son pot (iade nedeniyle düşebilir).
- `sonucMetni`: tek cümle, ör. "Showdown: BTN iki per ile kazandı; senin elin per (net -36,7 BB)."
- `ders`: kısa ders cümlesi; en çok üzerinde durulacak kararı gösterir, sonucun karar kalitesini belirlemediğini hatırlatır ve tahmini değerlendirmeleri belirtir.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.ts` | Dışa açılan API |
| `types.ts` | Durum, olay, aksiyon türleri |
| `kurallar.ts` | Kurulum, yasal aksiyonlar, uygulama, sokak sonu, iade, yan pot, showdown |
| `araliklar.ts` | Açık hattan aralık modeli; gizli dağıtım (rakip elleri, kalan board) |
| `rakip.ts` | Rakip karar kuralları |
| `degerlendir.ts` | `evaluate`, `optionKind`, seçeneğe eşleme |
| `ozet.ts` | `summarize` |
| `kartlar.ts` | El adları, board güç tablosu, çekişler, doku, aralığa karşı equity |
| `rng.ts` | FNV-1a hash, mulberry32 |
| `*.test.ts` | Yasallık, tüm spotlar, determinizm, gizlilik, değerlendirme, özet |

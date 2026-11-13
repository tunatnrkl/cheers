# Boşluk raporu: sözlük ve spot ihtiyaçları

Müfredat içeriği yazılırken ortaya çıkan, sitede henüz bulunmayan terim ve spotlar. Bir ders `terimler` alanına yalnızca `src/data/glossary.ts` içinde birebir bulunan terimleri yazar; buradakiler sözlüğe eklenene kadar derslerde düz metin olarak açıklanır.

## Sözlüğe eklenenler (2026-11-13)

Önceki raporlardaki listeden 17 terim `src/data/glossary.ts`'e eklendi ve o1–o4 derslerinin `terimler` alanlarına bağlandı: Renk, El sıralaması, Sokak, Bölünen pot (temel); Yüksek kart, Per, Üçlü, Kent, Floş, Full house, Kare, Sıralı floş, Royal floş, Board'u oynamak (el); Agresif, Pasif, Range matrisi (strateji). Onay Ajanı düzeltmesiyle iki terim daha eklendi: Solver (strateji) ve Monte Carlo (matematik); c5-d2 ve c6-d2'de ilk geçtikleri yerde tanımlanır. "Bilgi avantajı" eklenmedi; "IP (pozisyonda)" tanımı bunu karşılıyor.

## Sözlüğe eklenecekler

| Terim | Önerilen tanım | Geçtiği ders |
|---|---|---|
| Equity realization (matematik) | Elin ham equity'sinin, bahisler olurken gerçekten kullanılabilen kısmı. Pozisyon ve el tipiyle değişir; kesin oranı kaynağa göre değişir. | c6-d3 |
| Yeniden raise (aksiyon) | Bir raise'in üstüne yapılan raise; preflop'ta açılışın üstündeki ilk yeniden raise 3-bet'tir. c5'te 3-bet tanımlanmadan önce bu sözle anlatıldı. İsteğe bağlı. | c5-d5, c5-d6 |

### Tanım düzeltme önerisi

**İnisiyatif** tanımı c-bet'e atıf yapıyor ("c-bet ile potu alma şansı verir"), c-bet ise c9'da öğretiliyor. o4-d4 inisiyatifi metinde kendi cümlesiyle açıkladı ve `terimler` alanına koymadı. Tanımın ilk cümlesi c-bet'siz yazılırsa (ör. "Son bahsi ya da raise'i yapan oyuncunun sonraki sokakta sahip olduğu üstünlük") o4-d4'e bağlanabilir. Sözlükteki mevcut tanımlara bu turda dokunulmadı.

Not: "Dealer butonu" sözlükte "BTN (Buton)" teriminin takma adı olarak zaten var; ayrı terim gerekmez.

## Spot ihtiyaçları

o1–o4'te spot tipi alıştırma yok. o3'te konuşma sırası ve pozisyon soruları metinle kuruldu; masa çizimi gösteren basit bir "koltuk" görseli (yalnızca buton ve koltuk adları, kart yok) Öğren ekranında bu soruları kolaylaştırabilir. o4'te range tipi yalnızca tanım soruları için kullanıldı (çiftler, suited aslar, suited connector'lar vb.); pozisyona göre açılış aralığı soruları c5 ve t3'e bırakıldı. Spot kullanılacak ilk yer c5 olmalı; rakip eli hiçbir koşulda verilmemeli.

### c5 ve c6

- c5 ve c6'da yeni spot üretilmedi; 19 alıştırma mevcut spotlara bağlandı (r-… açılış spotları, c04, c05, c34, c35, c36).
- Cash pistinde **blind savunması spotu azdır**: yalnızca 4 tane (c05, c34, c35, c36). Üçünün seçeneklerinde "3-bet" geçtiği için c6-d4'ten önce kullanılamadılar. c6-d2 (açanın pozisyonu) ve c6-d3 (realization) için seçeneklerinde 3-bet olmayan (Fold / Call) yeni savunma spotları faydalı olur. Önerilen örnekler: BB'de K4o, HJ'nin 2,5 BB açılışına karşı; BB'de T8s, UTG'nin açılışına karşı. Cevaplar `denetle.mts`'in `equityAraliga` ve `gerekenEquity` hesabıyla üretilmeli, aralığın kenarındaki eller alınmamalı.
- SB'de açılışa karşı 3-bet/fold spotları (c6-d4) da yok; c08 var ama gerekçesi blocker ve 3-bet blöfü kavramlarını kullanıyor (c7), bu yüzden bağlanmadı.

## t1 ve t2 (2026-11-13)

### Sözlüğe eklenenler (157 → 165)

Freezeout, Sit & go, MTT (çok masalı turnuva), BB ante, Ortalama stack, Kapsamak (cover), Ödül yapısı, Derin stack (hepsi "turnuva" kategorisinde). Hepsi t1–t2 anlatımında geçer ve ilgili dersin `terimler` alanına bağlandı (Kapsamak t2-d3, Derin stack t2-d1, Ortalama stack t2-d4, Ödül yapısı t1-d5).

### Tanım düzeltmesi (uygulandı)

**Rebuy / re-entry:** tanım iki kavramı ayıracak biçimde genişletildi (rebuy: turnuvadan çıkmadan chip almak; re-entry: elendikten sonra yeniden kayıt; ikisi de her turnuvada yok ve süreyle sınırlı). İlk cümle aynı kaldı.

### Tanım düzeltme önerileri (uygulanmadı)

- **ICM:** "Kaybedilen chip, kazanılandan daha değerlidir." cümlesi kesin dille yazılmış. t2-d5 bunu "çoğu zaman" ve "iki kişi kalınca ortadan kalkar" diye anlatıyor. Öneri: "Ödüller kademeli dağıtıldığında kaybedilen chip, kazanılandan çoğu zaman daha değerlidir." t2-d5 ICM terimine bağlanmadı (ICM t7'de).
- **Kısa stack** ("genelde 20 BB altı") ile müfredatın bölgeleri uyumlu; **Push/fold** ("kabaca 10–12 BB altı") t5'te kullanılacak.

### Spot ihtiyaçları

t1–t2'de spot kullanılmadı. Sitedeki turnuva spotları (t01–t26) push/fold, all-in'e call, bubble ve ICM kararlarıdır; seçenekleri ve gerekçeleri t3–t8 kavramlarını (push aralığı, ICM baskısı, implied odds) kullanır. Bu ünitelere uygun olacak spot türü "karar" değil "okuma" spotudur (ör. masadaki stack'leri BB'ye ve M'ye çevirmek, kimin kimi kapsadığını bulmak); bunlar için spot yerine sayı soruları yazıldı.

### Öğren ekranı: Türkçe binlik ayırıcı · Uygulandı (d81bfc5)

`src/lib/ogren/alistirma.ts` içindeki `sayiCoz` artık "20.000" girdisini 20.000 okuyor (nokta yalnızca ve gruplar üçer haneliyse binlik; virgül ondalık). `denetle.mts`'teki `sayiOku` da aynı kurala getirildi ve testle sabitlendi; açık not kalmadı. t1–t2'de 1.000 ve üstü chip cevapları seçmeli yazılmıştı; bu hâliyle kalıyor.

## t3 ve t4 (2026-11-13)

### Sözlük

Yeni terim eklenmedi; gereken bütün terimler sözlükte vardı. Turnuva pistinde c5/c6 olmadığı için equity, pot odds, blind savunması, solver ve Monte Carlo t3'te yeniden tanımlandı ve bağlandı.

### Tanım notları (uygulanmadı)

- **İnisiyatif** (c-bet'e atıf) t4-d2'de de bağlanmadı; önceki öneri geçerli.
- **Steal (blind çalma)** ve **Resteal** tanımları t3-d4 ve t4-d3 anlatımıyla uyumlu.

### Spot ihtiyaçları

- t3–t4'te 10 spot bağlantısı kullanıldı (t11, t12, t13, t14, t20, t24, t25, t26). Turnuvada **herkes fold ettiğinde açılış** spotu yalnızca iki tane (t12 boyut, t24 çalma); r-… açılış spotları cash ve 100 BB olduğu için turnuva pistine bağlanmadı. Derin stack'te pozisyona göre açılış (ör. UTG'de AQo, HJ'de KQo, CO'da A9o; seçenekler "Fold / 2,2 BB aç", BB ante 1 BB) için turnuva spotları faydalı olur.
- **Turnuvaya özgü açılış aralığı yok:** ranges.json yalnızca cash açılış ve push (6/10/15 BB) aralıkları içeriyor. Ante'li ve 20–40 BB için ayrı aralıklar üretilirse t3-d2 ve t4-d1 sayısal hâle getirilebilir.
- **Resteal / 3-bet all-in spotları:** yalnızca t11 var. 20–25 BB'de BB'den ve CO'dan resteal spotları (rakip açılış aralığı yazılı, rakip eli yok) t4-d3 için faydalı olur.

## c7 ve c8 (2026-11-13)

### Sözlüğe eklenenler (165 → 167)

- **5-bet** (aksiyon): "4-bet'in üzerine yapılan yeniden artırma. 100 BB'lik stack'lerle çoğunlukla all-in olur ve dar bir aralıkla yapılır." c7-d6'ya bağlandı.
- **Kirli out** (matematik; takma adlar "kirli outs", "dirty outs"): elini tamamlayan ama rakibe daha iyi bir el verebilecek kart. c8-d2'ye bağlandı.

"Iso-raise" sözlükte zaten "İzolasyon" teriminin takma adıydı; ayrı terim eklenmedi. "Overcard", "value 3-bet", "blöf 3-bet" ve "temiz out" metinde açıklandı, sözlüğe eklenmedi.

### Tanım notları (uygulanmadı)

- **2 ve 4 kuralı** tanımı koşulsuz "flop'ta out × 4" diyordu. **Uygulandı (Onay Ajanı):** tanım artık "turn ve river'ı ödeme yapmadan göreceksen (ör. flop'ta all-in) out × 4, yalnızca bir sonraki kartı göreceksen out × 2" diyor; c8-d3 ile uyumlu.
- **Lineer aralık** tanımındaki "(blöf içermez)" c7-d2 ile uyumlu.

### Spot ihtiyaçları

- c7'de 11 spot bağlantısı (c05, c07, c08, c09, c10, c11, c12); c8'de 12 (c07, c13, c17, c18, c24, c38 ve altı o-… spotu). Cash pistinde **squeeze** (c12), **4-bet** (c09) ve **iso-raise** (c11) için birer spot var. 4-bet blöfü, 5-bet all-in'e karşı karar, IP squeeze ve 3-bet'e pozisyonda call (ör. BTN'de 99, CO'nun 3-bet'ine karşı) spotları faydalı olur.
- c8 için **flop'ta çekişle karar** spotu az (c17, c26); o-… spotlarının hepsi turn all-in'i. Flop'ta yarım pot bahse karşı OESD/gutshot spotları (rakip aralığı notta, rakip eli yok) c8-d3/d4'ü güçlendirir.
- `c19` gerekçesindeki "8 / 44" → 8 / 46 (%17,4): **düzeltildi (31593ed).**
- `c11` gerekçesi iso-raise boyutunu "normal açılışa limp başına yaklaşık 1 BB" diye anlatıyor (2,5 + 1 = 3,5), spotun boyutu 4 BB. c7-d8 "yaklaşık 3 BB + limp başına 1 BB" diye anlatır (= 4 BB). **Düzeltildi (31593ed):** c11 gerekçesi c7-d8'deki kuralla aynı.

## c9 ve c10 (2026-11-13)

### Sözlüğe eklenenler (167 → 171)

- **Board dokusu** (el; takma ad "board texture"): flop kartlarının birbiriyle ilişkisi; kuru, ıslak, çiftli ve monoton diye sınıflanır. c9-d1'e bağlandı.
- **Gökkuşağı board** (el; "rainbow"): üç farklı renk; flop'ta floş çekişi yok. c9-d1'e bağlandı (kuru board tanımının parçası).
- **Agresör** (aksiyon; "aggressor"): bir sokakta son bet ya da raise'i yapan oyuncu. c9-d3 (c-bet) ve c10-d5'e (donk bet tanımı) bağlandı.
- **Saf blöf** (strateji; "pure bluff"): görülürse neredeyse hiç kazanamayan, gelişme şansı da çok az olan elle blöf. c10-d3'e bağlandı. "Yarı blöf" zaten "Semi-blöf" teriminin takma adıydı.

### Tanım düzeltmesi (uygulandı)

- **Showdown değeri:** "Bahse gerek kalmadan, açılışta kazanabilecek kadar güçlü…" cümlesindeki "açılış" preflop açılışıyla karışıyordu. Yeni tanım: "Bahis yapmadan showdown'a gidildiğinde kazanabilecek kadar güçlü, ama büyük bir pot oynamak istemeyeceğin orta güçte el." c10-d3 ve c10-d6'ya bağlandı.

### Tanım notları (uygulanmadı)

- **İnisiyatif** c-bet'e atıf yapıyor; c9-d3'te c-bet önce tanımlandığı için bağlandı. o4-d4 için önceki öneri geçerli.
- **Kuru board / Islak board** sözlük tanımları gevşek ("çekiş ihtimali az", "kent ve floş çekişlerine açık"); c9-d1'deki kesin tanımlarla çelişmiyor (örnekler aynı: K-7-2 farklı renk, J-T-8 iki aynı renk). Müfredatın tanımı daha dar; iki ailenin arasında kalan board'lar derste ayrıca anlatılıyor.
- **MDF** sözlükte var; c9–c10'da anılmadı (iskelette c12-d3).
- **Equity realization** hâlâ sözlükte yok (c6-d3 önerisi); c9-d6 "equity'sinin daha azını kullanabilir (c6-d3)" diye anlattı.

### Spot ihtiyaçları

- c9'da 10, c10'da 10 spot bağlantısı (c15, c16, c17, c20, c23, c24, c26, c28, c29, c30, c32). Cash pistinde flop c-bet spotu 4 tane (c15, c16, c23 dışında c29; c23 savunma). **Islak board'da value c-bet boyutu** (ör. BTN'de set ya da iki per, J♥ T♥ 8♣; seçenekler "Check / 1/3 pot / 2/3 pot") ve **c-bet'e karşı orta per ile call / fold** spotları c9-d4 ve c9-d5'i güçlendirir.
- **Donk bet** için hiç spot yok. UTG'ye karşı BB'de küçük bağlantılı board (ör. 6♥ 5♥ 4♣, elde iki per) spotu c10-d5'e uygun olur; doğru cevabın karışık olacağı açık, `kabulEdilebilir` ile kurulmalı.
- **River value boyutu** için c20 ve c22 var; ikisi de check / orta / büyük seçenekli. Küçük ve büyük value boyutunu karşılaştıran bir spot (rakip aralığı notta) c10-d2'ye uyar.

### Spot gerekçelerinde fark edilenler · Düzeltildi (Onay Ajanı metinleriyle; yalnızca `reasoning`)

- **c20:** kesin dil ("blöf yapılmaz") ve "kent çekişi de az" ifadesi düzeltildi; river'daki 6'nın 75 ve 53'ü kent yaptığı yazıldı.
- **c23:** "Slow play kuru board'lar içindir" → "daha çok kuru board'larda düşünülür; bu kadar ıslak bir board'da bedava kart vermek çoğunlukla pahalıya patlar".
- **c26:** %54'ün iki kartı görme varsayımına dayandığı ve set'e karşı geride olunduğu yazıldı.
- **c28:** "chip yakmaktır" → "çoğunlukla chip kaybettirir".
- **c32:** "7 yüksek" → "elin yalnızca board'daki 2'li per'le oynar (en iyi beşli 2-2-K-8-7)".
- **B-1 tutarlılığı:** c7-d6/a11, c7-r/a7 (c09) ve c8-d6/a11 (c24) artık `kabulEdilebilir` [Call] ve `dogrulamaGerekli: true`; c9–c10'daki c23, c24, c26 ile tutarlı.

### Sözlük düzeltmeleri (Onay Ajanı)

- **Calling station:** "Blöf yapılmaz; bol value bet yapılır." → "Ona karşı blöf nadiren işe yarar; value bet'ler daha çok kazandırır."
- **Slow play:** "işe yarar" → "daha çok düşünülür".
- **Kuru board:** sona "Müfredattaki tanım: çift yok, üç farklı renk, kent çekişi yok." eklendi.

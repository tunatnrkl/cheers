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

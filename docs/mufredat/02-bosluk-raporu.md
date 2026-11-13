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

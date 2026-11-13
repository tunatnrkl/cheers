# Boşluk raporu: sözlük ve spot ihtiyaçları

Müfredat içeriği yazılırken ortaya çıkan, sitede henüz bulunmayan terim ve spotlar. Bir ders `terimler` alanına yalnızca `src/data/glossary.ts` içinde birebir bulunan terimleri yazar; buradakiler sözlüğe eklenene kadar derslerde düz metin olarak açıklanır.

## Sözlüğe eklenecekler

o1 ve o2 (hiç poker bilmeyen için temel) sırasında gereken, sözlükte karşılığı olmayan terimler. Önerilen kategori parantez içinde.

| Terim | Önerilen tanım | Geçtiği ders |
|---|---|---|
| Renk (takım) (temel) | Kartın maça, kupa, karo ya da sinek oluşu. Renkler arasında üstünlük yoktur. | o1-d1 |
| Yüksek kart (el) | Beş kart arasında eşleşme olmayan el; gücünü en yüksek kart belirler. | o1-d2 |
| Per (el) | Aynı değerden iki kart. ("Cep çifti" yalnızca elindeki iki kartın çift olması için kullanılıyor.) | o1-d2 |
| Üçlü (el) | Aynı değerden üç kart. Sözlükteki "Set" ve "Trips" üçlünün nasıl yapıldığına göre iki alt türdür; genel ad eksik. | o1-d2 |
| Kent (el) | Değerleri art arda gelen beş kart; renk önemsiz. A-2-3-4-5 en düşük, T-J-Q-K-A en yüksek kenttir. | o1-d3 |
| Floş (el) | Aynı renkten beş kart. | o1-d3 |
| Full house (el) | Bir üçlü ile bir çift. | o1-d3 |
| Kare (el) | Aynı değerden dört kart. | o1-d3 |
| Sıralı floş (el) | Aynı renkten art arda beş kart. | o1-d3 |
| Royal floş (el) | Aynı renkten T-J-Q-K-A; oyunun en güçlü eli. | o1-d3 |
| El sıralaması (temel) | Yüksek karttan royal floşa on el çeşidinin güç sırası. | o1-d2, o1-d3 |
| Sokak (street) (temel) | Bir bahis turu: preflop, flop, turn ya da river. | o2-d3 |
| Beraberlik / bölünen pot (split pot) (temel) | En iyi beş kartı eşit olan oyuncuların potu eşit paylaşması. | o2-d4 |
| Board'u oynamak (el) | En iyi beş kartın tamamen board'dan oluşması. | o1-d4 |

### o3 ve o4 sırasında eklenenler

| Terim | Önerilen tanım | Geçtiği ders |
|---|---|---|
| Agresif / pasif (strateji) | Agresif: çoğunlukla bet ve raise ile oynamak. Pasif: çoğunlukla check ve call ile oynamak. Sözlükte TAG ve LAG var ama bu iki temel sıfat yok. | o4-d4 |
| Range matrisi (strateji) | 169 el adının 13×13 tabloya yerleşimi: köşegende çiftler, üstte suited, altta offsuit eller. | o4-d2 |
| Bilgi avantajı (pozisyon) | Rakibin kararını gördükten sonra konuşmanın sağladığı üstünlük. "IP" tanımında geçiyor; ayrı terim gerekmeyebilir. | o3-d3 |

Sözlük tanımı düzeltme önerisi: **İnisiyatif** tanımı c-bet'e atıf yapıyor ("c-bet ile potu alma şansı verir"), c-bet ise c9'da öğretiliyor. o4-d4 inisiyatifi metinde kendi cümlesiyle açıkladı ve bu yüzden `terimler` alanına koymadı. Tanımın ilk cümlesi c-bet'siz yazılırsa (ör. "Son bahsi ya da raise'i yapan oyuncunun sonraki sokakta sahip olduğu üstünlük") o4-d4'e bağlanabilir.

Not: "Dealer butonu" sözlükte "BTN (Buton)" teriminin takma adı olarak zaten var; ayrı terim gerekmez.

## Spot ihtiyaçları

o1–o4'te spot tipi alıştırma yok. o3'te konuşma sırası ve pozisyon soruları metinle kuruldu; masa çizimi gösteren basit bir "koltuk" görseli (yalnızca buton ve koltuk adları, kart yok) Öğren ekranında bu soruları kolaylaştırabilir. o4'te range tipi yalnızca tanım soruları için kullanıldı (çiftler, suited aslar, suited connector'lar vb.); pozisyona göre açılış aralığı soruları c5 ve t3'e bırakıldı. Spot kullanılacak ilk yer c5 olmalı; rakip eli hiçbir koşulda verilmemeli.

# Kaynak ve güven raporu

Bu rapor, dolu derslerdeki iddiaların hangisinin oyun kuralı, hangisinin öğretim amaçlı basitleştirme olduğunu ve emin olunmayan noktaları listeler. `dogrulamaGerekli: true` olan alıştırma varsa burada gerekçesiyle yazılır.

## o1 · Kartlar ve eller, o2 · Masa ve el akışı

Bu iki ünitedeki bütün alıştırmalar `dogrulamaGerekli: false`. İçerik Texas Hold'em'in standart kurallarına dayanır; uydurma sayı, istatistik ya da kaynak yoktur.

### Kesin kural (oyun kuralı, "her zaman / asla" dili yalnızca bunlar için kullanıldı)

- 52 kartlık deste, joker yok; 4 renk × 13 değer.
- El sıralaması: yüksek kart < per < iki per < üçlü < kent < floş < full house < kare < sıralı floş < royal floş.
- As hem en yüksek kart hem A-2-3-4-5 kentinin en alt kartı; kent astan dönmez (Q-K-A-2-3 kent değil).
- Renkler arasında üstünlük yok; eşitlik renkle bozulmaz.
- En iyi el 7 karttan seçilen 5 karttır; 0, 1 ya da 2 kapalı kart kullanılabilir. Altıncı ve yedinci kart eşitliği bozmaz.
- Kicker kuralları; full house'ta önce üçlü, iki perde önce yüksek çift karşılaştırılır.
- Beraberlikte pot eşit bölünür.
- SB butonun solunda, BB SB'nin solunda; buton her elden sonra bir koltuk sola kayar.
- Preflop ilk konuşan BB'nin solundaki oyuncu, en son BB; postflop ilk konuşan butonun solunda elde kalan ilk oyuncu, en son (eldeyse) buton.
- Flop 3, turn 1, river 1 kart. Bahis yoksa check/bet, bahis varsa fold/call/raise. Preflop'ta raise gelmediyse BB check diyebilir. Check-raise kurallara uygundur.
- Pota konan chip fold edilince geri alınmaz; call edilecek miktar = görülecek bahis − o turda zaten konan.

### Öğretim amaçlı basitleştirmeler (bilinçli)

- **Küçük blind = büyük blind'in yarısı.** Anlatımda "genellikle" diye yazıldı. Bazı oyunlarda oran farklıdır (ör. 1/3 blind'li masalar).
- **Ante yok.** o2'deki pot örnekleri ante'siz. Ante turnuva pistinde (t1-d4) ayrıca öğretilir.
- **Heads-up blind düzeni anlatılmadı.** İki kişilik oyunda buton küçük blind'i koyar ve preflop'ta ilk konuşur; postflop'ta son konuşur. Bu istisna o2'de bilinçli olarak dışarıda bırakıldı (t10-d1 "Heads-up" dersinde ele alınacak). o2 soruları hep üç ve daha fazla oyunculu masadan söz eder.
- **Showdown'da kart açma.** "Kalan oyuncular kartlarını açar" denildi. Gerçekte açma sırası (son agresör önce vb.) ve kaybeden oyuncunun kartlarını göstermeden bırakabilmesi (muck) kurala ve mekâna göre değişir; yeni başlayan için ayrıntıya girilmedi.
- **En küçük raise miktarı (min-raise kuralı), all-in ve yan pot** anlatılmadı. Sorulardaki bütün raise'ler kurallara uygun büyüklükte seçildi (ör. 3'e karşı 9, 4'e karşı 12, 5'e karşı 15; 2,5 BB açılışa 9 BB yeniden raise).
- **Bölünemeyen tek chip** konusu yok; beraberlik soruları tam bölünen potlarla (12, 9, 15 BB → 7,5 BB) kuruldu.
- **"Blind'ler neden zorunlu"** sorusunun gerekçesi (oynanacak bir pot olsun, herkes yalnızca güçlü eli beklemesin) kural değil, yaygın kabul gören açıklamadır.

### Emin olunmayan noktalar

- Yok. Tek tartışmalı ifade "nuts": bazı oyuncular "as yüksek floş"u (A♥ ile herhangi bir kupa) "nut floş" diye genel adlandırır. Müfredat sıkı tanımı kullanır (board'da mümkün olan EN iyi beşli); bu yüzden o1-d5/a6'da doğru seçenek A♥ K♥ yapıldı ve betik nuts'ı tüm 1.081 iki kartlık eli tarayarak bulur.

### Doğrulama

- 111 alıştırma (169'un %66'sı) `scripts/mufredat/denetle.mts` ile bağımsız olarak yeniden hesaplanır: el çeşidi, kazanan, en iyi beşli, kullanılan kapalı kart sayısı, nuts, el sıralaması ve bütün pot/sayı aritmetiği. Betik ayrıca aynı kartın bir soruda iki kez geçmesini, denetimdeki kartın soru metninde görünmemesini ve birden fazla cevabı olan "kaç kapalı kart" sorularını reddeder. `npm test` içinde `src/lib/mufredat/denetle.test.ts` olarak çalışır.
- Kalan 58 alıştırma kural ve terim sorusudur (ör. "Önünde bahis yokken call edebilir misin?"). Makinece hesaplanamaz; yukarıdaki kural listesiyle tek tek elden karşılaştırıldı.

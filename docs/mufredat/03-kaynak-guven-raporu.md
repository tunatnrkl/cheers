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

### Doğrulama (o1–o2)

- 111 alıştırma (169'un %66'sı) `scripts/mufredat/denetle.mts` ile denetlenir. El çeşidi, kazanan, en iyi beşli, kullanılan kapalı kart sayısı, nuts ve el sıralaması `evaluator.ts` ile bağımsız olarak yeniden hesaplanır; betik bu sorulardaki kartların soru metninde göründüğünü de denetler.
- Pot ve sayı sorularında toplanacak terimler (`denetim.terimler`) elle girilir; betik toplamayı, çarpmayı ya da bölmeyi doğrular. Senaryonun (kim ne kadar koydu, kim fold etti) terimlere doğru çevrildiği betikle değil, elle kontrol edildi.
- `ornek: true` taşıyan dört doğru/yanlış sorusu (o1-d2/a5, o1-d3/a3, o1-k/a2, o2-t/a6) genel bir kuralı soruyor (ör. "Üçlü, iki peri yener"); betik kuralı yalnızca tek bir temsilî örnekle sınar, kuralın genelliğini kanıtlamaz. Betik ayrıca aynı kartın bir soruda iki kez geçmesini, denetimdeki kartın soru metninde görünmemesini ve birden fazla cevabı olan "kaç kapalı kart" sorularını reddeder. `npm test` içinde `src/lib/mufredat/denetle.test.ts` olarak çalışır.
- Kalan 58 alıştırma kural ve terim sorusudur (ör. "Önünde bahis yokken call edebilir misin?"). Makinece hesaplanamaz; yukarıdaki kural listesiyle tek tek elden karşılaştırıldı.

## o3 · Pozisyon, o4 · Başlangıç elleri

Bütün alıştırmalar `dogrulamaGerekli: false`. Uydurma sayı, equity yüzdesi, solver sonucu ya da açılış aralığı yoktur.

### Kesin kural ya da tanım

- 6-max koltuk adları butondan sola: BTN, SB, BB, UTG, HJ, CO. Preflop sırası UTG, HJ, CO, BTN, SB, BB; postflop sırası SB, BB, UTG, HJ, CO, BTN (elde kalanlar arasında). Buton her elde bir koltuk sola kayar; yerinden kalkmayan oyuncunun koltuk adı BB → SB → BTN → CO → HJ → UTG → BB diye döner.
- IP / OOP: postflop'ta rakipten sonra / önce konuşmak. Pozisyon iki oyuncu arasındaki ilişkidir.
- Herkes check derse bahis turu biter ve sonraki kart açılır (bedava kart).
- Stack (BB) = stack (chip) / büyük blind. Efektif stack = iki stack'ten küçüğü; bir oyuncu önündekinden fazlasını riske atamaz.
- El yazımı (AKs, AKo, 77), kombinasyon sayıları (çift 6, suited 4, offsuit 12), 1326 iki kartlık el, 169 el adı (13 + 78 + 78).
- Matris yerleşimi: köşegende çiftler, üstte suited, altta offsuit; satır/sütun A'dan 2'ye. Bu, sitenin matris bileşeniyle (`src/lib/poker/cards.ts`, `matrixLabel`) aynıdır ve betik bunu her matris sorusunda karşılaştırır.
- Aralık yüzdesi = kombinasyonlar / 1326 × 100.
- Domine etmek: bir kartı paylaşan iki elden ikinci kartı yüksek olanın durumu (sözlükteki "Dominasyon" tanımıyla aynı).
- Limp: preflop'ta raise yapmadan büyük blind kadar koyarak girmek; kurallara uygundur.

### Genel kabul görmüş strateji ilkeleri (yumuşatılmış dille)

- Son konuşmanın bilgi ve pot kontrolü avantajı; "aynı el pozisyonda genellikle daha kolay oynanır". Avantajın garanti olmadığı açıkça yazıldı.
- Erken pozisyonda daha az ve daha güçlü elle oynamak; geç pozisyonda genişlemek. Yalnızca yön verildi; hangi ellerin oynanacağı c5 ve t3'e bırakıldı. "Arkada oyuncu arttıkça içlerinden birinin güçlü el tutma ihtimali artar" sezgisel bir olasılık gerçeğidir; sayı verilmedi.
- Domine edilen elin "çoğu zaman" geride olması. Equity yüzdesi verilmedi (equity c6-d1'de tanımlanır); karşı örnek olarak domine edilen elin kazandığı ve elin bölündüğü board'lar da soruldu.
- TAG'in "sağlam bir başlangıç ilkesi" olması; raise'in iki kazanma yolu (fold ettirmek ya da en iyi eli göstermek). "Her masada aynen" uygulanacağı yanlış seçenek olarak kullanıldı.
- İlk giren oyuncu için limp'in "çoğunlukla zayıf" olması; istisnaların varlığı (ör. SB'den bilinçli limp) belirtildi, "her zaman yanlış" yanlış seçenek olarak kullanıldı.

### Bilinçli basitleştirmeler

- **Ante yok.** "Blind'de değilken fold etmek bedavadır" ifadesi "ante olmayan bir masada" koşuluyla yazıldı (turnuvada BB ante vardır).
- **6-max adları.** HJ bazı kaynaklarda MP diye geçer (sözlükte takma ad olarak var); full ring'de UTG ile HJ arasına giren koltukların adları (UTG+1, MP vb.) bilinçli olarak verilmedi.
- **Connector ve as.** A2'nin connector sayılıp sayılmadığı kaynaktan kaynağa değişir; ilgili range sorusunda "as yalnızca yüksek kart sayılır" diye açıkça yazıldı.
- **Heads-up** istisnası o3'te de dışarıda (t10-d1).

### Emin olunmayan noktalar

- Yok.

### Doğrulama (o3–o4)

- 101 alıştırma (170'in %59'u) `denetle.mts` ile denetlenir. Neyin bağımsız hesaplandığı türe göre değişir:
  - **Başlangıç elleri:** kombinasyon ve yüzdeler, betiğin 52 kartlık destenin 1326 iki kartlık elini tek tek sayıp el adlarına ayırmasıyla hesaplanır; 6/4/12 formülü ya da sözlük kullanılmaz. Yüzde cevapları gerçek değerden en fazla 0,05 sapabilir. El yazımı iki karttan yeniden kurulur. Matris hücresi betiğin kuralıyla ve sitenin `matrixLabel` işleviyle ayrı ayrı karşılaştırılır.
  - **Range soruları:** sorudaki tarif ("bütün suited aslar") denetimde bir kurala çevrilir; betik işaretlenmesi gereken elleri 169 el adından üretir ve veriyle karşılaştırır. Tarifin kurala doğru çevrildiği elle kontrol edildi.
  - **Konuşma sırası ve koltuk:** betikteki 6-max modeli yukarıdaki kural listesinin elle yazılmış hâlidir; betik cevapların bu modelle tutarlı olduğunu doğrular, modelin doğruluğunu değil.
  - **Efektif stack ve BB:** stack'ler ve blind elle girilir; betik küçük olanı seçer ve bölmeyi yapar.
  - **Kazanan ve pot:** o1–o2'deki gibi (el değerlendirici; elle girilen terimlerin toplamı).
- Kalan 69 alıştırma kavram ve strateji ilkesi sorusudur; yukarıdaki listeyle elle karşılaştırıldı.

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

## c5 · Açılış aralıkları, c6 · Blind savunması

Bu iki ünitede strateji iddiaları başlıyor. Kaynaklar: `src/data/ranges.json` (sitenin Range aracı da bunu okur), `docs/ekip/2026-11-11/06-blind-savunmasi-rehberi.md` ve `02-blind-savunmasi-paketi.md`. Rehberdeki ve quizdeki bütün aritmetik `denetle.mts` ile yeniden hesaplandı ve aynı çıktı.

### Kesin olan (kural ya da aritmetik)

- Pot toplamları, call için ödenecek ek miktar (blind'in düşülmesi), 3-bet'te eklenecek miktar.
- Gereken equity = ödenecek / (call öncesi pot + ödenecek): %27,3 (BTN 2,5 BB, BB), %22,2 (min-raise), %18,8 (açılış + call), %30,8 (3 BB açılış), %33,3 (SB'nin 2,5 BB açılışa ya da BB'nin SB'nin 3 BB açılışına call'u), %15 ve %14,3 (çok oyunculu), %20.
- Gerekli pay = gereken equity / ham equity. Bu yalnızca bir orandır.
- Aralık yüzdeleri, ranges.json'daki listelerin kombinasyonları sayılarak bulunur: UTG %15,2, HJ %19,3, CO %27,3, BTN %43,3, SB %38,2.
- 3-bet tanımı, SB'nin postflop'ta pozisyon dışında olması, BB'nin multiway potta iki rakibe karşı pozisyon dışında olması.

### Yaklaşık (kendi hesabımız; solver çıktısı değil)

- **Açılış aralıkları.** ranges.json'ın kendi notu: "Çalışma amaçlı yaklaşık aralıklardır; solver çıktısı değildir." Bu not c5-d2, d3, d4, d5'in anlatımında, c5-k girişinde ve c6'nın ilgili derslerinde tekrarlanır. Betik bir eli aralığın son ~%4'ünde (53 kombinasyon) ya da hemen dışında kalıyorsa veya karışık oynanan bir suited el ise "sınırda" sayar. Sınırdaki eller yalnızca `dogrulamaGerekli: true` (c5'te 7 alıştırma) ve çoğunda `kabulEdilebilir` ile soruldu. Ayrıca c5-d4/a5'te (c04, SB'de A5o) limp `kabulEdilebilir` ve `dogrulamaGerekli: true`: müfredat SB'de aç ya da fold varsayar, limp de bazı stratejilerde kullanılır. Betiğin bu okuması sitedeki 115 açılış spotunun cevabıyla birebir aynı (test).
- **Aralığa karşı equity.** Projenin el değerlendiricisiyle Monte Carlo, 40.000 deneme, sabit tohum. Metindeki "yaklaşık" değerler en fazla 1,5 puan sapabilir; rehberdeki değerlerle 0,6 puan içinde.
- **Açılış boyutu 2,5 BB ve SB'den 3 BB.** Bu bir varsayımdır ("uygulamada 2 ile 3 BB arası yaygındır" diye yazıldı); kural değildir.

### Genel kabul görmüş ilkeler (yumuşatılmış dille)

- Geç pozisyonda aralığın genişlemesi; SB'nin BTN'den biraz dar açması (pozisyon dışında).
- Sabit açılış boyutunun eli saklaması.
- Blind'ler sıkıysa kenarda daha geniş, sık yeniden raise geliyorsa daha dar açmak. Ayar yalnızca kenarı etkiler; AA ve 72o değişmez.
- Açan ne kadar erken pozisyondaysa BB savunmasının daralması (J4o örneği betikle hesaplanan equity'lerle).
- Equity realization: pozisyon dışında, offsuit ve kopuk ellerin daha az; suited ve bağlantılı ellerin daha çok gerçekleştirmesi. **Oran verilmedi.** 72o'nun BTN'ye karşı fold edilmesi "çoğu çalışma kaynağı fold önerir" diye yazıldı.
- SB'de açılışa karşı "çoğunlukla 3-bet ya da fold". Hangi ellerle yapılacağı c7'ye bırakıldı.
- Multiway potta suited/bağlantılı eller ve çiftlerin, offsuit ve domine olmaya yatkın ellerden daha iyi gelmesi. Kesin el listesi verilmedi.

### Bilinçli basitleştirmeler

- SB'de limp seçeneği yalnızca anıldı; öğretilmedi.
- 3-bet'e karşı oynamak, squeeze ve blokerler c7'ye bırakıldı. c08 spotu (SB A5s 3-bet) gerekçesi blocker kavramını kullandığı için bağlanmadı.
- Multiway potta equity sayısı verilmedi (betikte çok oyunculu equity hesabı yok).

### Emin olunmayan noktalar

- c34 spotunun (BB'de 72o, BTN 3 BB açtı → fold) kaynak quizinde bir uzman notu var: bazı solver çıktılarında BB, butonun 2,5 BB açılışına karşı çok geniş savunur. Spot bu yüzden 3 BB açılışla kurulmuştu (gereken %30,8 > ham equity ≈ %29,9). Müfredatta c6-r'de bu hâliyle kullanıldı; fiyat ve equity betikle doğrulandı. "Fold" cevabı ham equity'nin eşiğin altında kalmasına dayanır; realization tahminine dayanmaz.
- c6-d2/a10 ve c6-k'daki c35 spotu (UTG'ye karşı J4o → fold), equity'nin eşiğin ancak 1,7 puan üstünde olduğu bir karardır. Gerekçe: pozisyon dışında ve domine olmaya yatkın. Bu gerekçe realization'a dayanır; sitedeki c35 spotunun cevabıyla aynıdır. Kesin bir realization sayısıyla kanıtlanmadı; bu nedenle "genellikle tercih edilir" diye yazıldı.

### Doğrulama (c5–c6)

- 171 alıştırmadan 102'si `denetle.mts` ile denetlenir: c5 53, c6 49.
- **Bağımsız hesaplanan:** kombinasyon ve yüzde; gereken equity (pot ve ödenecek elle girilir, oran yeniden hesaplanır); aralığa karşı equity (Monte Carlo); kazanan.
- **ranges.json'a göre okunan:** açılış kararları. Betik, ranges.json'ın yöntem notundaki sıralama kuralını kenar payını ölçmek için yeniden kurar; aralıkların kendisini doğrulamaz.
- **Testle sabitlenen:** spot alıştırmalarının seçenek ve cevabının sitedeki spotla aynı olması.
- Kalan 69 alıştırma kavram ve ilke sorusudur; yukarıdaki listeyle elle karşılaştırıldı.


## t1 · Turnuva nedir, t2 · Stack'i ölçmek

Bütün alıştırmalar `dogrulamaGerekli: false`. Uydurma istatistik, solver sonucu ya da kaynak yoktur; ödül tabloları ve stack'ler açıkça "örnek" senaryodur. Para birimi, tutar, giriş bedeli yoktur; ödül yalnızca yüzde ve puan farkıyla anlatılır.

### Kesin kural, tanım ya da aritmetik

- Turnuvada chip'ler yalnızca o turnuvada geçer; chip'i biten oyuncu elenir; sıralama elenme sırasına göredir (ilk elenen son sırada); blind'ler seviyelerle yükselir.
- Freezeout (tek giriş), re-entry (elendikten sonra yeniden kayıt, başlangıç stack'iyle), rebuy (turnuvadan çıkmadan chip alma), sit & go (oyuncu sayısı dolunca başlar), MTT (birçok masada başlar, masalar birleşir, final masası). Başlama biçimi ile giriş kuralı bağımsızdır.
- Ante ölü paradır, bahse sayılmaz; klasik ante'de herkes öder, BB ante'de büyük blind'deki oyuncu masa için tek ante öder.
- Stack (BB) = chip / büyük blind (ante girmez). M = stack / (SB + BB + bir eldeki toplam ante); bir masa turunda her blind bir kez, ante (klasik ya da BB) toplamı bir el kadar ödenir. BB ante 1 BB'de M = BB / 2,5; ante'siz M = BB / 1,5.
- Efektif stack = küçük stack. Kapsamak: eşit ya da büyük stack. Çok oyunculu all-in'de en fazla kaybedilebilecek miktar = min(kendi stack'in, en büyük rakip stack'i); karşılanmayan kısım geri döner. Bu yüzden tek elde ancak seni kapsayan bir rakip varsa elenebilirsin.
- Ortalama stack = başlangıç stack'i × giriş sayısı / kalan oyuncu (re-entry'ler giriştir; rebuy chip'leri eklenir).
- Ödül payları toplamı %100; kademeli yapıda sıra büyüdükçe pay artmaz.

### Yaklaşık ya da varsayım ("genellikle", "çoğunlukla" diliyle)

- **BB ante 1 BB** müfredat varsayımıdır; anlatımda "bugün birçok turnuvada BB ante kullanılır", "miktarı çoğunlukla büyük blind kadar" diye yazıldı.
- **Ödül alan oranı:** "genellikle katılımcıların yaklaşık %10–20'si; turnuvaya göre değişir". Tek masalık turnuvalarda oranın genellikle daha yüksek olduğu (9 kişide 3 sıra = %33,3) örnekle gösterildi.
- **Stack bölgeleri** (derin ≥ 40, orta 20–40, kısa < 20 BB) çalışma için seçilmiş yaklaşık sınırlardır; t3–t5 ünite özetleri ve sözlükteki "Kısa stack" tanımıyla uyumlu.
- **M oranı** "Dan Harrington'ın turnuva kitaplarıyla yaygınlaşan bir ölçü"; "bugün birçok oyuncu ve kaynak stack'i doğrudan BB ile ölçer". Harrington'ın renkli M bölgeleri bilinçli olarak verilmedi.
- **Aşamalar** (erken / orta / geç) kesin sınırsız, yaygın bir ayrım olarak; "geç aşamada ortalama çoğu zaman birkaç düzine BB'ye iner" yön bildirir.
- **Seviye süresi** "birkaç dakikadan bir saate kadar"; yeniden giriş süresinin "çoğunlukla" geç kayıtla bittiği, rebuy süresinin ilk seviyelerle sınırlı olduğu.
- **Chip'in değeri (t2-d5):** ICM hesaplanmadan sezgiyle: kaybedilen chip "çoğu zaman" daha değerli; etki başta "genellikle" küçük, bubble ve final masasında büyük; iki kişi kalınca ortadan kalkar (iki kişide ödül payı chip payıyla doğrusal olduğu için bu kesin). Eşit ihtimalli chip-nötr riskin ödül payı açısından "genellikle" zararlı olduğu söylendi; kesin yüzde verilmedi.

### Bilinçli basitleştirmeler

- Aynı elde iki oyuncu birlikte elenince sıralama kuralı, ante'nin blind'den önce mi sonra mı alındığı, kısa stack'in ante ve blind'i tam ödeyemediği durumlar, add-on, anlaşmalar (deal), bounty ve satellite anlatılmadı.
- Masa dengeleme (oyuncuların masalar arasında taşınması) yalnızca "masalar birleştirilir" diye anlatıldı.
- Heads-up blind düzeni t10'a bırakıldı; t2-d5 yalnızca "iki kişi kaldığında" der.

### Emin olunmayan noktalar

- "Bugün birçok turnuvada BB ante kullanılır" ve "M yerine BB ölçüsü daha yaygın" ifadeleri genel gözleme dayanır; sayısal bir kaynakla doğrulanmadı, bu yüzden "birçok" ve "bugün yaygın" dışında iddia yok.
- "Re-entry ile yeniden giren oyuncu genellikle başlangıç stack'ini alır" (t1-d2/a7): bazı turnuvalar farklı stack verebilir; "genellikle" ile yazıldı.

### Doğrulama (t1–t2)

- 170 alıştırmadan 101'i `denetle.mts` ile denetlenir (t1 39, t2 62). Yeni denetim türleri: `antePot`, `mOrani`, `bbErime`, `ortalamaStack`, `odul`, `bolge`; her birinin bozuk cevabı yakaladığı `src/lib/mufredat/denetle.test.ts`'te gösterilir (BB ante'yi oyuncu sayısıyla çarpmak, klasik ante'yi tek saymak, M'de ante'yi unutmak, aşırı tolerans, toplamı 100 olmayan ya da artan ödül tablosu, ödül almayan sıra, tam 20 BB'nin bölgesi).
- Bu türlerin hepsinde girdiler (stack, blind, ante, giriş sayısı, paylar) senaryodan elle girilir: **betik işlemi doğrular, senaryonun sayılara çevrilmesi elle kontrol edildi.** Ante kuralı (BB ante tek, klasik ante oyuncu başına) ve bölge sınırları betikte sabittir; betik bu kurallara uyumu doğrular, kuralların doğruluğunu değil.
- Kalan 69 alıştırma kavram ve kural sorusudur; yukarıdaki listeyle elle karşılaştırıldı.

## t3 · Derin stack oyunu, t4 · Orta stack oyunu

Bütün alıştırmalar `dogrulamaGerekli: false`. Strateji iddiaları bu ünitelerde başlıyor; sayısal olanlar betikle, ilkeler "genellikle / çoğunlukla" diliyle yazıldı.

### Kesin olan (kural ya da aritmetik)

- Min-raise preflop'ta 2 BB; 3-bet / 4-bet sayımı; ante bahse sayılmaz.
- Ante'li pot ve call bedeli; gereken equity = ödenecek / (pot + ödenecek): ante'li 2,2 BB'ye karşı %20,3, ante'li min-raise'e karşı %18,2, ante'li 2,5 BB'ye karşı %23,1, ante'siz 2,5 BB'ye karşı %27,3; t13'te %39,3, t26'da %39,2.
- Başabaş fold oranı = risk / (risk + pot), call edildiğinde hiç kazanmama varsayımıyla: 2,2 BB çalma ante'li %46,8, ante'siz %59,5; 3 BB %54,5; 18 BB'lik SB resteal %78,8.
- SPR = kalan efektif stack / flop'taki pot (ör. 17,8 / 5,9 ≈ 3,0; 97,8 / 5,9 ≈ 16,6).
- Cep çiftiyle flop'ta set ya da daha iyisi: 2.304 / 19.600 ≈ %11,8 (betik sayar).

### Yaklaşık (kendi hesabımız)

- **Açılış aralıkları:** ranges.json'daki cash 6-max çalışma aralıkları (UTG %15,2, HJ %19,3, CO %27,3, BTN %43,3, SB %38,2); solver çıktısı değil. Turnuvaya aktarımı **varsayımdır**: "derin stack'te kabaca benzer; ante ile geç pozisyonda biraz genişletmek yaygın; 8–9 kişilik masada erken koltuklar daha sıkı". Yalnızca betiğin kesin "aç" ya da "fold" dediği eller soruldu.
- **Aralığa karşı equity:** Monte Carlo, 40.000 deneme, sabit tohum, ±1,5 puan (K4o 41,0 / 32,0; 96s 36,2; T8s 40,8; 88 resteal aralığına karşı 54,9).

### Genel kabul görmüş ilkeler (yumuşatılmış)

- Erken aşamada oyunun cash game'e benzemesi; spekülatif ellerin derin stack'te değer kazanıp orta stack'te kaybetmesi; yüksek kartlı ellerin orta stack'te öne çıkması (yön, el listesi yok).
- Turnuvada 2–2,3 BB açılışın yaygın olması ve küçük açılışın blind'lere iyi fiyat vermesi.
- BB'nin ante'li potta geniş savunması; OOP equity kaybı (oran verilmedi).
- Value ve blöf 3-bet'in ayrımı; OOP 3-bet'in genellikle daha büyük tutulması.
- Orta stack'te blind'ler dışında call'un zorlaşması ve 3-bet/fold; SB'de call'un daha seyrek olması, çoğunlukla 3-bet ya da fold (20–25 BB'ye inildikçe bu 3-bet çoğunlukla all-in); 15–25 BB'de resteal'in çoğunlukla all-in olması; düşük SPR'de (kabaca 3 ve altı) top pair ile stack koymanın çoğunlukla doğal olması.

### Bilinçli basitleştirmeler

- Resteal ve 3-bet/fold için aralık verilmedi; ICM (t7), fold equity (t5) ve squeeze anlatılmadı.
- 6 kişilik masa varsayıldı; 8–9 kişilik masa koltuk adları verilmedi.

### Emin olunmayan noktalar

- Cash açılış aralıklarının turnuvada derin stack'e "kabaca" aktarılması doğrulanmış bir turnuva aralığına dayanmıyor; bu yüzden kenardaki ve tartışmalı eller (UTG'de A9o, 22; BTN'de T7o, J5o) soru olarak kullanılmadı.
- t26'nın cevabı (düşük SPR'de top pair ile call) spotun notundaki aralığa ve gerekçesine dayanır; board'lu aralık equity'si betikte hesaplanmadı.
- "Pozisyon dışında 3-bet genellikle daha büyük tutulur" ve "orta stack'te değişen çoğunlukla aralığın içeriğidir" yaygın öğretim ilkeleridir; solver çıktısıyla doğrulanmadı.

### Doğrulama (t3–t4)

- 181 alıştırmadan 91'i `denetle.mts` ile denetlenir (t3 44, t4 47). Yeni türler: `basabasFold`, `oranYuzde`, `spr`, `flopTutma`; her biri için bozuk cevap testi `denetle.test.ts`'te. Ayrıca `toplam/carpim/bolum` sayı sorularına yuvarlama toleransı (en fazla 0,1) eklendi ve testle sabitlendi.
- Girdiler (risk, pot, kalan stack'ler) senaryodan elle girilir: **betik işlemi doğrular, senaryonun sayılara çevrilmesi elle kontrol edildi.**
- Kalan 90 alıştırma ilke ve tanım sorusudur; yukarıdaki listeyle elle karşılaştırıldı.

## c7 · 3-bet ve ötesi, c8 · Postflop matematiği

214 alıştırmadan 211'i `dogrulamaGerekli: false`. Üç spot alıştırması (c09: c7-d6/a11, c7-r/a7; c24: c8-d6/a11) docs/ekip/2026-11-11/01-spot-denetimi.md, B-1 gereği `kabulEdilebilir` (call) ve `dogrulamaGerekli: true` taşır (c9–c10 kapısında tutarlılık için eklendi). Sayısal iddialar betikle; strateji iddiaları "genellikle / çoğunlukla / yaygın" diliyle yazıldı.

### Kesin olan (kural ya da aritmetik)

- 3-bet / 4-bet / 5-bet sayımı; squeeze tanımı (açılış + en az bir call + 3-bet); limp tanımı.
- Bloker sayımı: elinde A varken AA 3, AK 12; A ve K varken AK 9, AA 3, KK 3 (desteden sayılır).
- Gereken equity = call / (call öncesi pot + call); başabaş fold oranı = risk / (risk + pot) ("görülürse hiç kazanmama" varsayımıyla; kesin eşik olmadığı ayrıca soruldu).
- Görülmeyen kart flop'ta 47, turn'de 46; kesin tutma ihtimali 1 − C(47 − outs, 2) / C(47, 2) (9 out %35,0; 15 out %54,1) ve outs / görülmeyen (9 / 46 ≈ %19,6; 9 / 47 ≈ %19,1).
- Implied odds başabaşı X = call × (1 / eq − 1) − pot (tutunca hep kazanma, tutmayınca eli bırakma varsayımıyla türetilir).
- SPR = kalan efektif stack / flop'taki pot (17,7; 5,3; 1,9; 1,7 örnekleri).

### Yaklaşık (kendi hesabımız)

- Preflop el ele equity'ler (öğretim örneği; Monte Carlo, 40.000 deneme, sabit tohum, ±1,5 puan): AA–KK ≈ %81, QQ–AKo ≈ %57, AKo–AJo ≈ %74, 88–AKo ≈ %56; metinde ondalıksız. Onay Ajanı bunları tam sayımla bağımsız hesapladı (%81,26; %57,2; %73,69; %55,57): hepsi yazılan değere 1 puandan yakın.
- Aralığa karşı equity (Monte Carlo): J4o BTN'ye ≈ %35, T8s BTN'ye ≈ %41, QQ "AA, KK, AK" aralığına ≈ %40.
- o-… spotlarının aralığa karşı equity'leri (%11, %27, %46, %51, %58, %62) spotların kendi gerekçelerinden (Kapı B) alındı; bu iş kolunda yeniden hesaplanmadı. Fiyatları betikle yeniden hesaplandı.

### Genel kabul görmüş ilkeler (yumuşatılmış)

- 3-bet'in iki amacı (value, fold equity); value/blöf dengesinin gerekçesi (oran verilmedi).
- Lineer aralığın sık call eden rakiplere karşı "sık öğretilen" biçim olması; SB'de 3-bet aralığının geniş ve lineere yakın olup yine de blöf adayları içerebilmesi; polarize aralığın pozisyonda, call iyi bir seçenekken kullanılması.
- Blöf 3-bet adayının özellikleri (oynanabilirlik, bloker, call için yetersizlik); A5s gibi suited küçük asların "sık seçildiği".
- Boyutlar yaygın başlangıç noktası olarak: 3-bet IP ~3x, OOP ~4x; 4-bet 3-bet'in kabaca 2–2,5 katı; squeeze'de call eden başına bir açılış; iso-raise "basit bir başlangıç kuralı" olarak ~3 BB + limp başına 1 BB.
- 3-bet'e karşı offsuit, domine olmaya yatkın ellerin genellikle fold edilmesi; QQ+ ve AK'nın çoğunlukla 4-bet ile devam etmesi.
- 100 BB'de 4-bet/5-bet aralıklarının dar olması; 5-bet'in çoğunlukla all-in olması; stack derinleşince aralıkların genişleyebilmesi.
- Call edenin aralığının çoğunlukla sınırlı olması (squeeze'in fazladan fold equity'si); limp aralığının çoğu zaman zayıf olması (istisnası yazılı).
- Implied odds'u artıran/azaltan durumlar; ters implied odds'un domine eden ellerde görülmesi; SPR eşikleri (kabaca 3 ve altı, ör. 10 ve üstü).

### Bilinçli basitleştirmeler

- 3-bet, 4-bet ve squeeze aralıkları verilmedi (ranges.json'da yok). c7-d2'deki "AA, KK, QQ, AK + A5s–A2s" yalnızca kombinasyon saymak için bir öğretim örneğidir ve öyle yazıldı.
- Implied odds başabaşında rakibin ne ödeyeceğine dair sayı verilmedi; set örneklerinde set'in her zaman kazandığı varsayımı açıkça yazıldı.
- "Out" sayımı "floş ya da kent yapan kart" anlamında yapıldı; kirli outs yalnızca öğretim örneğinde (rakip eli açık) sayıldı.
- Rake yok.

### Emin olunmayan noktalar

- SB'de 3-bet aralığının geniş ve lineere yakın olduğu (yine de A5s gibi blöf adaylarını içerebileceği; c7-d3 ve c7-k ile uyumlu) ve 4-bet boyutunun "kabaca 2–2,5 kat" olduğu yaygın öğretim ilkeleridir; solver çıktısıyla doğrulanmadı.
- c11 gerekçesindeki boyut kuralı c7-d8'deki basit kuralla (3 BB + limp başına 1 BB → 4 BB) farklıydı; **düzeltildi (31593ed).**
- Spot cevapları (c07–c13, c17, c18, c24, c38) spotların kendi gerekçelerine dayanır; board'lu aralık equity'si betikte hesaplanmadı.

### Doğrulama (c7–c8)

- 214 alıştırmadan 121'i `denetle.mts` ile denetlenir (c7 50, c8 71). Yeni türler: `blokerKombo`, `outs`, `kazandiranKart`, `tutma`, `tutmaKart`, `equityEle`, `impliedBasabas`, `spotFiyat`; her biri için bozuk cevap testi `denetle.test.ts`'te (bloker etkisini unutmak, çifte sayılan outs, kirli out'u saymak, turn'de 47'ye bölmek, 4 kuralını kesin sanmak, implied hesabında potu düşmemek, preflop Monte Carlo'yu sayı sorusunda kullanmak, spotla uyuşmayan fiyat).
- Pot, boyut ve risk girdileri senaryodan elle girilir: **betik işlemi doğrular, senaryonun sayılara çevrilmesi elle kontrol edildi.** Outs, bloker ve el ele equity'de ise girdi yalnızca kartlardır; sayım betikte yapılır.
- Kalan 93 alıştırma ilke ve tanım sorusudur; yukarıdaki listeyle elle karşılaştırıldı.

## c9 · Flop: board ve c-bet, c10 · Value ve blöf

172 alıştırmadan 168'i `dogrulamaGerekli: false`. Dört spot alıştırması `kabulEdilebilir` ve `dogrulamaGerekli: true` taşır: c26 (c9-d5 ve c10-d4), c23 (c10-d4), c24 (c10-d6); hepsinde ikinci seçenek savunulabilir, solver yok (docs/ekip/2026-11-11/01-spot-denetimi.md, B-1, ve spot gerekçeleri).

### Kesin olan (tanım, kural ya da aritmetik)

- Board dokusu tanımları (müfredatın kendi tanımı, c9-d1'de açık): monoton = üç kart aynı renk; çiftli = iki kart aynı değer; floş çekişi = tam iki kart aynı renk; kent çekişi = bazı iki kartlık eller kent ya da en az 8 out'luk kent çekişi yapabiliyor (backdoor sayılmaz); kuru = gökkuşağı + çiftsiz + kent çekişi yok; ıslak = çiftsiz + floş çekişi + kent çekişi. Arada kalan board'lar sınıflanmaz.
- C-bet, agresör, donk bet, check-raise, pot kontrolü tanımları; check-raise ve donk bet kurallara uygundur.
- Gereken equity = bahis / (call öncesi pot + bahis) = B / (P + 2B); blöfün başabaş fold oranı = B / (P + B) (görülürse hiç kazanmama varsayımıyla); 1/3, 1/2, 2/3 ve pot kadar bahiste %20 / %25, %25 / %33,3, ≈ %28,6 / %40, ≈ %33,3 / %50.
- Her sokakta yarım pot bahis ve call potu ikiye katlar (10 → 20 → 40 → 80); SPR = kalan efektif stack / pot.
- Kombinasyon sayımı (KQ 8, K8 6, AK 9 ve 8, KK set 3 ve 1, QQ 1, 98 16) desteden kartlar çıkarılarak.
- River'da, rakibin raise etmeyeceği varsayımıyla, bir bahsin value getirmesi için görüldüğünde %50'den sık önde olmak gerekir (bahis B: kazanılan B × önde olma payı, kaybedilen B × geride olma payı).

### Genel kabul görmüş ilkeler (yumuşatılmış)

- Yüksek kartlı kuru board'ların genellikle açana, küçük bağlantılı board'ların savunana (özellikle sıkı açılışa karşı) yaradığı; BB'nin AA/KK/AK'nın çoğunu 3-bet ettiği için call aralığında bunların az olduğu.
- Kuru board'da range avantajıyla küçük ve sık c-bet'in, ıslak board'da daha büyük ve daha seçici c-bet'in yaygın olduğu ("çoğunlukla", "yaygın başlangıç noktası"); multiway ve OOP'de c-bet'in daha seçici olduğu.
- Küçük bahse karşı daha geniş savunma; raise adaylarının çok güçlü eller ve güçlü çekişler olduğu; OOP'de devam aralığının biraz daha sıkı olduğu.
- Value boyutunun rakibin görecek aralığına göre seçildiği; calling station'a karşı büyük value, az blöf.
- Saf blöf adaylarının showdown değeri olmayan eller olduğu; iyi blokerin rakibin call edeceği elleri azaltan kart olduğu.
- Check-raise ve donk bet'in genellikle seyrek olduğu; check-raise boyutunun "bahsin 3–4 katı civarı" olduğu (c23 ≈ 3,5x, c26 ≈ 4,4x); kuru board'da set ile bazen slow play.
- Pot kontrolü: yüksek SPR'de orta güçteki elle potu küçük tutmak; düşük SPR'de (kabaca 3 ve altı) top pair/overpair ile stack koymanın çoğunlukla doğal olduğu (c8-d6 ile aynı).

### Bilinçli basitleştirmeler

- Hiçbir c-bet sıklığı, savunma yüzdesi, value/blöf oranı ya da alpha verilmedi. MDF anılmadı (c12-d3). Savunma tarafında yalnızca gereken equity ve rakibin blöfünün başabaş oranı kullanıldı.
- c10-d1 ve c10-d2'deki kombinasyon ve görme sıklıkları (12/4, 6/8, 9/3; 20 kombinasyonun 12'si ve 5'i) öğretim örneğidir; soruda öyle yazılı ve ölçülmüş değer değildir.
- Board dokusunda turn ve river'ın birlikte getireceği backdoor çekişler ve "dinamik / statik" ayrımı yok.
- Rake yok.

### Emin olunmayan noktalar

- "UTG'ye karşı 6♥ 5♥ 4♣'te nut avantajı savunana kayabilir" yaygın öğretim ilkesi; BB'nin call aralığı ranges.json'da olmadığı için sayılmadı ("kayabilir" diye yazıldı).
- Check-raise boyutu ("3–4 katı civarı") ve kuru board'da küçük c-bet boyutunun "1/3 pot" örneği yaygın başlangıç noktalarıdır; solver çıktısıyla doğrulanmadı.
- c9-d5/a6'da 9♥ 4♥'ün K♠ 7♦ 2♣'te 1/3 pot c-bet'e karşı "fold için en doğal" el olduğu: diğer seçenekler (top pair, orta per, as yüksek + backdoor floş) açıkça daha iyi devam adayları; ama BB'nin 94s'yi hiç savunmadığı iddia edilmedi.
- Spot cevapları (c15–c17, c20, c23, c24, c26, c28–c30, c32) spotların kendi gerekçelerine dayanır; board'lu aralık equity'si betikte hesaplanmadı. Gerekçelerde görülen kesin dil ve küçük ifade sorunları (c20, c23, c26, c28, c32) Onay Ajanı'nın metinleriyle hands.ts'te düzeltildi (yalnızca `reasoning`; seçenek ve cevaplar aynı).

### Doğrulama (c9–c10)

- 172 alıştırmadan 66'sı `denetle.mts` ile denetlenir (c9 39, c10 27). Yeni türler: `boardDoku`, `boardSec`, `boardDokuEsleme`, `boyutEsleme`; bozuk cevap testleri `denetle.test.ts`'te (yanlış aile, ara board'u kuru/ıslak sormak, pratik kurala uymayan board, görünmeyen kart, iki doğru cevaplı seçim, yanlış eşleştirme, formül karıştırmak, gereksiz yuvarlama).
- **Board sınıflandırıcısının sınırı:** betik board'un derste verilen tanıma göre hangi aileye girdiğini doğrular; o board'da hangi stratejinin doğru olduğunu doğrulamaz.
- Pot, bahis ve stack girdileri senaryodan elle girilir: **betik işlemi doğrular, senaryonun sayılara çevrilmesi elle kontrol edildi.**
- Kalan 106 alıştırma ilke ve tanım sorusudur; yukarıdaki listeyle elle karşılaştırıldı.

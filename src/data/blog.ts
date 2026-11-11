// Blog yazıları. Tümü bu proje için özgün yazılmıştır.
export type Block = { h?: string; p: string };
export type Post = {
  slug: string;
  title: string;
  summary: string;
  date: string;
  minutes: number;
  tag: "Temel" | "Cash game" | "Turnuva" | "Matematik" | "Zihin";
  body: Block[];
};

export const POSTS: Post[] = [
  {
    slug: "pozisyon-neden-onemli",
    title: "Pozisyon neden bu kadar önemli?",
    summary: "Aynı el butonda kârlı, UTG'de zararlı olabilir. Nedenini üç maddede anlatıyoruz.",
    date: "2026-10-06",
    minutes: 4,
    tag: "Temel",
    body: [
      { p: "Poker eksik bilgiyle oynanan bir oyundur ve pozisyon, bu eksik bilgiyi azaltmanın en ucuz yoludur. Rakibinden sonra konuşuyorsan (pozisyonda, IP), kararını vermeden önce onun ne yaptığını görürsün. Önce konuşuyorsan (pozisyon dışı, OOP) karanlıkta karar verirsin." },
      { h: "1. Daha çok bilgi", p: "Rakip check dediyse çoğu zaman zayıftır; bahis yaptıysa bir şey temsil ediyordur. Pozisyondayken bu bilgiyi her sokakta bedavaya alırsın. Pozisyon dışındayken aynı bilgiyi rakibine sen verirsin." },
      { h: "2. Potun büyüklüğünü sen belirlersin", p: "Orta güçte bir elle potu küçük tutmak istiyorsan pozisyonda check deyip bir sonraki kartı bedava görebilirsin. Güçlü elle potu büyütmek istiyorsan son sözü söyleyen sen olursun. Pozisyon dışında bu kontrol rakibe geçer." },
      { h: "3. Blöfler daha ucuza çalışır", p: "Rakip iki kez check dediğinde pozisyondaki oyuncu küçük bir bahisle potu sıkça alır. Bu yüzden butondan açılan aralık, UTG'den açılan aralığın yaklaşık üç katı genişliğindedir." },
      { h: "Pratik sonuç", p: "Erken pozisyonda sıkı oyna, geç pozisyonda aralığını genişlet. Blind'larda ise pota zaten para koyduğun için fiyatın iyidir ama flop sonrası pozisyon dışı kalacağını unutma. Range matrisinde UTG ile BTN arasındaki farka bakmak bu fikri gözle görmenin en hızlı yolu." },
    ],
  },
  {
    slug: "pot-odds-adim-adim",
    title: "Pot odds: üç adımda hesap",
    summary: "Call etmeli miyim sorusunun matematiği sanıldığından basit. Tek bir bölme işlemi yeter.",
    date: "2026-10-13",
    minutes: 5,
    tag: "Matematik",
    body: [
      { p: "Pot odds, bir bahsi görmenin sana neye mal olduğunu ve karşılığında ne kazanabileceğini karşılaştırır. Sonuç tek bir sayıdır: call için gereken minimum equity." },
      { h: "Adım 1: Toplam potu bul", p: "Rakibin bahsi dahil ortadaki chip'leri topla. Örnek: pot 10 BB, rakip 5 BB bahis yaptı. Ortada 15 BB var." },
      { h: "Adım 2: Kendi call'unu ekle ve böl", p: "Gereken equity = call / (pot + call). Örnekte 5 / (15 + 5) = %25. Yani elin dört seferde bir kazanıyorsa call başabaş olur; daha sık kazanıyorsa kârlıdır." },
      { h: "Adım 3: Kendi equity'ni tahmin et", p: "Çekişlerde 2 ve 4 kuralı işini görür: flop'ta out sayını 4 ile, turn'de 2 ile çarp. Floş çekişi (9 out) flop'ta yaklaşık %36, turn'de yaklaşık %18 eder. Örnekte %25 gerekiyordu; flop'taki floş çekişi rahatça call eder." },
      { h: "Sık yapılan iki hata", p: "Birincisi, flop'ta “× 4” kuralını kullanıp turn'de bir bahis daha ödeyeceğini unutmak. Rakip turn'de de bahis yapacaksa yalnızca bir sonraki kartın olasılığını (× 2) kullanmak daha gerçekçidir. İkincisi, tüm out'ları temiz saymak: tuttuğunda rakibe daha iyi el yaptıran kartlar gerçek out değildir." },
      { h: "Pot odds yetmiyorsa", p: "Implied odds devreye girer: tuttuğunda sonraki sokaklarda kazanmayı beklediğin chip'ler. Derin stack'lerde ve gizli çekişlerde (set, kent) yüksek; kısa stack'lerde ve herkesin gördüğü floş çekişlerinde düşüktür. Hesap makineleri sayfasında kendi sayılarınla deneyebilirsin." },
    ],
  },
  {
    slug: "c-bet-ne-zaman",
    title: "C-bet: ne zaman bahse devam, ne zaman check?",
    summary: "Her flop'ta otomatik bahis yapmak eski bir alışkanlık. Board'a ve rakip sayısına göre karar ver.",
    date: "2026-10-20",
    minutes: 5,
    tag: "Cash game",
    body: [
      { p: "Preflop'ta raise yapan oyuncu flop'ta bahse devam ederse buna c-bet denir. İnisiyatif sende olduğu için rakip ıskaladığında potu ucuza alırsın. Ama her flop'ta c-bet yapmak, okunması kolay ve pahalı bir alışkanlıktır." },
      { h: "Board kime uyuyor?", p: "K-7-2 gibi kuru ve yüksek kartlı board'lar açılış yapan oyuncunun aralığına uyar: sende AK, KQ, KK daha çoktur. Buna range avantajı denir ve küçük bir bahis (potun üçte biri) çoğu zaman yeter. 9-8-7 gibi bağlantılı, orta kartlı board'lar ise call eden oyuncunun aralığına uyar; burada daha sık check gerekir." },
      { h: "Kaç rakip var?", p: "Tek rakibe karşı blöf c-bet'i sık çalışır. İki ya da daha fazla rakip varken (multiway) birinin board'u yakalamış olma ihtimali hızla artar. Multiway potlarda per'in ya da güçlü çekişin yoksa check varsayılan seçenek olmalı." },
      { h: "Pozisyon", p: "Pozisyondayken c-bet daha rahattır; rakip görürse turn'de yine son sen konuşursun. Pozisyon dışında ıslak board'larda check oranını artırmak, zor turn kararlarını azaltır." },
      { h: "Boyut", p: "Kuru board: küçük (1/3 pot). Islak board ve güçlü el: büyük (2/3 pot ve üstü), çünkü çekişlere kötü fiyat vermek istersin. Boyutu elinin gücüne göre değil board'a göre seçersen rakip seni okuyamaz." },
      { h: "Rakip tipi", p: "Her bahsi gören bir calling station'a blöf c-bet'i azalt, value bet'i artır. Çok fold eden bir oyuncuya karşı tersini yap. Dengeli strateji referans noktandır; rakibin hatası belli olduğunda ondan sap." },
    ],
  },
  {
    slug: "push-fold-temelleri",
    title: "Kısa stack'te push/fold'un mantığı",
    summary: "10 BB'nin altında neden yalnızca all-in ya da fold? Fold equity ve stack'i koruma üzerine.",
    date: "2026-10-27",
    minutes: 4,
    tag: "Turnuva",
    body: [
      { p: "Turnuvada blind'lar yükseldikçe stack'in BB cinsinden küçülür. Kabaca 10–12 BB'nin altına indiğinde normal bir açılış (2 BB) stack'inin beşte birini pota koyar. Biri all-in dediğinde ya çok kötü bir fiyata fold edersin ya da zaten all-in demiş olman gereken bir eli call edersin. Bu yüzden kısa stack'te en sade strateji iki seçeneklidir: all-in ya da fold." },
      { h: "All-in iki yoldan kazanır", p: "Herkes fold ederse blind ve ante'leri alırsın; 10 BB'lik stack için bu %20–25 büyüme demektir. Biri görürse elinin equity'si kadar kazanırsın. Bu ikisinin toplamı, tek başına zayıf görünen birçok eli kârlı yapar." },
      { h: "Pozisyon aralığı belirler", p: "Arkanda ne kadar çok oyuncu varsa birinin güçlü el bulma ihtimali o kadar yüksektir. 10 BB ile UTG'den dar, butondan geniş, SB'den çok geniş itilir. Range matrisi sayfasında “Push/fold” sekmesinden stack ve pozisyona göre yaklaşık aralıklara bakabilirsin." },
      { h: "Hangi eller?", p: "As içeren eller ve cep çiftleri görüldüğünde de dayanıklıdır. Suited connector'lar çoğu call aralığına karşı “canlı” kalır. K4o, Q6o gibi eller ise görüldüğünde çoğunlukla domine durumdadır; yalnızca geç pozisyonda itilir." },
      { h: "Beklemenin bedeli", p: "Her tur blind ve ante ödersin. 8 BB'den 5 BB'ye düşersen all-in'in artık kimseyi korkutmaz; fold equity'n erir. İyi bir spot beklemek mantıklı, mükemmel eli beklemek pahalıdır." },
    ],
  },
  {
    slug: "icm-nedir",
    title: "ICM nedir? Chip'ler neden para değildir",
    summary: "Turnuvada kazandığın chip, kaybettiğin chip kadar değerli değildir. Bubble kararlarını değiştiren fikir.",
    date: "2026-11-03",
    minutes: 5,
    tag: "Turnuva",
    body: [
      { p: "Cash game'de 100 chip her zaman 100 chip'tir. Turnuvada ise chip'lerin değeri ödül yapısına bağlıdır: tüm chip'leri toplayan oyuncu ödül havuzunun tamamını değil, yalnızca birincilik ödülünü alır. ICM (Independent Chip Model), stack'lerin ödül havuzundaki payını hesaplamanın standart yoludur." },
      { h: "Temel sonuç", p: "Stack'ini ikiye katlamak ödül payını ikiye katlamaz; ama stack'ini kaybetmek payının tamamını götürür. Yani kaybedilen chip, kazanılan chip'ten daha değerlidir. Bu fark, ödül sırasına yaklaştıkça büyür." },
      { h: "Bubble'da ne değişir?", p: "Ödüle bir kişi kala orta stack'ler en büyük baskıyı hisseder: elenirlerse hiçbir şey alamazlar, bekleyerek ise kısa stack'lerin elenmesinden yararlanabilirler. Bu yüzden all-in'leri görmek için normalden çok daha güçlü el gerekir. Chip lideri bunu bilir ve geniş bir aralıkla baskı kurar." },
      { h: "Risk primi", p: "Chip hesabıyla %45 equity yeten bir call, ICM altında %55 ya da daha fazlasını isteyebilir. Aradaki farka risk primi denir. Kısa stack'e karşı düşük, seni eleyebilecek büyük stack'e karşı yüksektir." },
      { h: "En uç örnek: satellite", p: "Ödülün bilet olduğu satellite'lerde birinci ile sonuncu bilet sahibi aynı şeyi kazanır. Bilet neredeyse garantiyken AA'yı bile fold etmek doğru olabilir; çünkü kazanınca ek bir şey almazsın." },
      { h: "Nasıl çalışılır?", p: "Hesap makineleri sayfasındaki ICM aracına stack'leri ve ödülleri gir; bir all-in'i kazandığında ve kaybettiğinde payının nasıl değiştiğine bak. Birkaç denemeden sonra “kaybetmek kazanmaktan pahalı” fikri sezgiye dönüşür." },
    ],
  },
  {
    slug: "tilt-ve-sorumlu-oyun",
    title: "Tilt, varyans ve sorumlu oyun",
    summary: "İyi karar verip kaybetmek oyunun parçası. Önemli olan kendine koyduğun sınırlar.",
    date: "2026-11-09",
    minutes: 4,
    tag: "Zihin",
    body: [
      { p: "Poker, doğru kararın kısa vadede kötü sonuç verebildiği bir oyundur. AA ile all-in olup kaybetmek hata değildir; varyanstır. Çalışmanın amacı sonuçları değil, kararları değerlendirmeyi öğrenmektir. Bu site de bunun için var: bir strateji ve matematik çalışma aracı." },
      { h: "Tilt'i tanı", p: "Kayıptan sonra hızlanan kararlar, “bunu geri almalıyım” düşüncesi, normalde oynamayacağın elleri oynamak tilt belirtileridir. Tilt bir karakter kusuru değil, herkesin yaşadığı bir durumdur. Çözümü basittir: fark ettiğin an bırak." },
      { h: "Sınırlarını önceden koy", p: "Oturmadan önce süre ve bütçe sınırı belirle; sınır dolunca kalk. Kaybı kovalamak, yani kaybettiğini geri almak için limiti ya da süreyi artırmak, en pahalı alışkanlıktır. Poker bütçesi her zaman günlük hayatı etkilemeyecek bir miktar olmalı; borçla oynanmaz." },
      { h: "Uyarı işaretleri", p: "Planladığından uzun oynamak, oyunu yakınlarından gizlemek, iş, okul ya da ilişkileri aksatmak, oynayamayınca huzursuz olmak. Bunlardan biri sana tanıdık geliyorsa ara vermek ve bir uzmanla konuşmak güç göstergesidir. Türkiye'de Yeşilay Danışmanlık Merkezi (YEDAM) 115 numaralı hattan ücretsiz destek verir." },
      { h: "Bu site hakkında", p: "Cheers 18 yaş ve üzeri kullanıcılar içindir. Gerçek parayla oyun oynatmaz, bahis önermez ve kazanç vaat etmez. Buradaki her şey bir zihin oyununu daha iyi anlamak içindir." },
    ],
  },
  {
    slug: "risk-primi-hesabi",
    title: "Risk primi nasıl hesaplanır? Üç bubble kararı",
    summary: "Chip hesabıyla call görünen iki el, ICM ile neden fold oluyor? Varsayımları açık, adım adım bir hesap.",
    date: "2026-11-11",
    minutes: 6,
    tag: "Turnuva",
    body: [
      { p: "“ICM nedir?” yazısında risk primini tanımlamıştık: chip hesabının istediği equity ile ödül hesabının istediği equity arasındaki fark. Bu yazıda o farkı alıştırma masasındaki iki spot üzerinden sayıyla gösteriyoruz. Önce şunu netleştirelim: aşağıdaki sayılar bir solver çıktısı değildir. Malmuth-Harville ICM modeliyle (hesap makineleri sayfasındaki araçla aynı formül) ve kendi el değerlendiricimizle yapılmış, varsayımları belirtilmiş yaklaşık hesaplardır." },
      { h: "Yöntem: üç sayı yeter", p: "Bir all-in kararında üç durumun ödül payını (beklenen ödülünü) hesapla: fold edersen (F), call edip kazanırsan (K), call edip kaybedersen (L). Call'un başabaş equity'si (F − L) / (K − L) olur. Chip hesabındaki karşılığı ise bildiğin pot odds formülüdür: ödeyeceğin miktar / (pot + ödeyeceğin miktar). İkisi arasındaki fark risk primidir. ICM modeli gelecekteki elleri, blind baskısını ve oyuncuların becerisini hesaba katmaz; bu yüzden sonuçlar yön gösterir, kesin sınır çizmez." },
      { h: "1. Bubble'da AJo, chip liderinin all-in'i", p: "Spot: 5 oyuncu kaldı, 4 kişi ödül alıyor. Buton 60 BB ile chip lideri ve all-in yaptı; sen BB'de 22 BB'lik AJo'sun; iki oyuncunun 3'er BB'si var. Ödül dağılımını %40 / %30 / %20 / %10 varsaydık (gerçek turnuvalarda farklı olabilir). Chip hesabıyla call için yaklaşık %46 equity yeter. ICM ile: fold ederken ödül payın yaklaşık 24,6; kazanınca 30,9; kaybedince 0 (ödülsüz elenirsin). Başabaş equity (24,6 − 0) / (30,9 − 0) ≈ %80 çıkar. AJo, kendi referans 10 BB buton push aralığımıza karşı yaklaşık %60 equity taşır. Chip'e göre rahat call, ICM'e göre açık fold. Ödül dağılımını %35 / %25 / %22 / %18 gibi daha düz alınca başabaş %86'ya yükselir: ödüller birbirine ne kadar yakınsa elenmek o kadar pahalıdır." },
      { h: "2. Final masasında 3 kişi: KJo", p: "Spot: SB 50 BB ile lider ve all-in yaptı, sen BB'de 30 BB'lik KJo'sun, butonda 6 BB'lik bir oyuncu var. Ödülleri %50 / %30 / %20 varsaydık. Chip hesabı yaklaşık %47,5 equity istiyor. ICM ile: fold ≈ 35,0; kazanırsan ≈ 43,6; kaybedersen üçüncü olursun ve 20 alırsın. Başabaş (35,0 − 20) / (43,6 − 20) ≈ %64. KJo'nun SB'nin referans 10 BB push aralığına karşı equity'si yaklaşık %55. Risk primi burada yaklaşık 16 puan ve elin bunu karşılamıyor. Dikkat: kaybedince sıfır değil üçüncülük ödülü aldığın için prim, bubble örneğinden daha küçüktür." },
      { h: "3. Satellite: QQ bile fold", p: "6 oyuncu, 5 bilet. İki oyuncunun 2'şer BB'si var ve sen 40 BB ile bileti neredeyse almışsın. Fold edersen beklenen değerin bir bilete çok yakın; kazanırsan yine bir bilet alırsın, kaybedersen hiçbir şey. Bu durumda başabaş equity %99'un üzerine çıkar; QQ'nun geniş bir aralığa karşı yaklaşık %74'lük equity'si bile yetmez. Kazanmanın neredeyse hiçbir şey eklemediği, kaybetmenin her şeyi götürdüğü bu yapı, risk priminin en uç halidir." },
      { h: "Ne öğrendik?", p: "Risk primi sabit bir sayı değildir: ödül dağılımına, kaç oyuncunun elenmek üzere olduğuna ve seni kimin eleyebildiğine göre değişir. Kısa stack'e karşı küçüktür; seni kapatan büyük stack'e karşı büyüktür. Kendi kararlarını çalışırken aynı üç sayıyı hesap makineleri sayfasındaki ICM aracıyla bulabilirsin. Bu hesaplar karar kalitesini çalışmak içindir; hiçbir hesap tek bir elin ya da turnuvanın sonucunu garanti etmez." },
    ],
  },
  {
    slug: "blind-savunmasi-fiyat-aralik-pozisyon",
    title: "BB'de ne zaman savunmalı? Fiyat, aralık ve pozisyon",
    summary: "Big blind'da call kararını üç soruya indiriyoruz: ne kadar equity gerekiyor, rakip hangi ellerle açıyor ve bu equity'nin ne kadarını kullanabileceksin?",
    date: "2026-11-11",
    minutes: 6,
    tag: "Cash game",
    body: [
      { p: "Big blind (BB), masada en çok chip kaybedilen pozisyondur. Bu kaçınılmazdır: her elde zorunlu bahsi sen koyarsın ve flop sonrasında çoğu zaman ilk konuşan sen olursun. Amaç BB'de kâr etmek değil, kaybı en aza indirmektir. Bunun için üç soruya cevap vermen yeterli. Yazıdaki equity değerleri kendi el değerlendiricimizle ve sitedeki yaklaşık açılış aralıklarıyla (UTG ellerin yaklaşık %15'i, CO %27, buton %43) hesaplandı. Bunlar solver aralıkları değildir; gerçek rakipler farklı aralıklarla oynar." },
      { h: "1. Fiyat: ne kadar equity gerekiyor?", p: "**Equity**, elinin rakibin olası ellerine karşı potu kazanma payıdır. Call için gereken equity: ödeyeceğin miktar / (pot + ödeyeceğin miktar). Buton 2,5 BB açtı, SB fold etti: ortada 2,5 + 0,5 + 1 = 4 BB var. 1,5 BB daha ödersen pot 5,5 BB olur ve gereken equity 1,5 / 5,5 = **%27,3** çıkar. Açılış küçüldükçe ya da potta daha çok ölü para oldukça fiyat iyileşir:\n- Buton 2,5 BB açtı: 1,5 BB ödersin, pot 5,5 BB, gereken %27,3\n- Buton 3 BB açtı: 2 BB ödersin, pot 6,5 BB, gereken %30,8\n- Buton 2 BB açtı (min-raise): 1 BB ödersin, pot 4,5 BB, gereken %22,2\n- CO 2,5 BB açtı, buton call etti: 1,5 BB ödersin, pot 8 BB, gereken %18,8\n- Turnuva, BB ante 1, buton 2,2 BB açtı: 1,2 BB ödersin, pot 5,9 BB, gereken %20,3\nSon satıra dikkat: turnuvalarda ante BB'nin fiyatını belirgin biçimde iyileştirir. Bu yüzden turnuvada BB, cash'e göre daha geniş savunur." },
      { h: "2. Aralık: rakip hangi ellerle açıyor?", p: "Fiyat aynı olsa bile karar değişebilir, çünkü elinin equity'si rakibin aralığına, yani bu durumda açabileceği bütün ellere bağlıdır. J4 offsuit butonun aralığına karşı yaklaşık %35 equity taşır, UTG'nin aralığına karşı ise yaklaşık %29. Aynı el, aynı fiyat (%27,3), ama UTG'ye karşı eşiğin hemen üstünde kalıyor. Daha da önemlisi, UTG'nin aralığı AJ, KJ, QJ gibi ellerle dolu: J'li per yaptığında bile çoğu zaman **domine** durumdasın, yani rakipte aynı kart ve daha iyi bir kicker (yan kart) var. Kural: açan oyuncu ne kadar erken pozisyondaysa savunma aralığın o kadar daralır." },
      { h: "3. Pozisyon: equity'nin ne kadarını kullanabileceksin?", p: "Yukarıdaki equity değerleri iki elin de beş kartı sonuna kadar gördüğü varsayımıyla hesaplanır. Gerçekte flop'tan sonra bahisler olur ve pozisyon dışında oynayan taraf ham equity'sinin bir kısmını kullanamadan fold etmek zorunda kalır. Buna **equity realization** (equity'yi gerçekleştirme) denir. Butonun 2,5 BB açılışına karşı iki eli karşılaştır:\n- 72 offsuit: ham equity yaklaşık %30. %27,3'lük eşiği geçmek için bunun %90'ından fazlasını kullanması gerekir.\n- T8 suited: ham equity yaklaşık %41. Eşik için yaklaşık üçte ikisini kullanması yeter.\n72o kâğıt üstünde eşiği kıl payı geçiyor, ama pozisyon dışında, bağlantısız ve offsuit bir el çoğu flop'u ıskalar ve ilk bahiste bırakır. T8s ise kent ve floş yapabildiği için equity'sini çok daha rahat kullanır. Açılış 3 BB'ye çıkınca 72o'nun ham equity'si bile fiyatın (%30,8) altında kalır. Hangi elin equity'sinin ne kadarını gerçekleştirdiğine dair kesin oranlar kaynaktan kaynağa değişir; genel eğilim şudur: suited ve bağlantılı eller daha çok, offsuit ve kopuk eller daha az gerçekleştirir." },
      { h: "Üç soruyu birlikte kullanmak", p: "1. Fiyatı hesapla: kaç BB ödüyorsun, pot kaç olacak?\n2. Açanın pozisyonuna bak: buton ve SB geniş, UTG dar açar.\n3. Elinin oynanabilirliğine bak: suited mı, bağlantılı mı, yoksa domine olmaya yatkın mı?\nÜçü de lehine ise call. Biri açıkça aleyhine ise (çok güçlü bir aralık ya da hiç oynanamayan bir el) fold düşün. Çok kişili potlar özel bir durumdur: CO açıp buton call ettiğinde fiyat %19'a iner ve 65s gibi eller iki rakibe karşı bile yaklaşık %28 equity ile rahatça savunulur." },
      { h: "Sık yapılan üç hata", p: "- **“Zaten 1 BB koydum, call edeyim.”** Koyduğun 1 BB artık potun bir parçası, senin değil. Karar yalnızca ödeyeceğin ek miktara göre verilir.\n- **Her açılışa aynı aralıkla savunmak.** UTG'ye karşı butona karşı savunduğun gibi savunursan domine olduğun potlarda chip kaybedersin.\n- **Ante'yi unutmak.** Turnuvada ante'li potlarda K4o gibi eller, cash'te bırakacağın fiyatlarda rahatça savunulur: butonun 2,2 BB açılışına karşı gereken %20, K4o'nun ham equity'si ise yaklaşık %41." },
      { h: "Alıştırma masasında dene", p: "Alıştırma masasında “Blind savunması” filtresini seç. Bu yazıdaki örneklerin hepsi orada spot olarak var. Her spotta önce fiyatı kendin hesapla, sonra cevaba bak. Bu bir strateji çalışmasıdır; hiçbir hesap tek bir elin sonucunu garanti etmez. Oyun alışkanlıkların seni rahatsız ediyorsa sorumlu oyun sayfasına göz at." },
    ],
  },
];

export const POST_BY_SLUG = new Map(POSTS.map((p) => [p.slug, p]));

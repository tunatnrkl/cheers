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
];

export const POST_BY_SLUG = new Map(POSTS.map((p) => [p.slug, p]));

// El kütüphanesi. Tüm senaryolar ve açıklamalar bu proje için özgün yazılmıştır.
// Aynı kayıtlar alıştırma modunda soru olarak da kullanılır (options + correct).

export type Game = "cash" | "turnuva";
export type Street = "preflop" | "flop" | "turn" | "river";
export type Pos = "UTG" | "HJ" | "CO" | "BTN" | "SB" | "BB";
export type Topic =
  | "acilis"
  | "3bet"
  | "savunma"
  | "cbet"
  | "odds"
  | "value"
  | "blof"
  | "spr"
  | "pushfold"
  | "icm";

export const TOPICS: Record<Topic, string> = {
  acilis: "Açılış aralıkları",
  "3bet": "3-bet ve 4-bet",
  savunma: "Blind savunması",
  cbet: "C-bet ve barrel",
  odds: "Pot odds ve çekişler",
  value: "Value bet",
  blof: "Blöf ve bluff catch",
  spr: "SPR ve pot kontrolü",
  pushfold: "Push/fold",
  icm: "ICM ve bubble",
};

export const GAMES: Record<Game, string> = { cash: "Cash game", turnuva: "Turnuva" };
export const STREETS: Record<Street, string> = {
  preflop: "Preflop",
  flop: "Flop",
  turn: "Turn",
  river: "River",
};
export const POSITIONS: Pos[] = ["UTG", "HJ", "CO", "BTN", "SB", "BB"];

export type Hand = {
  id: string;
  title: string;
  game: Game;
  street: Street;
  heroPos: Pos;
  /** Efektif stack, BB cinsinden */
  stackBB: number;
  /** Kahramanın kartları: "AhKd" (s♠ h♥ d♦ c♣) */
  hero: string;
  /** Ortak kartlar: "Ks7d2c" */
  board?: string;
  /** Karar anındaki pot (BB) */
  potBB: number;
  /** Karar anına kadarki aksiyonlar, sırayla */
  actions: string[];
  options: string[];
  /** options içindeki önerilen hamlenin sırası */
  correct: number;
  reasoning: string;
  topic: Topic;
  level: 1 | 2 | 3;
};

export const HANDS: Hand[] = [
  // ───────────── CASH · PREFLOP ─────────────
  {
    id: "c01", title: "UTG'de A9 offsuit", game: "cash", street: "preflop", heroPos: "UTG", stackBB: 100,
    hero: "As9d", potBB: 1.5, actions: ["İlk konuşan sensin."],
    options: ["Fold", "Limp (1 BB)", "2.5 BB aç"], correct: 0, topic: "acilis", level: 1,
    reasoning: "Arkanda beş oyuncu var ve A9o, seni gören AT+ ellere karşı domine durumda kalır. Erken pozisyonda bu el çoğu zaman pozisyon dışında, zayıf kicker'la zor kararlar getirir. Bu varsayımlarla fold en sade ve kârlı seçenek.",
  },
  {
    id: "c02", title: "Butonda K9 suited", game: "cash", street: "preflop", heroPos: "BTN", stackBB: 100,
    hero: "Kh9h", potBB: 1.5, actions: ["UTG fold", "HJ fold", "CO fold"],
    options: ["Fold", "Limp (1 BB)", "2.5 BB aç"], correct: 2, topic: "acilis", level: 1,
    reasoning: "Butonda yalnızca iki blind'ı geçmen gerekiyor ve flop sonrası her sokakta son konuşacaksın. K9s hem blind'ları hemen kazanabilir hem de görüldüğünde pozisyon avantajıyla oynanır. Limp yerine raise, inisiyatifi sana verir.",
  },
  {
    id: "c03", title: "Cutoff'ta 76 suited", game: "cash", street: "preflop", heroPos: "CO", stackBB: 100,
    hero: "7s6s", potBB: 1.5, actions: ["UTG fold", "HJ fold"],
    options: ["Fold", "2.5 BB aç", "5 BB aç"], correct: 1, topic: "acilis", level: 2,
    reasoning: "Geç pozisyonda suited connector'lar açılış aralığının alt sınırına yakın ama oynanabilir ellerdir: kent ve floş yapabilir, board'u farklı yerlerden yakalar. Büyük açmak gereksiz; standart boyut hem ucuz çalar hem kaybını sınırlar. Arkada çok agresif 3-bet atan oyuncular varsa fold da savunulabilir.",
  },
  {
    id: "c04", title: "SB'de A5 offsuit, herkes fold", game: "cash", street: "preflop", heroPos: "SB", stackBB: 100,
    hero: "Ac5d", potBB: 1.5, actions: ["Herkes fold etti, sıra sende. Karşında yalnızca BB var."],
    options: ["Fold", "Limp (tamamla)", "3 BB aç"], correct: 2, topic: "acilis", level: 2,
    reasoning: "Tek bir oyuncuya karşı as içeren eller rastgele bir ele göre belirgin biçimde öndedir. Pozisyon dışında oynayacağın için SB'den biraz büyük açmak (3 BB) BB'nin ucuza görmesini zorlaştırır. Fold etmek, ölü parayı bırakmak olur.",
  },
  {
    id: "c05", title: "BB'de T8 suited, buton açtı", game: "cash", street: "preflop", heroPos: "BB", stackBB: 100,
    hero: "Td8d", potBB: 4, actions: ["BTN 2.5 BB açtı", "SB fold"],
    options: ["Fold", "Call (1.5 BB daha)", "3-bet 11 BB"], correct: 1, topic: "savunma", level: 1,
    reasoning: "4 BB'lik pota girmek için 1.5 BB ödüyorsun; yaklaşık %27 equity yetiyor. Butonun aralığı geniştir ve T8s ona karşı bu eşiği rahatça geçer, üstelik floş ve kent yapabilir. Fold fazla sıkı; bu elle 3-bet ise çoğu zaman gereksiz büyük pot yaratır.",
  },
  {
    id: "c06", title: "BB'de KJ offsuit, UTG açtı", game: "cash", street: "preflop", heroPos: "BB", stackBB: 100,
    hero: "KsJd", potBB: 4.5, actions: ["UTG 3 BB açtı", "Diğerleri fold"],
    options: ["Fold", "Call (2 BB daha)", "3-bet 12 BB"], correct: 0, topic: "savunma", level: 2,
    reasoning: "UTG aralığı sıkıdır ve içinde AK, KQ, AJ gibi KJo'yu domine eden çok el bulunur. Per tuttursan bile kicker sorunu yüzünden büyük potları kaybetmeye yatkınsın (ters implied odds). Sıkı bir UTG'ye ve 3 BB'lik açılışa karşı fold, bu varsayımlarla en az hata içeren seçenek; küçük açılışa ya da gevşek rakibe karşı call düşünülebilir.",
  },
  {
    id: "c07", title: "Butonda AQ suited, cutoff açtı", game: "cash", street: "preflop", heroPos: "BTN", stackBB: 100,
    hero: "AhQh", potBB: 4, actions: ["CO 2.5 BB açtı"],
    options: ["Fold", "Call", "3-bet 7.5 BB"], correct: 2, topic: "3bet", level: 2,
    reasoning: "AQs, cutoff'un geniş açılış aralığının çoğundan öndedir; 3-bet ile hem value alır hem blind'ları elden çıkarırsın. Pozisyonda olduğun için açılışın yaklaşık üç katı yeterli. Call da kötü değil ama blind'lara squeeze fırsatı verir.",
  },
  {
    id: "c08", title: "SB'de A5 suited, buton açtı", game: "cash", street: "preflop", heroPos: "SB", stackBB: 100,
    hero: "As5s", potBB: 4, actions: ["BTN 2.5 BB açtı"],
    options: ["Fold", "Call", "3-bet 11 BB"], correct: 2, topic: "3bet", level: 3,
    reasoning: "SB'den call etmek seni pozisyon dışında, BB arkandayken zor durumda bırakır; bu yüzden çoğu el ya 3-bet ya fold olur. A5s iyi bir 3-bet blöf adayıdır: as blocker'ı rakibin AA/AK kombinasyonlarını azaltır, görülürse de floş ve wheel potansiyeli vardır. Pozisyon dışı olduğun için boyut biraz daha büyük.",
  },
  {
    id: "c09", title: "QQ ile açtın, buton 3-bet attı", game: "cash", street: "preflop", heroPos: "CO", stackBB: 100,
    hero: "QsQd", potBB: 12, actions: ["Sen CO'dan 2.5 BB açtın", "BTN 8 BB'ye 3-bet attı", "Blind'lar fold"],
    options: ["Fold", "Call", "4-bet 20 BB"], correct: 2, topic: "3bet", level: 2,
    reasoning: "Butonun cutoff'a karşı 3-bet aralığı JJ, TT, AQ ve blöfleri de içerir; QQ bu aralığa karşı net biçimde öndedir. 4-bet ile daha kötü ellerden value alır, AK gibi ellerin equity'sini ucuza görmesini engellersin. Çok sıkı, yalnızca KK+ ile 3-bet atan bir rakibe karşı call daha güvenli olurdu.",
  },
  {
    id: "c10", title: "AJ offsuit ile açtın, 3-bet yedin", game: "cash", street: "preflop", heroPos: "HJ", stackBB: 100,
    hero: "AdJc", potBB: 12, actions: ["Sen HJ'den 2.5 BB açtın", "BTN 8 BB'ye 3-bet attı", "Blind'lar fold"],
    options: ["Fold", "Call (5.5 BB daha)", "4-bet 20 BB"], correct: 0, topic: "3bet", level: 2,
    reasoning: "HJ açılışına 3-bet atan aralık genelde güçlüdür ve AJo onun value kısmına (AQ, AK, JJ+) karşı domine durumdadır. Pozisyon dışında, offsuit ve domine edilebilir bir elle devam etmek uzun vadede chip kaybettirir. Açılış aralığının bir kısmını 3-bet'e bırakmak normaldir; bu el o kısımdadır.",
  },
  {
    id: "c11", title: "Limp edene karşı AT suited", game: "cash", street: "preflop", heroPos: "BTN", stackBB: 100,
    hero: "AcTc", potBB: 2.5, actions: ["UTG limp etti (çok el oynayan, pasif bir oyuncu)", "HJ fold", "CO fold"],
    options: ["Fold", "Limp (arkadan gir)", "4 BB'ye raise"], correct: 2, topic: "acilis", level: 2,
    reasoning: "Pasif ve gevşek bir oyuncunun limp aralığı zayıftır; ATs ona karşı güçlü bir value elidir. Raise ile blind'ları eleyip bu oyuncuyla pozisyonda baş başa kalırsın (izolasyon). Limp üzerine raise'de boyut, normal açılışa limp başına yaklaşık 1 BB eklenerek büyütülür.",
  },
  {
    id: "c12", title: "BB'de JJ: açılış ve call var", game: "cash", street: "preflop", heroPos: "BB", stackBB: 100,
    hero: "JhJs", potBB: 6.5, actions: ["CO 2.5 BB açtı", "BTN call", "SB fold"],
    options: ["Call", "3-bet 9 BB", "3-bet 13 BB (squeeze)"], correct: 2, topic: "3bet", level: 3,
    reasoning: "JJ, iki rakibin aralığına karşı da öndedir ama üç kişilik potta pozisyon dışı oynamak zordur. Büyük bir squeeze, yalnızca call eden butonun genelde sınırlı (çok güçlü elleri içermeyen) aralığını cezalandırır ve potu çoğu zaman hemen kazandırır. Pozisyon dışında ve iki rakibe karşı boyut büyük olmalı; 9 BB herkese iyi fiyat verir.",
  },
  {
    id: "c13", title: "Derin stack'te 44 ile set avı", game: "cash", street: "preflop", heroPos: "BTN", stackBB: 200,
    hero: "4h4c", potBB: 4, actions: ["UTG 2.5 BB açtı (200 BB efektif)", "HJ fold", "CO fold"],
    options: ["Fold", "Call", "3-bet 8 BB"], correct: 1, topic: "odds", level: 2,
    reasoning: "Flop'ta set yapma ihtimalin yaklaşık 8'de 1'dir; tek başına pot odds bunu karşılamaz. Ama stack'ler 200 BB derinken ve UTG'nin aralığı güçlüyken, set tuttuğunda kazanacağın chip'ler (implied odds) bu call'u kârlı yapar. Pozisyonda olman da işini kolaylaştırır; set gelmezse çoğu zaman eli ucuza bırakırsın.",
  },

  // ───────────── CASH · POSTFLOP ─────────────
  {
    id: "c15", title: "Kuru board'da ıska: c-bet?", game: "cash", street: "flop", heroPos: "BTN", stackBB: 100,
    hero: "AdQc", board: "Ks7d2c", potBB: 5.5, actions: ["Sen BTN'den 2.5 BB açtın, BB call etti", "Flop: K♠ 7♦ 2♣", "BB check"],
    options: ["Check", "1/3 pot bahis (≈1.8 BB)", "Pot kadar bahis (5.5 BB)"], correct: 1, topic: "cbet", level: 1,
    reasoning: "Bu kuru board senin açılış aralığına rakibinkinden daha iyi uyuyor: sende AK, KQ, KK daha çok var (range avantajı). Küçük bir c-bet, BB'nin ıskaladığı çok sayıda eli ucuza fold ettirir; rakip görse bile as ve dam ile gelişme şansın var. Büyük bahis aynı işi daha pahalıya yapar.",
  },
  {
    id: "c16", title: "Islak board'da pozisyon dışı AK", game: "cash", street: "flop", heroPos: "CO", stackBB: 100,
    hero: "AsKd", board: "9h8h7c", potBB: 6.5, actions: ["Sen CO'dan 2.5 BB açtın, BTN call etti", "Flop: 9♥ 8♥ 7♣", "İlk konuşan sensin"],
    options: ["Check", "1/3 pot bahis", "Pot kadar bahis"], correct: 0, topic: "cbet", level: 2,
    reasoning: "Bu board butonun call aralığını (orta çiftler, suited connector'lar) senin aralığından çok daha iyi vuruyor. Elinde per de çekiş de yok; bahis yaparsan sık sık görülür ya da raise yersin. Böyle ıslak board'larda pozisyon dışıyken check, bu varsayımlarla daha az chip kaybettirir.",
  },
  {
    id: "c17", title: "Nut floş çekişi ve pot odds", game: "cash", street: "flop", heroPos: "BB", stackBB: 100,
    hero: "Ah5h", board: "Kh9h3c", potBB: 9.2, actions: ["BTN 2.5 BB açtı, sen BB'den call ettin (pot 5.5 BB)", "Flop: K♥ 9♥ 3♣", "Sen check, BTN 3.7 BB bahis yaptı"],
    options: ["Fold", "Call (3.7 BB)", "All-in"], correct: 1, topic: "odds", level: 1,
    reasoning: "9.2 BB'lik pota 3.7 BB ödüyorsun: gereken equity yaklaşık %29. Nut floş çekişinin 9 out'u river'a kadar kabaca %35 eder; as tutarsa kazanma ihtimalin de cabası. Call rahatça kârlı. Check-raise de bir seçenek ama all-in burada gereksiz büyük.",
  },
  {
    id: "c18", title: "Gutshot'a pot kadar bahis", game: "cash", street: "turn", heroPos: "BB", stackBB: 90,
    hero: "JsTs", board: "Ad8c7h2d", potBB: 24, actions: ["Flop'ta rakibin küçük bahsini gördün", "Turn: 2♦ (pot 12 BB)", "Sen check, rakip 12 BB (pot kadar) bahis yaptı"],
    options: ["Fold", "Call (12 BB)", "Raise"], correct: 0, topic: "odds", level: 1,
    reasoning: "Call için %33 equity gerekiyor (12 / 36). Elinde yalnızca gutshot var: 4 out, yani river'da tutma ihtimali yaklaşık %9. Tutarsa kazanacağın ek chip'ler bile bu farkı kapatmaz. Fiyat kötü olduğunda çekişi bırakmak doğru oyundur.",
  },
  {
    id: "c19", title: "Çift uçlu kent çekişine küçük bahis", game: "cash", street: "turn", heroPos: "BTN", stackBB: 80,
    hero: "9c8c", board: "Kd7s6h2c", potBB: 20, actions: ["Flop check-check geçti", "Turn: 2♣ (pot 16 BB)", "Rakip 4 BB bahis yaptı"],
    options: ["Fold", "Call (4 BB)", "Raise 14 BB"], correct: 1, topic: "odds", level: 2,
    reasoning: "20 BB'lik pota 4 BB ödüyorsun: gereken equity yaklaşık %17. Çift uçlu kent çekişi 8 out'la river'da yaklaşık %17 tutar; yani fiyat tam sınırda. Pozisyondasın ve tutarsan ek chip kazanma şansın (implied odds) var, bu da call'u artıya geçirir.",
  },
  {
    id: "c20", title: "River'da top pair: value bet", game: "cash", street: "river", heroPos: "BTN", stackBB: 100,
    hero: "AcKh", board: "Kd8s4c2h6d", potBB: 22, actions: ["Flop ve turn'de bahis yaptın, rakip ikisini de gördü", "River: 6♦", "Rakip (her bahsi gören, pasif bir oyuncu) check"],
    options: ["Check", "2/3 pot bahis (≈15 BB)", "All-in (≈85 BB)"], correct: 1, topic: "value", level: 1,
    reasoning: "Çekişsiz bu board'da rakibin iki bahsi gören aralığı çoğunlukla KQ, KJ, KT gibi daha kötü per'lerden oluşur. Calling station'a karşı blöf yapılmaz ama value bet kaçırılmaz: orta-büyük bir bahis daha kötü ellerden ödeme alır. All-in ise yalnızca seni yenen ellerin göreceği bir boyut olur.",
  },
  {
    id: "c21", title: "River'da ikinci per: bluff catch?", game: "cash", street: "river", heroPos: "BB", stackBB: 100,
    hero: "Td9d", board: "AsTh6c3dKc", potBB: 36, actions: ["Flop'ta rakibin bahsini gördün, turn check-check geçti", "River: K♣ (pot 18 BB)", "Sen check, rakip (çok sıkı, nadiren blöf yapan) 18 BB bahis yaptı"],
    options: ["Fold", "Call (18 BB)", "Raise"], correct: 0, topic: "blof", level: 2,
    reasoning: "Elin yalnızca blöfleri yenen bir bluff catcher. Pot kadar bahse call için rakibin en az 3'te 1 blöf yapıyor olması gerekir. Nadiren blöf yapan, sıkı bir oyuncu bu sıklığa ulaşmaz; as ve papaz da onun aralığına iyi oturur. Bu varsayımlarla fold doğru; agresif bir rakibe karşı karar değişebilirdi.",
  },
  {
    id: "c22", title: "River'da ince value", game: "cash", street: "river", heroPos: "BTN", stackBB: 100,
    hero: "KsQh", board: "Kc8d4s4h2c", potBB: 11, actions: ["Flop'ta küçük c-bet yaptın, BB call etti", "Turn check-check", "River: 2♣, BB check"],
    options: ["Check (kartları aç)", "1/2 pot bahis (≈5.5 BB)", "Pot kadar bahis"], correct: 1, topic: "value", level: 2,
    reasoning: "Rakip iki kez check dedi; güçlü bir eli olsaydı büyük ihtimalle bahis yapardı. Aralığında K-zayıf kicker, 8'li per ve cep çiftleri var; bunlar yarım pot bahsi çoğu zaman görür. Check edersen bu ellerden alabileceğin chip'i masada bırakırsın. Büyük bahis ise yalnızca daha iyi elleri görmeye iter.",
  },
  {
    id: "c23", title: "Islak board'da set", game: "cash", street: "flop", heroPos: "BB", stackBB: 100,
    hero: "8s8d", board: "Jh8h7c", potBB: 9.2, actions: ["BTN 2.5 BB açtı, sen BB'den call ettin", "Flop: J♥ 8♥ 7♣", "Sen check, BTN 3.7 BB bahis yaptı"],
    options: ["Call (slow play)", "Check-raise 13 BB", "Fold"], correct: 1, topic: "value", level: 2,
    reasoning: "Elin çok güçlü ama board floş ve kent çekişleriyle dolu; turn'de gelecek kartların yarısına yakını ya aksiyonu öldürür ya seni geçer. Raise ile hem çekişlere kötü fiyat verirsin hem de J'li ellerden ve çekişlerden şimdi value alırsın. Slow play kuru board'lar içindir.",
  },
  {
    id: "c24", title: "Düşük SPR'de overpair", game: "cash", street: "flop", heroPos: "SB", stackBB: 100,
    hero: "AsAc", board: "Td6s3h", potBB: 80, actions: ["BTN açtı, sen SB'den 3-bet attın, BTN 4-bet, sen call (pot 44 BB, kalan stack 78 BB)", "Flop: T♦ 6♠ 3♥", "Sen check, BTN 36 BB bahis yaptı"],
    options: ["Fold", "Call", "All-in (78 BB)"], correct: 2, topic: "spr", level: 2,
    reasoning: "Flop'ta SPR 2'nin altında: pot, kalan stack'e göre çok büyük. Bu kadar düşük SPR'de overpair ile eli bırakmak neredeyse hiçbir zaman doğru olmaz; rakibin aralığında KK, QQ, JJ, AK gibi geride olan çok el var. All-in, bu ellerin equity'sini bedavaya görmesini de engeller.",
  },
  {
    id: "c25", title: "Derin stack'te top pair'e turn raise", game: "cash", street: "turn", heroPos: "CO", stackBB: 150,
    hero: "AdKs", board: "Kh9c5h2s", potBB: 62, actions: ["Flop'ta 4 BB, turn'de 12 BB bahis yaptın (150 BB efektif)", "Turn: 2♠", "Rakip (sıkı, pasif) 42 BB'ye raise etti"],
    options: ["Fold", "Call (30 BB daha)", "All-in"], correct: 0, topic: "spr", level: 3,
    reasoning: "Sıkı ve pasif bir oyuncunun turn'de büyük raise'i çoğunlukla set ya da iki per demektir; bu tarz oyuncular burada nadiren blöf yapar. Stack'ler derin olduğundan call edersen river'da daha da büyük bir bahisle karşılaşırsın. Yüksek SPR'de tek per büyük potları kazanmaz. Bu varsayımlarla fold; agresif bir rakibe karşı call düşünülürdü.",
  },
  {
    id: "c26", title: "Combo draw ile semi-blöf", game: "cash", street: "flop", heroPos: "BB", stackBB: 100,
    hero: "9h8h", board: "Th7h2c", potBB: 7.3, actions: ["CO 2.5 BB açtı, sen BB'den call ettin", "Flop: T♥ 7♥ 2♣", "Sen check, CO 1.8 BB bahis yaptı"],
    options: ["Fold", "Call", "Check-raise 8 BB"], correct: 2, topic: "blof", level: 3,
    reasoning: "Floş çekişi ve çift uçlu kent çekişi birlikte 15 out eder; river'a kadar equity'n %50'nin üzerindedir, yani çoğu yapılmış ele karşı bile geride sayılmazsın. Raise iki yoldan kazanır: rakip hemen fold eder ya da görür ve sen tutarsın. Call da kârlıdır ama fold equity'yi kullanmaz.",
  },
  {
    id: "c27", title: "Turn'de korkutucu kart: ikinci barrel", game: "cash", street: "turn", heroPos: "CO", stackBB: 100,
    hero: "AhJh", board: "Ts6d2cKs", potBB: 9.5, actions: ["Sen CO'dan açtın, BB call etti", "Flop T♠ 6♦ 2♣: 1/3 pot c-bet yaptın, BB call", "Turn: K♠, BB check"],
    options: ["Check", "2/3 pot bahis (≈6.5 BB)", "All-in"], correct: 1, topic: "cbet", level: 3,
    reasoning: "Papaz senin açılış aralığına (AK, KQ, KJ) rakibin flop'ta call eden aralığından (T'li per, orta çiftler) çok daha iyi uyar. İkinci barrel, bu orta güçteki ellere zor bir karar verdirir. Görülürse de as, dam (kent) ve backdoor ihtimalleriyle tamamen boş değilsin.",
  },
  {
    id: "c28", title: "Calling station'a karşı blöfü bırak", game: "cash", street: "turn", heroPos: "BTN", stackBB: 100,
    hero: "AcQd", board: "Jh9h6s8d", potBB: 9, actions: ["Sen BTN'den açtın, BB (neredeyse hiç fold etmeyen oyuncu) call etti", "Flop J♥ 9♥ 6♠: c-bet yaptın, call", "Turn: 8♦, BB check"],
    options: ["Check", "2/3 pot bahis", "Pot kadar bahis"], correct: 0, topic: "blof", level: 2,
    reasoning: "Turn kartı rakibin aralığındaki pek çok eli (T'li eller, iki per'ler, çekişler) güçlendirdi; senin elin ise hâlâ as yüksek. Fold etmeyen bir oyuncuya blöf yapmak chip yakmaktır. Check ile bedava kart alırsın; on'lu gelirse kent yaparsın, as ya da dam gelirse per'in iyi olabilir.",
  },
  {
    id: "c29", title: "Üç kişilik potta ıska", game: "cash", street: "flop", heroPos: "UTG", stackBB: 100,
    hero: "AcKd", board: "8s7s6d", potBB: 9, actions: ["Sen UTG'den açtın, BTN ve BB call etti", "Flop: 8♠ 7♠ 6♦", "BB check, sıra sende"],
    options: ["Check", "1/3 pot bahis", "Pot kadar bahis"], correct: 0, topic: "cbet", level: 2,
    reasoning: "Multiway potlarda birinin board'u yakalamış olma ihtimali belirgin biçimde artar ve bu board call eden ellere (orta çiftler, suited connector'lar) çok uygundur. Per'in ve çekişin yokken iki rakibe blöf c-bet'i nadiren işler. Check edip eli ucuza görmek, bu varsayımlarla en az kayıplı yol.",
  },
  {
    id: "c30", title: "Orta güçte elle pot kontrolü", game: "cash", street: "turn", heroPos: "BTN", stackBB: 100,
    hero: "TsTc", board: "Qd7h3s5c", potBB: 9.5, actions: ["Sen BTN'den açtın, BB call etti", "Flop Q♦ 7♥ 3♠: 1/3 pot c-bet yaptın, BB call", "Turn: 5♣, BB check"],
    options: ["Check", "2/3 pot bahis", "All-in"], correct: 0, topic: "spr", level: 2,
    reasoning: "TT burada tipik bir showdown değeri eli: 7'li per ve küçük çiftleri yener, dam'lı ellere kaybeder. Bahis yaparsan çoğunlukla seni yenen eller görür, yendiğin eller fold eder. Check ile potu küçük tutar, river'da rakibin blöflerini ucuza yakalama şansı bulursun.",
  },
  {
    id: "c32", title: "River'da showdown değeri olmayan el", game: "cash", street: "river", heroPos: "BTN", stackBB: 100,
    hero: "7c6c", board: "Kd8s5h2d2s", potBB: 12, actions: ["Flop'ta rakibin küçük bahsini gördün (çift uçlu kent çekişi)", "Turn check-check", "River: 2♠, rakip yine check"],
    options: ["Check (kartları aç)", "2/3 pot bahis (8 BB)", "Minimum bahis (1 BB)"], correct: 1, topic: "blof", level: 3,
    reasoning: "7 yüksek ile showdown'da neredeyse hiçbir eli yenemezsin; check etmek potu vermek demek. Rakip turn ve river'da check diyerek zayıflık gösterdi: aralığı çoğunlukla 8'li per, küçük çiftler ve as yüksek. 2/3 pot blöfün başabaş noktası %40 fold; bu ellerin önemli kısmı bırakır. Her bahsi gören bir rakibe karşı ise check daha iyidir.",
  },
  {
    id: "c33", title: "Küçük river bahsine orta per", game: "cash", street: "river", heroPos: "BB", stackBB: 100,
    hero: "9s8s", board: "Qc9d4h3s7d", potBB: 16, actions: ["Flop'ta rakibin c-bet'ini gördün, turn check-check", "River: 7♦ (pot 12 BB)", "Sen check, rakip 4 BB (1/3 pot) bahis yaptı"],
    options: ["Fold", "Call (4 BB)", "Raise 16 BB"], correct: 1, topic: "blof", level: 2,
    reasoning: "16 BB'lik pota 4 BB ödüyorsun; elinin yalnızca %20 oranında iyi olması yetiyor. Rakip turn'de check dediği için aralığında güçlü dam'lar azaldı; küçük bahis blöfler ve daha zayıf per'lerle de yapılır. Bu fiyata ikinci per'i fold etmek fazla sıkı olur. Raise ise elini gereksiz yere blöfe çevirir.",
  },

  // ───────────── TURNUVA · PUSH/FOLD ─────────────
  {
    id: "t01", title: "10 BB ile butonda A7 offsuit", game: "turnuva", street: "preflop", heroPos: "BTN", stackBB: 10,
    hero: "Ad7c", potBB: 2.5, actions: ["Ante var; herkes fold etti, sıra sende"],
    options: ["Fold", "Min-raise (2 BB)", "All-in (10 BB)"], correct: 2, topic: "pushfold", level: 1,
    reasoning: "10 BB ile min-raise yapıp 3-bet'e fold etmek stack'inin beşte birini yakar; bu derinlikte en sade strateji push/fold'dur. Yalnızca iki oyuncuyu geçmen gerekiyor ve as içeren el, görüldüğünde bile çoğu call aralığına karşı makul equity taşır. Blind ve ante'leri kazanmak stack'ini yaklaşık %25 büyütür.",
  },
  {
    id: "t02", title: "8 BB ile SB'de K6 offsuit", game: "turnuva", street: "preflop", heroPos: "SB", stackBB: 8,
    hero: "Kd6s", potBB: 2.5, actions: ["Herkes fold etti; karşında yalnızca BB var"],
    options: ["Fold", "Limp", "All-in (8 BB)"], correct: 2, topic: "pushfold", level: 1,
    reasoning: "Tek bir rastgele ele karşı papaz yüksek el öndedir ve BB her eliyle 8 BB'yi göremez. Fold equity ile görüldüğündeki equity'n birleşince all-in açıkça artıdır. Fold edersen her turda eriyen stack'inle daha kötü bir spot beklemiş olursun.",
  },
  {
    id: "t03", title: "12 BB ile UTG'de QT offsuit", game: "turnuva", street: "preflop", heroPos: "UTG", stackBB: 12,
    hero: "QhTd", potBB: 2.5, actions: ["İlk konuşan sensin; arkanda beş oyuncu var"],
    options: ["Fold", "Min-raise", "All-in (12 BB)"], correct: 0, topic: "pushfold", level: 2,
    reasoning: "Arkanda beş oyuncu varken birinin seni görecek güçlü bir el bulma ihtimali yüksektir ve QTo görüldüğünde çoğunlukla domine ya da geridedir. Kısa stack olman her eli itmeyi gerektirmez: pozisyon, push aralığını en çok etkileyen şeydir. Aynı el butonda rahat bir all-in olurdu.",
  },
  {
    id: "t04", title: "15 BB ile cutoff'ta 55", game: "turnuva", street: "preflop", heroPos: "CO", stackBB: 15,
    hero: "5s5h", potBB: 2.5, actions: ["UTG fold, HJ fold"],
    options: ["Fold", "Min-raise", "All-in (15 BB)"], correct: 2, topic: "pushfold", level: 2,
    reasoning: "Küçük çiftler flop sonrası zor oynanır: çoğu flop'ta üç overcard görürsün. All-in bu sorunu ortadan kaldırır, fold equity'yi en üste çıkarır ve görüldüğünde iki overcard'a karşı yazı-tura civarı bir durum yaratır. Min-raise edip 3-bet all-in'e karşı zor karar vermektense itmek daha sade.",
  },
  {
    id: "t05", title: "BB'de A9 offsuit: butonun 10 BB all-in'i", game: "turnuva", street: "preflop", heroPos: "BB", stackBB: 10,
    hero: "As9c", potBB: 12.5, actions: ["BTN 10 BB all-in (senin stack'in 25 BB)", "SB fold"],
    options: ["Fold", "Call (9 BB daha)"], correct: 1, topic: "pushfold", level: 2,
    reasoning: "12.5 BB'lik pota 9 BB ödüyorsun: gereken equity yaklaşık %42. Butonun 10 BB'deki push aralığı geniştir (zayıf as'lar, papazlı eller, suited connector'lar) ve A9o bu aralığa karşı %50'nin üzerinde equity taşır. Bubble gibi özel bir ICM baskısı yoksa bu rahat bir call.",
  },
  {
    id: "t06", title: "BB'de J6 offsuit: SB all-in", game: "turnuva", street: "preflop", heroPos: "BB", stackBB: 15,
    hero: "Jc6d", potBB: 17, actions: ["Herkes fold, SB 15 BB all-in"],
    options: ["Fold", "Call (14 BB daha)"], correct: 0, topic: "pushfold", level: 1,
    reasoning: "Call için yaklaşık %45 equity gerekiyor (14 / 31). SB'nin 15 BB'deki push aralığı geniş olsa da J6o bu aralığa karşı %40'ın altında kalır. Fiyat cazip görünse bile matematik tutmuyor; “blind'ımı savunmalıyım” hissi burada chip kaybettirir.",
  },
  {
    id: "t11", title: "18 BB ile resteal", game: "turnuva", street: "preflop", heroPos: "SB", stackBB: 18,
    hero: "Ah9h", potBB: 4.7, actions: ["BTN 2.2 BB açtı (sık açan bir oyuncu)"],
    options: ["Fold", "Call", "All-in (18 BB)"], correct: 2, topic: "pushfold", level: 2,
    reasoning: "Sık açan bir butonun aralığı geniştir ve 18 BB'lik all-in'e bunun büyük kısmını fold eder. Mevcut pot stack'inin dörtte birinden fazla; hemen kazanmak ciddi bir artış. A9s görüldüğünde de tamamen geride değildir. SB'den call etmek ise seni pozisyon dışında, 15 BB ile flop oynamaya bırakır.",
  },
  {
    id: "t12", title: "25 BB ile butonda açılış boyutu", game: "turnuva", street: "preflop", heroPos: "BTN", stackBB: 25,
    hero: "KcTc", potBB: 2.5, actions: ["Herkes fold etti, sıra sende"],
    options: ["2.2 BB'ye aç", "3.5 BB'ye aç", "All-in (25 BB)"], correct: 0, topic: "acilis", level: 2,
    reasoning: "25 BB all-in için fazla derin: 2.5 BB kazanmak için 25 BB riske girersin ve yalnızca seni yenen eller görür. Turnuvada stack'ler sığ olduğu için küçük açılış standarttır; aynı çalma işini daha az chip'le yapar ve 3-bet yersen kaybın sınırlı kalır.",
  },
  {
    id: "t13", title: "88 ile açtın, SB 14 BB all-in", game: "turnuva", street: "preflop", heroPos: "HJ", stackBB: 14,
    hero: "8d8c", potBB: 18.2, actions: ["Sen HJ'den 2.2 BB açtın (stack 25 BB)", "SB 14 BB all-in, BB fold"],
    options: ["Fold", "Call (11.8 BB daha)"], correct: 1, topic: "pushfold", level: 2,
    reasoning: "30 BB'lik toplam pota 11.8 BB ödüyorsun: gereken equity yaklaşık %39. 14 BB'lik bir resteal aralığı genelde orta çiftler, as'lı eller ve broadway'lerden oluşur; 88 bu aralığa karşı yarı yarıya civarındadır. Kaybetsen de 11 BB ile oyunda kalırsın. Ortada özel bir ICM baskısı yoksa call.",
  },
  {
    id: "t18", title: "Heads-up'ta 8 BB ile Q5 offsuit", game: "turnuva", street: "preflop", heroPos: "SB", stackBB: 8,
    hero: "Qs5d", potBB: 1.5, actions: ["Turnuvada iki kişi kaldınız; buton/SB sensin"],
    options: ["Fold", "Limp", "All-in (8 BB)"], correct: 2, topic: "pushfold", level: 2,
    reasoning: "Heads-up'ta ICM baskısı kalmaz; her chip aynı değerdedir. Tek bir rastgele ele karşı dam yüksek ortalamanın üzerindedir ve rakip 8 BB'yi her elle göremez. Bu derinlikte heads-up push aralığı çok geniştir; fold etmek blind'ı karşılıksız vermek olur.",
  },
  {
    id: "t19", title: "13 BB ile AT offsuit", game: "turnuva", street: "preflop", heroPos: "CO", stackBB: 13,
    hero: "AsTd", potBB: 2.5, actions: ["UTG fold, HJ fold"],
    options: ["Fold", "Min-raise, 3-bet'e fold", "All-in (13 BB)"], correct: 2, topic: "pushfold", level: 1,
    reasoning: "ATo cutoff'tan 13 BB ile güçlü bir eldir; arkadaki üç oyuncunun çoğu eli fold eder, görenlerin bir kısmı da A9, KQ gibi geride olduğun ellerdir. Min-raise edip all-in'e fold etmek hem elinin equity'sini hem stack'inin %15'ini çöpe atar. All-in, kararı rakibe bırakır.",
  },
  {
    id: "t21", title: "Final masasında en kısa stack", game: "turnuva", street: "preflop", heroPos: "UTG", stackBB: 7,
    hero: "Ac4c", potBB: 2.5, actions: ["6 kişi kaldı; 7 BB ile en kısa stack sensin", "İlk konuşan sensin; gelecek el BB sana geliyor"],
    options: ["Fold", "All-in (7 BB)"], correct: 1, topic: "pushfold", level: 2,
    reasoning: "Fold edersen blind ve ante'ler iki elde stack'inin dörtte birine yakınını götürür ve fold equity'n iyice azalır. A4s, 7 BB ile UTG'den bile itilecek kadar güçlüdür: as blocker'ı güçlü call ellerini azaltır, görülürse de canlı kartların vardır. Kısa stack'te beklemek de bir karardır ve çoğu zaman pahalıdır.",
  },

  // ───────────── TURNUVA · ICM / BUBBLE ─────────────
  {
    id: "t07", title: "Bubble'da AJ offsuit: chip lideri all-in", game: "turnuva", street: "preflop", heroPos: "BB", stackBB: 22,
    hero: "AcJd", potBB: 25, actions: ["Ödüle 1 kişi kaldı; masada 3 BB'lik iki kısa stack var", "Chip lideri BTN'den all-in (seni kapsıyor)", "SB fold"],
    options: ["Fold", "Call (21 BB daha)"], correct: 0, topic: "icm", level: 3,
    reasoning: "Chip sayısına bakınca AJo geniş bir push aralığına karşı call gibi görünür. Ama bubble'da kaybedersen ödülsüz elenirsin; kazanırsan stack'in ikiye katlanır ama ödül payın ikiye katlanmaz (ICM). İki oyuncu elenmek üzereyken orta stack'inle büyük riske girmek için equity'nin eşiğin epey üzerinde olması gerekir. Bu varsayımlarla fold.",
  },
  {
    id: "t08", title: "Bubble'da chip lideri olarak baskı", game: "turnuva", street: "preflop", heroPos: "BTN", stackBB: 15,
    hero: "Ks5s", potBB: 2.5, actions: ["Ödüle 1 kişi kaldı; sen 60 BB ile chip liderisin", "Blind'lardaki iki oyuncunun 15'er BB'si var", "Herkes fold etti, sıra sende"],
    options: ["Fold", "2 BB'ye aç", "Limp"], correct: 1, topic: "icm", level: 2,
    reasoning: "Bubble'da orta stack'ler elenmemek için çok sıkı oynar; sana karşı gelmek için güçlü ele ihtiyaçları vardır. Chip lideri olarak bu baskıyı ucuz açılışlarla kullanmak stack'ini risksize yakın büyütür. K5s normalde sınırda bir açılıştır, burada rahat bir çalma elidir. All-in gelirse fold edebilirsin.",
  },
  {
    id: "t09", title: "Bubble'da 5 BB: beklemek mi?", game: "turnuva", street: "preflop", heroPos: "UTG", stackBB: 5,
    hero: "Kd9c", potBB: 2.5, actions: ["Ödüle 1 kişi kaldı", "Başka masada 1 BB'lik bir oyuncu gelecek el BB'de", "Sen 5 BB ile UTG'desin"],
    options: ["Fold", "All-in (5 BB)"], correct: 0, topic: "icm", level: 3,
    reasoning: "Normalde 5 BB ile K9o itilebilir. Ama senden çok daha kısa bir oyuncu bir sonraki elde blind'a girmek zorunda ve büyük ihtimalle senden önce elenecek. Marjinal bir elle şimdi risk almak yerine bir el beklemek, ödüle girme ihtimalini belirgin artırır. ICM bazen “şimdi değil” der.",
  },
  {
    id: "t10", title: "Final masasında 3 kişi: KJ offsuit", game: "turnuva", street: "preflop", heroPos: "BB", stackBB: 30,
    hero: "KhJc", potBB: 32, actions: ["3 kişi kaldı: lider 50 BB, sen 30 BB, üçüncü 6 BB", "BTN (6 BB) fold", "Lider SB'den all-in (geniş bir aralıkla, seni kapsıyor)"],
    options: ["Fold", "Call (29 BB daha)"], correct: 0, topic: "icm", level: 3,
    reasoning: "Kaybedersen 6 BB'lik oyuncunun arkasında üçüncü olursun; fold edersen ikinciliğe çok yakınsın. Bu ödül sıçraması yüzünden call için chip hesabının gerektirdiğinden belirgin biçimde fazla equity gerekir (risk primi). KJo geniş bir aralığa karşı yarı yarıya civarındadır; bu yetmez. Lider de bunu bildiği için geniş itiyor.",
  },
  {
    id: "t17", title: "Satellite bubble'ında QQ", game: "turnuva", street: "preflop", heroPos: "BB", stackBB: 40,
    hero: "QsQh", potBB: 42, actions: ["Satellite: 5 bilet var, 6 oyuncu kaldı", "İki oyuncunun 2'şer BB'si var; sen 40 BB ile ikincisin", "Chip lideri all-in (seni kapsıyor)"],
    options: ["Fold", "Call"], correct: 0, topic: "icm", level: 3,
    reasoning: "Satellite'te birinci olmakla beşinci olmak aynı ödülü verir: bilet. Fold edersen bileti neredeyse garanti alırsın; call edip kaybedersen (QQ ile bile 5 elden 1'inde ya da daha sık olur) her şeyi yitirirsin, kazanırsan ise ek bir şey kazanmazsın. Bu, ICM'in en uç örneğidir: çok güçlü el bile fold olabilir.",
  },
  {
    id: "t22", title: "Bubble'da kısa stack'in all-in'i", game: "turnuva", street: "preflop", heroPos: "BB", stackBB: 4,
    hero: "Th7d", potBB: 6.5, actions: ["Ödüle 1 kişi kaldı; senin 50 BB'n var", "UTG 4 BB all-in, diğerleri fold"],
    options: ["Fold", "Call (3 BB daha)"], correct: 1, topic: "icm", level: 2,
    reasoning: "9.5 BB'lik toplam pota 3 BB ödüyorsun: yaklaşık %32 equity yetiyor ve T7o çoğu push aralığına karşı bunu sağlar. Kaybetsen stack'inin yalnızca %6'sı gider, yani ICM baskısı senin için çok düşük. Büyük stack, kısa stack'in all-in'ini iyi fiyata gördüğünde hem chip hem de bubble'ı bitirme şansı kazanır.",
  },

  // ───────────── TURNUVA · DİĞER ─────────────
  {
    id: "t14", title: "Turnuvanın başında 66", game: "turnuva", street: "preflop", heroPos: "BTN", stackBB: 150,
    hero: "6d6c", potBB: 4, actions: ["İlk seviye, stack'ler 150 BB", "UTG 2.5 BB açtı, diğerleri fold"],
    options: ["Fold", "Call", "3-bet 8 BB"], correct: 1, topic: "odds", level: 1,
    reasoning: "Turnuvanın başında stack'ler derindir ve ICM baskısı yok denecek kadar azdır; oyun cash game'e benzer. 66 ile pozisyonda call, set tuttuğunda büyük pot kazanma şansı verir (implied odds). 3-bet ise UTG'nin güçlü aralığına karşı elini blöfe çevirir.",
  },
  {
    id: "t15", title: "20 BB ile top pair: c-bet boyutu", game: "turnuva", street: "flop", heroPos: "BTN", stackBB: 18,
    hero: "AdQs", board: "Qh8c4d", potBB: 5.5, actions: ["Sen BTN'den 2 BB açtın (20 BB), BB call etti", "Flop: Q♥ 8♣ 4♦", "BB check"],
    options: ["Check", "1/3 pot bahis (≈1.8 BB)", "All-in (18 BB)"], correct: 1, topic: "cbet", level: 2,
    reasoning: "Elin çok güçlü ve SPR yaklaşık 3; hedefin stack'leri ortaya getirmek. All-in yalnızca seni yenen ellerin ya da güçlü dam'ların göreceği bir boyut olur, zayıf elleri kaçırır. Küçük bahis, BB'nin 8'li per ve as yüksek gibi elleriyle devam etmesine izin verir; kalan chip'ler turn ve river'da rahatça girer.",
  },
  {
    id: "t20", title: "BB'de 96 suited: ante'li min-raise", game: "turnuva", street: "preflop", heroPos: "BB", stackBB: 40,
    hero: "9h6h", potBB: 4.5, actions: ["Ante var (toplam 1 BB)", "CO 2 BB açtı, diğerleri fold"],
    options: ["Fold", "Call (1 BB daha)", "3-bet 7 BB"], correct: 1, topic: "savunma", level: 1,
    reasoning: "4.5 BB'lik pota yalnızca 1 BB ödüyorsun: gereken equity %18 civarı. Ante ve küçük açılış boyutu, BB'ye çok iyi fiyat verir; 96s gibi oynanabilir eller bu fiyata rahatça savunulur. Flop'u iyi yakalamazsan eli ucuza bırakırsın.",
  },
  {
    id: "t23", title: "30 BB ile top pair'de turn kararı", game: "turnuva", street: "turn", heroPos: "BB", stackBB: 24,
    hero: "KdTd", board: "Kc7h4s9s", potBB: 13, actions: ["CO 2.2 BB açtı, sen BB'den call ettin (30 BB)", "Flop K♣ 7♥ 4♠: check, CO 2 BB bahis, sen call", "Turn: 9♠; sen check, CO 4 BB bahis yaptı"],
    options: ["Fold", "Call (4 BB)", "All-in (24 BB)"], correct: 1, topic: "spr", level: 3,
    reasoning: "Top pair'in iyi ama kicker'ın orta; rakibin value aralığında AK, KQ, KJ de var. Call ile blöflerini ve daha zayıf ellerini oyunda tutarsın. All-in atarsan zayıf eller fold eder, çoğunlukla seni yenen eller görür. 13 BB'lik pota 4 BB iyi bir fiyat; river'da duruma göre yeniden değerlendirirsin.",
  },
  {
    id: "t24", title: "Ante'li potta butondan çalma", game: "turnuva", street: "preflop", heroPos: "BTN", stackBB: 35,
    hero: "Jd8d", potBB: 2.5, actions: ["Ante var; herkes fold etti", "Blind'lardaki oyuncular sıkı oynuyor"],
    options: ["Fold", "2.1 BB'ye aç", "All-in"], correct: 1, topic: "acilis", level: 1,
    reasoning: "Ante'ler potu 1.5 BB yerine 2.5 BB yapar; küçük bir açılışın kâra geçmesi için blind'ların her zamankinden daha az fold etmesi yeter. Sıkı blind'lara karşı J8s gibi oynanabilir eller butondan rahatça açılır. Bu, turnuvada stack'i ayakta tutan en temel hamledir.",
  },
];

export const HAND_BY_ID = new Map(HANDS.map((h) => [h.id, h]));

export type StackBucket = "0-20" | "21-50" | "51-100" | "100+";
export const STACK_BUCKETS: Record<StackBucket, string> = {
  "0-20": "20 BB ve altı",
  "21-50": "21–50 BB",
  "51-100": "51–100 BB",
  "100+": "100 BB üstü",
};
export function stackBucket(bb: number): StackBucket {
  if (bb <= 20) return "0-20";
  if (bb <= 50) return "21-50";
  if (bb <= 100) return "51-100";
  return "100+";
}

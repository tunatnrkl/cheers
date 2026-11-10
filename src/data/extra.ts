// Elle yazılmış ek spotlar (düzenli olarak genişletilir). Doğruluk testi: src/lib/poker/hands.test.ts
import type { Hand } from "./hands";

export const EXTRA: Hand[] = [
  {
    id: "x001", title: "HJ'de K J suited", game: "cash", street: "preflop", heroPos: "HJ", stackBB: 100,
    hero: "KhJh", potBB: 1.5, seq: ["UTG f"],
    options: ["Fold", "Limp (1 BB)", "2.5 BB aç"], correct: 2, topic: "acilis", level: 1,
    reasoning: "KJs, HJ'den açılış aralığının rahat içinde kalır: suited olduğu için floş potansiyeli taşır ve iki iyi kartla top pair yapabilir. Limp inisiyatifi bırakır, fold ise kârlı bir eli çöpe atar. Standart 2,5 BB açılış doğru.",
  },
  {
    id: "x002", title: "BB'de Q9 suited, buton açtı", game: "cash", street: "preflop", heroPos: "BB", stackBB: 100,
    hero: "Qd9d", potBB: 4, seq: ["BTN r2.5", "SB f"],
    options: ["Fold", "Call (1,5 BB daha)", "3-bet 11 BB"], correct: 1, topic: "savunma", level: 1,
    reasoning: "4 BB'lik pota 1,5 BB ödüyorsun; yaklaşık %27 equity yeter. Butonun geniş aralığına karşı Q9s bu eşiği rahat geçer ve floş ile kent şansı taşır. Fold fazla sıkı, 3-bet ise zayıf bir eli şişirir.",
  },
  {
    id: "x003", title: "SB'de AA, buton açtı", game: "cash", street: "preflop", heroPos: "SB", stackBB: 100,
    hero: "AsAd", potBB: 4, seq: ["BTN r2.5"],
    options: ["Fold", "Call", "3-bet 11 BB"], correct: 2, topic: "3bet", level: 1,
    reasoning: "En güçlü elinle pozisyon dışında pot büyütmek istersin; call etmek BB'ye ucuz fiyat verir ve potu küçük tutar. 3-bet ile butonun 3-bet'e karşı devam eden geniş aralığından value alırsın. SB'den boyut büyük tutulur.",
  },
  {
    id: "x004", title: "UTG açtı, BB'de A5 offsuit", game: "cash", street: "preflop", heroPos: "BB", stackBB: 100,
    hero: "Ac5d", potBB: 4, seq: ["UTG r2.5"],
    options: ["Fold", "Call (1,5 BB daha)", "3-bet 11 BB"], correct: 0, topic: "savunma", level: 1,
    reasoning: "UTG'nin aralığı güçlüdür: AK, AQ, AJ gibi eller A5o'yu domine eder. Fiyat iyi görünse de pozisyon dışında, zayıf kicker'la oynamak kötü sonuçlanır. Erken pozisyon açılışına karşı bu el fold.",
  },
  {
    id: "x005", title: "Kuru flop'ta AK suited ile c-bet", game: "cash", street: "flop", heroPos: "BTN", stackBB: 100,
    hero: "AhKh", board: "9c5d2s", potBB: 5.5, seq: ["BTN r2.5", "SB f", "BB c", "F 9c5d2s", "BB x"],
    options: ["Check", "1/3 pot bahis (≈1,8 BB)", "Pot bahsi (5,5 BB)"], correct: 1, topic: "cbet", level: 2,
    reasoning: "Kuru bir board'da pozisyonlu preflop agresör olarak range avantajın büyük. Küçük bir bahis ucuza çalışır: rakibin zayıf ellerini fold ettirir, overcard ve backdoor floş ile equity'ni korur. Büyük bahis gereksiz risk, check ise range avantajını boşa harcar.",
  },
  {
    id: "x006", title: "River'da set: ince değil, büyük bahis", game: "cash", street: "river", heroPos: "BTN", stackBB: 100,
    hero: "KhKd", board: "Ks8d3cJh2s", potBB: 25.5, seq: ["BTN r2.5", "SB f", "BB c", "F Ks8d3c", "BB x", "BTN b3", "BB c", "T Jh", "BB x", "BTN b7", "BB c", "R 2s", "BB x"],
    note: "Rakip call etmeyi seven, nadiren blöf yapan bir oyuncu.",
    options: ["Check", "2/3 pot bahis (≈17 BB)", "1/10 pot bahis (2 BB)"], correct: 1, topic: "value", level: 2,
    reasoning: "Seti river'da check etmek value'yu çöpe atmaktır. Call eden bir rakip top pair ve zayıf per'lerle büyük bahsi de görür; küçük bahis ise bu eller için gereğinden ucuz kalır. İki üçte bir pot, değer elinde iyi bir denge.",
  },
  {
    id: "x007", title: "Nut floş çekişi: call mı?", game: "cash", street: "flop", heroPos: "BB", stackBB: 100,
    hero: "AhJh", board: "Kh7h2c", potBB: 9, seq: ["BTN r2.5", "SB f", "BB c", "F Kh7h2c", "BB x", "BTN b3.5"],
    options: ["Fold", "Call (3,5 BB)", "All-in"], correct: 1, topic: "odds", level: 1,
    reasoning: "9 BB'lik pota 3,5 BB ödüyorsun: gereken equity %28. Nut floş çekişin tek kartla ~%19, iki kartla ~%35 tamamlanır ve as da çoğu zaman out sayılabilir. Üstelik tamamlarsan en yüksek floşa sahip olursun, implied odds fazladır. Call açıkça kârlı.",
  },
  {
    id: "x008", title: "Gutshot ile pot bahsine karşı turn", game: "cash", street: "turn", heroPos: "BB", stackBB: 100,
    hero: "JcTd", board: "Qd8s3h2c", potBB: 25, seq: ["BTN r2.5", "SB f", "BB c", "F Qd8s3h", "BB x", "BTN b3.5", "BB c", "T 2c", "BB x", "BTN b12.5"],
    options: ["Fold", "Call (12,5 BB)"], correct: 0, topic: "odds", level: 2,
    reasoning: "25 BB'lik pota 12,5 BB ödüyorsun, gereken equity %33. Gutshot'un yalnızca 4 out'u (dokuzlar) var; river'da ~%9. Implied odds'la bile bu fark kapanmaz. Fold doğru.",
  },
  {
    id: "x009", title: "3-bet potunda A72 board'u", game: "cash", street: "flop", heroPos: "BTN", stackBB: 100,
    hero: "KhQh", board: "As7d2c", potBB: 17.5, seq: ["CO r2.5", "BTN r8", "SB f", "BB f", "CO c", "F As7d2c", "CO x"],
    options: ["Check", "1/3 pot bahis (≈6 BB)", "3/4 pot bahis (≈13 BB)"], correct: 1, topic: "cbet", level: 2,
    reasoning: "Asa'lı kuru board 3-bet atan oyuncunun range'ine çok uyar: AK, AA, AQ ona ait. Küçük c-bet, tüm range'inle ucuza bahis açmana izin verir ve KQ gibi elini equity ile korur. Büyük bahis, seni yalnızca daha iyi ellerin call ettiği bir boyuta iter.",
  },
  {
    id: "x010", title: "Islak board'da set: büyük bahis", game: "cash", street: "flop", heroPos: "BTN", stackBB: 100,
    hero: "8h8d", board: "8c7c2s", potBB: 5.5, seq: ["BTN r2.5", "SB f", "BB c", "F 8c7c2s", "BB x"],
    options: ["Check (slowplay)", "1/4 pot bahis (≈1,4 BB)", "2/3 pot bahis (≈3,7 BB)"], correct: 2, topic: "value", level: 2,
    reasoning: "İki kulüp ve bağlantılı kartlar içeren islak board'da yavaş oynamak, rakibe ucuz turn ve river kartı verir. Seti korumak ve floş çekişlerinden fiyat almak için büyük bahis gerekir. Güçlü elde pot'u şimdi büyüt.",
  },
  {
    id: "x011", title: "River'da küçük bahse karşı bluff catcher", game: "cash", street: "river", heroPos: "BB", stackBB: 100,
    hero: "KcJd", board: "Kd8s4c2h9d", potBB: 14.5, seq: ["BTN r2.5", "SB f", "BB c", "F Kd8s4c", "BB x", "BTN b3", "BB c", "T 2h", "BB x", "BTN x", "R 9d", "BB x", "BTN b3"],
    options: ["Fold", "Call (3 BB)"], correct: 1, topic: "blof", level: 2,
    reasoning: "14,5 BB'lik pota (bahis dahil) 3 BB ödüyorsun: gereken equity yalnızca ~%17 (3 / 17,5). Turn'de check eden ve river'da küçük bahis atan rakibin aralığında zayıf value ve blöf var; K ile top pair bu aralığın büyük kısmını yener. Bu fiyatta fold etmek kârlı bir bluff catcher'ı atmak olur.",
  },
  {
    id: "x012", title: "Turnuvada 25 BB ile A5 suited butondan", game: "turnuva", street: "preflop", heroPos: "BTN", stackBB: 25,
    hero: "As5s", potBB: 2.5, seq: ["UTG f", "HJ f", "CO f"], ante: 1,
    options: ["Fold", "2,1 BB'ye aç", "All-in"], correct: 1, topic: "acilis", level: 1,
    reasoning: "Ante'li potta buton açılışı, 2,5 BB'lik ölü paraya karşı çok kârlıdır. A5s as blocker'ı, floş ve wheel potansiyeli ile iyi bir açılış elidir. 25 BB'de all-in gereksizdir: zayıf elleri fold ettirir, yalnızca güçlü ellerin call ettiği bir riske girersin.",
  },
];

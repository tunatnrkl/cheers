// ÖRNEK müfredat: yalnızca geliştirme ve test içindir (/ogren?ornek=1).
// Gerçek içerik src/data/mufredat.json dosyasındadır; bu dosya onun yerine geçmez.
// Her pistte 2 ünite (o1 ortak), ünite başına 3 dolu ders + 1 iskelet ders (c5, t1),
// kontrol, isteğe bağlı tekrar ve seviye testi. Yedi alıştırma tipinin hepsi yer alır.
// Sayılar: kombinasyon ve pot odds aritmetiği elle doğrulanabilir; aralık soruları
// src/data/ranges.json ile tutarlıdır ve "doğrulama gerekli" işaretlidir.
import type { Alistirma, AlistirmaTipi, Ders, Mufredat, Unite } from "@/lib/mufredat/tipler";

type Ek = Partial<Omit<Alistirma, "kimlik" | "tip" | "zorluk" | "soru" | "neden" | "yanilgi">>;
const a = (kimlik: string, tip: AlistirmaTipi, zorluk: number, soru: string, ek: Ek, neden: string, yanilgi: string): Alistirma => ({
  kimlik,
  tip,
  zorluk,
  soru,
  dogrulamaGerekli: false,
  ...ek,
  neden,
  yanilgi,
});

const ders = (kimlik: string, baslik: string, onkosul: string[], d: Partial<Ders> & Pick<Ders, "kazanimlar" | "anlatim" | "alistirmalar">): Ders => ({
  kimlik,
  baslik,
  tur: "ders",
  onkosul,
  sureDk: 5,
  terimler: [],
  ustalik: { son: 8, oran: 0.8 },
  hedefAlistirma: d.alistirmalar.length,
  durum: "dolu",
  ...d,
});

const iskelet = (kimlik: string, baslik: string, onkosul: string[], kazanim: string): Ders => ({
  kimlik,
  baslik,
  tur: "ders",
  onkosul,
  kazanimlar: [kazanim],
  sureDk: 5,
  anlatim: [],
  terimler: [],
  ustalik: { son: 10, oran: 0.8 },
  hedefAlistirma: 10,
  durum: "iskelet",
  alistirmalar: [],
});

/** Ünitenin derslerinden örnekleyerek kontrol ya da test soruları üretir (kimlikler yeniden verilir). */
const ornekle = (dersler: Ders[], siralar: number[], on: string): Alistirma[] =>
  dersler
    .flatMap((d) => siralar.map((i) => d.alistirmalar[i]).filter(Boolean))
    .sort((x, y) => x.zorluk - y.zorluk)
    .map((x, i) => ({ ...x, kimlik: `${on}${i + 1}` }));

function unite(kimlik: string, baslik: string, seviye: number, renk: string, ozet: string, dersler: Ders[], kapsam: "ortak" | "pist"): Unite {
  const dolu = dersler.filter((d) => d.durum === "dolu");
  const son = dersler.at(-1)!.kimlik;
  const kontrol: Ders = {
    kimlik: `${kimlik}-k`,
    baslik: `Kontrol: ${baslik}`,
    tur: "kontrol",
    onkosul: [son],
    kazanimlar: [`"${baslik}" ünitesinin kazanımlarını karışık sorularda uygular.`],
    sureDk: 6,
    anlatim: [],
    terimler: [],
    ustalik: { son: 9, oran: 0.8 },
    hedefAlistirma: 9,
    durum: "dolu",
    alistirmalar: ornekle(dolu, [1, 3, 5], "k"),
  };
  const tekrar: Ders = {
    kimlik: `${kimlik}-r`,
    baslik: `Tekrar: ${baslik}`,
    tur: "tekrar",
    onkosul: [kontrol.kimlik],
    zorunlu: false,
    kazanimlar: ["Ünitede zayıf kalan kazanımları yeniden çalışır; sorular geçmiş hatalardan seçilir."],
    sureDk: 4,
    anlatim: [],
    terimler: [],
    ustalik: { son: 8, oran: 0.75 },
    hedefAlistirma: 8,
    durum: "iskelet",
    alistirmalar: [],
  };
  const test: Ders = {
    kimlik: `${kimlik}-t`,
    baslik: `Seviye testi: ${baslik}`,
    tur: "test",
    onkosul: [kontrol.kimlik],
    kapsam,
    kazanimlar: ["Buraya kadarki konuları bildiğini gösterir; geçilirse kapsamındaki dersler açılır."],
    sureDk: 8,
    anlatim: [],
    terimler: [],
    ustalik: { son: 12, oran: 0.85 },
    hedefAlistirma: 12,
    durum: "dolu",
    alistirmalar: ornekle(dolu, [0, 2, 4, 6], "t"),
  };
  return { kimlik, baslik, seviye, renk, ozet, dersler: [...dersler, kontrol, tekrar, test] };
}

const CIFTLER = ["AA", "KK", "QQ", "JJ", "TT", "99", "88", "77", "66", "55", "44", "33", "22"];
const SUITED_ASLAR = ["AKs", "AQs", "AJs", "ATs", "A9s", "A8s", "A7s", "A6s", "A5s", "A4s", "A3s", "A2s"];
const ACILIS = ["Fold", "Limp (1 BB)", "2,5 BB aç"];

// ───────────── o1: Kartlar ve eller (ortak) ─────────────
const o1 = unite(
  "o1",
  "Kartlar ve eller",
  1,
  "#F6EBD0",
  "Deste, el sıralaması ve en iyi beş kart.",
  [
    ders("o1-d1", "Deste ve kartlar", [], {
      kazanimlar: ["52 kartı, dört rengi ve 13 değeri tanır.", "Kart yazımını okur: Ah, Td, 9c."],
      sureDk: 4,
      terimler: ["Board"],
      anlatim: [
        "Texas Hold'em 52 kartlık tek desteyle oynanır. Destede dört renk vardır: maça (♠), kupa (♥), karo (♦) ve sinek (♣). Renklerin birbirine üstünlüğü yoktur.",
        "Her renkte 13 değer bulunur: 2'den 10'a sayılar, sonra vale (J), kız (Q), papaz (K) ve as (A). En düşük kart 2, en yüksek kart astır. As, A-2-3-4-5 kentinde en düşük kart olarak da kullanılabilir.",
        "Kartlar iki harfle yazılır: önce değer, sonra renk. 10 için T kullanılır; renkler s (maça), h (kupa), d (karo), c (sinek) ile gösterilir. Ah kupa ası, Td karo onlusu demektir.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "Bir destede kaç kart vardır?", { secenekler: ["32", "48", "52", "54"], dogru: 2 }, "Dört renk, her renkte 13 kart: 4 × 13 = 52. Jokerler oyunda yoktur.", "Jokerleri sayıp 54 demek. Hold'em'de joker kullanılmaz."),
        a("a2", "dogruYanlis", 1, "Hold'em'de maça, kupadan daha değerlidir.", { dogru: false }, "Renkler eşittir; iki floş karşılaşırsa kartların değerine bakılır.", "Başka kart oyunlarındaki renk sıralamasını Hold'em'e taşımak."),
        a("a3", "sayi", 1, "Her renkte kaç kart vardır?", { dogru: 13, tolerans: 0, birim: "kart" }, "2'den 10'a dokuz sayı, sonra J, Q, K, A: toplam 13.", "Ası iki kez saymak ya da 10'u unutmak."),
        a("a4", "eslestirme", 2, "Simgeyi renk adıyla eşleştir.", { secenekler: [["♠", "Maça"], ["♥", "Kupa"], ["♦", "Karo"], ["♣", "Sinek"]] }, "Maça ♠, kupa ♥, karo ♦, sinek ♣. Yazımda sırasıyla s, h, d, c harfleri kullanılır.", "Maça ile sineği karıştırmak: ikisi de siyahtır, sinek üç yapraklıdır."),
        a("a5", "siralama", 2, "Kartları düşükten yükseğe sırala.", { secenekler: ["9", "T", "J", "Q", "K", "A"] }, "9, 10 (T), vale (J), kız (Q), papaz (K), as (A).", "Kızı papazın üstüne koymak. Papaz (K) kızdan (Q) yüksektir."),
        a("a6", "secmeli", 2, "\"Td\" hangi karttır?", { secenekler: ["Karo onlusu", "Kupa onlusu", "Karo ikilisi", "Sinek onlusu"], dogru: 0 }, "T onluyu, d karoyu (diamonds) gösterir.", "T'yi 2 (two) sanmak. İkili \"2\" ile yazılır."),
        a("a7", "dogruYanlis", 3, "As, A-2-3-4-5 kentinde en düşük kart olarak kullanılabilir.", { dogru: true }, "As iki uçta da kent kurar: A-2-3-4-5 ve T-J-Q-K-A.", "Kentin astan \"dönebileceğini\" sanmak. Q-K-A-2-3 kent değildir."),
        a("a8", "sayi", 3, "Destede kaç tane as vardır?", { dogru: 4, tolerans: 0, birim: "as" }, "Her renkten bir as: dört renk, dört as.", "13 değerle karıştırmak. Her değerden dört kart vardır."),
      ],
    }),
    ders("o1-d2", "El sıralaması", ["o1-d1"], {
      kazanimlar: ["Elleri yüksek karttan kareye doğru sıralar.", "Kent, floş ve full house'u birbirinden ayırır."],
      sureDk: 5,
      terimler: ["Showdown", "İki per"],
      anlatim: [
        "Poker eli beş karttan oluşur. Zayıftan güçlüye: yüksek kart, per, iki per, üçlü, kent, floş, full house, kare, sıralı floş. En güçlü sıralı floş (T-J-Q-K-A, aynı renk) royal flush diye anılır.",
        "Kent, renkleri farklı olabilen sıralı beş karttır. Floş, sırası önemsiz aynı renkten beş karttır. Floş kenti yener, çünkü daha seyrek gelir.",
        "Full house bir üçlü ve bir perden oluşur; floşu yener. Kare aynı değerden dört karttır ve full house'un da üstündedir.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "Hangisi daha güçlüdür?", { secenekler: ["Per", "İki per", "Yüksek kart"], dogru: 1 }, "İki per, tek peri de yüksek kartı da yener.", "Yüksek bir peri (as peri gibi) iki perden güçlü sanmak."),
        a("a2", "dogruYanlis", 1, "Floş, kentten güçlüdür.", { dogru: true }, "Floş daha seyrek gelir ve sıralamada kentin üstündedir.", "Sıralı kartları daha \"zor\" görüp kenti üste koymak."),
        a("a3", "siralama", 2, "Elleri zayıftan güçlüye sırala.", { secenekler: ["Yüksek kart", "Per", "İki per", "Üçlü", "Kent", "Floş", "Full house", "Kare"] }, "Sıra, ellerin gelme sıklığını izler: seyrek gelen el daha güçlüdür.", "Üçlüyü kentin, kenti floşun üstüne koymak."),
        a("a4", "eslestirme", 2, "Eli tanımıyla eşleştir.", { secenekler: [["Kent", "Sıralı beş kart, renkler farklı olabilir"], ["Floş", "Aynı renkten beş kart"], ["Full house", "Bir üçlü ve bir per"], ["Kare", "Aynı değerden dört kart"]] }, "Kentte sıra, floşta renk aranır; full house üçlü ile perin birleşimidir.", "Kent ile floşu karıştırmak: biri sıraya, öteki renge bakar."),
        a("a5", "secmeli", 2, "A♠ K♠ Q♠ J♠ T♠ elinin adı nedir?", { secenekler: ["Royal flush", "Kare", "Full house", "Kent"], dogru: 0 }, "Aynı renkten T-J-Q-K-A, en yüksek sıralı floştur.", "Yalnızca sıraya bakıp \"kent\" demek. Renk de aynıysa el sıralı floştur."),
        a("a6", "dogruYanlis", 3, "Full house, floşu yener.", { dogru: true }, "Sıralamada full house floşun bir üstündedir.", "Beş kartın aynı renkten olmasını daha değerli sanmak."),
        a("a7", "secmeli", 3, "Elinde 7♥ 7♦ var. Board: K♣ 7♠ 2♦ 9♥ 3♣. Elin nedir?", { secenekler: ["Per", "Üçlü", "İki per", "Full house"], dogru: 1 }, "Elindeki iki yedili board'daki 7♠ ile üçlü yapar. Board'da başka çift yok, full house olmaz.", "Elindeki peri sayıp board'daki üçüncü yediliyi gözden kaçırmak."),
        a("a8", "secmeli", 3, "Flop: 5♠ 6♦ 7♣. Elinde 8♥ 9♥ var. Elin nedir?", { secenekler: ["Kent", "Floş", "Yüksek kart", "Per"], dogru: 0 }, "5-6-7-8-9 sıralı beş karttır: kent.", "Elindeki iki kupaya bakıp floş demek. Floş için aynı renkten beş kart gerekir."),
      ],
    }),
    ders("o1-d3", "En iyi beş kart ve kicker", ["o1-d2"], {
      kazanimlar: ["Yedi karttan en iyi beşliyi seçer.", "Kicker'ın eşit elleri nasıl ayırdığını açıklar."],
      sureDk: 5,
      terimler: ["Kicker", "Board", "Showdown"],
      anlatim: [
        "River'dan sonra önünde yedi kart olur: iki kapalı kartın ve beş ortak kart. Elin, bu yedi karttan kurulabilen en iyi beşliktir. İki kapalı kartını, birini ya da hiçbirini kullanabilirsin.",
        "İki oyuncunun eli aynı türdeyse (ikisinde de as peri gibi) kalan yan kartlara bakılır. Bu yan karta kicker denir; yüksek kicker kazanır.",
        "Beş kart da eşitse pot bölünür. En iyi beşlik tamamen ortak kartlardan oluşuyorsa \"board'u oynuyorsun\" denir.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "Showdown'da elin kaç karttan oluşur?", { secenekler: ["İki", "Beş", "Yedi"], dogru: 1 }, "Yedi kart arasından en iyi beşi seçilir; el her zaman beş karttır.", "Yedi kartın hepsini saymak. Altıncı ve yedinci kart hiçbir zaman hesaba girmez."),
        a("a2", "sayi", 1, "River'dan sonra, kapalı kartların dahil, toplam kaç kart arasından seçim yaparsın?", { dogru: 7, tolerans: 0, birim: "kart" }, "İki kapalı kart ve beş ortak kart: 2 + 5 = 7.", "Yalnızca ortak kartları (5) saymak."),
        a("a3", "dogruYanlis", 2, "En iyi beş kartı kurarken iki kapalı kartını da kullanmak zorundasın.", { dogru: false }, "Hold'em'de ikisini, birini ya da hiçbirini kullanabilirsin.", "Omaha kuralıyla karıştırmak; orada tam iki kapalı kart kullanılır."),
        a("a4", "secmeli", 2, "İki oyuncuda da as peri var. Kazananı ne belirler?", { secenekler: ["Kicker (yan kart)", "Kartların rengi", "Kimin önce bahis yaptığı"], dogru: 0 }, "Per eşitse sırayla yan kartlar karşılaştırılır; yüksek olan kazanır.", "Rengin eşitliği bozduğunu sanmak. Hold'em'de renk üstünlüğü yoktur."),
        a("a5", "secmeli", 3, "Board: A♣ J♦ 8♠ 5♥ 3♦. Bir oyuncuda as-papaz, diğerinde as-dokuz var. Kim kazanır?", { secenekler: ["As-papaz", "As-dokuz", "Pot bölünür"], dogru: 0 }, "İkisinde de as peri var. Beşlikler: A-A-K-J-8 ve A-A-J-9-8. Papaz kicker kazanır.", "\"İkisinde de as peri var\" deyip potu bölmek. Kicker'a bakılır."),
        a("a6", "dogruYanlis", 3, "En iyi beşliğin tamamen ortak kartlardan oluşuyorsa ve rakip de aynı durumdaysa pot bölünür.", { dogru: true }, "İki oyuncu da board'u oynuyorsa beşlikler aynıdır; pot paylaşılır.", "Kapalı kartların her zaman hesaba girdiğini sanmak."),
        a("a7", "secmeli", 4, "Board: K♠ K♦ 7♣ 7♥ A♠. Bir oyuncuda kız-vale, diğerinde beşli-dörtlü var. Sonuç?", { secenekler: ["Kız-vale kazanır", "Beşli-dörtlü kazanır", "Pot bölünür"], dogru: 2 }, "İki oyuncunun da en iyi beşliği board'dur: K-K-7-7-A. Kapalı kartlar oyuna girmez.", "Yüksek kapalı kartların kicker olacağını sanmak. Board'daki as zaten en yüksek kicker."),
        a("a8", "sayi", 4, "Elinde A♥ 4♥ var. Board: K♥ 9♥ 2♥ 9♠ J♦. En iyi beşliğinde kendi kartlarından kaç tanesi yer alır?", { dogru: 2, tolerans: 0, birim: "kart" }, "En iyi elin floş: A♥ K♥ 9♥ 4♥ 2♥. İki kapalı kartın da beşliğin içinde.", "Dokuzlu perine takılıp floşu görmemek."),
      ],
    }),
  ],
  "ortak",
);

// ───────────── c5: Preflop temelleri (cash) ─────────────
const c5 = unite(
  "c5",
  "Preflop temelleri",
  3,
  "#E0A526",
  "Pozisyonlar, el gösterimi ve pot odds.",
  [
    ders("c5-d1", "Pozisyonlar ve ilk açılış", ["o1-k"], {
      kazanimlar: ["Altı pozisyonu ve konuşma sırasını sayar.", "Geç pozisyonda aralığın neden genişlediğini açıklar.", "Herkes fold ettiğinde açılış kararını verir."],
      sureDk: 6,
      terimler: ["Pozisyon", "BTN (Buton)", "Open (açılış)"],
      anlatim: [
        "Altı kişilik masada pozisyonlar sırasıyla UTG, HJ, CO, BTN, SB ve BB'dir. Preflop ilk UTG konuşur, en son BB. Flop'tan sonra ilk SB, en son buton (BTN) konuşur.",
        "Ne kadar geç konuşursan arkanda o kadar az oyuncu kalır ve sonraki sokaklarda rakiplerini görerek karar verirsin. Bu yüzden açılış aralığı UTG'de dar, butonda geniştir.",
        "Bu müfredatın varsayımı: cash oyununda açılış 2,5 BB'dir. Limp (yalnızca 1 BB'yi görmek) inisiyatifi rakibe bırakır; açacaksan raise ile aç.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "Altı kişilik masada preflop ilk konuşan pozisyon hangisidir?", { secenekler: ["UTG", "BTN", "BB", "SB"], dogru: 0 }, "UTG, büyük blind'ın solundaki oyuncudur ve preflop ilk kararı o verir.", "SB'yi ilk konuşan sanmak. SB flop'tan sonra ilk konuşur, preflop değil."),
        a("a2", "dogruYanlis", 1, "Buton, flop'tan sonraki her sokakta son konuşur.", { dogru: true }, "Flop, turn ve river'da buton en son konuşur; herkesin hamlesini görür.", "Preflop sırasını flop sonrasına taşımak. Preflop son konuşan BB'dir."),
        a("a3", "eslestirme", 2, "Pozisyonu özelliğiyle eşleştir.", { secenekler: [["UTG", "Preflop ilk konuşur"], ["BTN", "Flop'tan sonra son konuşur"], ["SB", "Yarım BB zorunlu bahis koyar"], ["BB", "Preflop en son konuşur"]] }, "UTG ilk, BB son konuşur; SB yarım, BB tam blind koyar; buton flop'tan sonra son sözü söyler.", "SB ile BB'nin zorunlu bahislerini karıştırmak."),
        a("a4", "siralama", 2, "Pozisyonları preflop konuşma sırasına diz.", { secenekler: ["UTG", "HJ", "CO", "BTN", "SB", "BB"] }, "Saat yönünde: UTG, HJ, CO, BTN, sonra blind'lar.", "Blind'ları başa almak. Blind'lar preflop en son konuşur."),
        a("a5", "sayi", 2, "Altı kişilik masada UTG açarken arkasında konuşacak kaç oyuncu vardır?", { dogru: 5, tolerans: 0, birim: "oyuncu" }, "HJ, CO, BTN, SB ve BB: beş oyuncu.", "Blind'ları saymamak. Onlar da henüz konuşmadı."),
        a("a6", "secmeli", 3, "Herkes fold ettiğinde hangi pozisyon en geniş aralıkla açar?", { secenekler: ["UTG", "HJ", "CO", "BTN"], dogru: 3 }, "Butonun arkasında yalnızca iki blind vardır ve flop'tan sonra hep son konuşur.", "İlk konuşanın en çok eli oynadığını sanmak; tersine, en dar aralık UTG'dedir."),
        a("a7", "range", 3, "Bütün cep çiftlerini işaretle (22'den AA'ya).", { dogru: CIFTLER }, "Cep çiftleri matrisin köşegenindedir: 13 el tipi.", "Suited elleri çift sanmak. Çiftte iki kartın değeri aynıdır: 77, QQ."),
        a("a8", "spot", 3, "Butondasın, herkes sana kadar fold etti. Hamlen?", {
          secenekler: ["Fold", "2,5 BB aç", "3 BB aç"],
          dogru: 1,
          kabulEdilebilir: [2],
          spot: { oyun: "cash", oyuncuSayisi: 6, stackBB: 100, heroPoz: "BTN", heroEl: "AsJs", aksiyonlar: [], rakipAraligi: "Blind'lar henüz konuşmadı; herhangi iki kartla olabilirler." },
        }, "AJ suited butondan açılır: yalnızca iki blind'ı geçmen gerekir ve pozisyon sende. Müfredatın açılış boyutu 2,5 BB'dir; 3 BB de aynı kararın başka boyutudur.", "Güçlü eli \"saklamak\" için fold ya da limp düşünmek. Açmak hem blind'ları kazanır hem inisiyatifi alır."),
      ],
    }),
    ders("c5-d2", "El gösterimi ve kombinasyonlar", ["c5-d1"], {
      kazanimlar: ["AKs, AKo ve 77 yazımını okur.", "Çift, suited ve offsuit ellerin kombinasyon sayısını bilir."],
      sureDk: 6,
      terimler: ["Suited", "Offsuit", "Kombinasyon (combo)"],
      anlatim: [
        "Başlangıç elleri kısaca yazılır: iki kartın değeri, sonra s (suited, aynı renk) ya da o (offsuit, farklı renk). AKs aynı renkten as-papaz, QJo farklı renkten kız-valedir. Çiftlerde harf olmaz: 77.",
        "Her el tipi birden çok kombinasyonla gelir. Bir çift 6, suited bir el 4, offsuit bir el 12 kombinasyondur. Toplam 1.326 kombinasyon vardır.",
        "Range matrisinde köşegen çiftleri, sağ üst üçgen suited elleri, sol alt üçgen offsuit elleri gösterir.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "\"AKs\" ne demektir?", { secenekler: ["As-papaz, aynı renkten", "As-papaz, farklı renkten", "As-papaz, ikisi de maça"], dogru: 0 }, "s, suited demektir: iki kart aynı renkten. Hangi renk olduğu belirtilmez.", "s harfini maça (spades) sanmak."),
        a("a2", "dogruYanlis", 1, "\"QJo\" yazımındaki o, kartların farklı renkten olduğunu gösterir.", { dogru: true }, "o, offsuit demektir.", "o harfini sıfır ya da \"open\" sanmak."),
        a("a3", "sayi", 2, "AA kaç farklı kombinasyonla gelebilir?", { dogru: 6, tolerans: 0, birim: "kombinasyon" }, "Dört astan ikisi seçilir: (4 × 3) / 2 = 6.", "4 × 3 = 12 deyip sıranın önemsiz olduğunu unutmak."),
        a("a4", "sayi", 2, "AKs kaç kombinasyondur?", { dogru: 4, tolerans: 0, birim: "kombinasyon" }, "Her renk için bir tane: dört renk, dört kombinasyon.", "Offsuit sayısıyla (12) karıştırmak."),
        a("a5", "sayi", 3, "AKo kaç kombinasyondur?", { dogru: 12, tolerans: 0, birim: "kombinasyon" }, "Dört as × dört papaz = 16; aynı renkten dördü çıkınca 12 kalır.", "16 demek: bu sayı suited olanları da içerir."),
        a("a6", "eslestirme", 3, "El türünü kombinasyon sayısıyla eşleştir.", { secenekler: [["Cep çifti", "6 kombinasyon"], ["Suited el", "4 kombinasyon"], ["Offsuit el", "12 kombinasyon"]] }, "Çift 6, suited 4, offsuit 12. Offsuit eller suited olanların üç katı sıklıkta gelir.", "Suited ellerin daha sık geldiğini sanmak."),
        a("a7", "range", 3, "Suited asların hepsini işaretle (A2s'ten AKs'e).", { dogru: SUITED_ASLAR }, "Suited aslar matrisin en üst satırındadır: 12 el tipi.", "Sol sütunu (offsuit aslar) işaretlemek. Suited eller sağ üst üçgendedir."),
        a("a8", "secmeli", 4, "AK, suited ve offsuit birlikte, toplam kaç kombinasyondur?", { secenekler: ["12", "16", "6", "4"], dogru: 1 }, "4 suited + 12 offsuit = 16. Dört as × dört papaz da aynı sonucu verir.", "Yalnızca offsuit olanları (12) saymak."),
      ],
    }),
    ders("c5-d3", "Pot odds'a giriş", ["c5-d2"], {
      kazanimlar: ["Pot odds'u call ve pot üzerinden hesaplar.", "Bahis boyutunun gereken equity'yi nasıl değiştirdiğini açıklar."],
      sureDk: 7,
      terimler: ["Pot odds", "Equity"],
      anlatim: [
        "Pot odds, bir call'un zarar etmemesi için potu en az ne sıklıkta kazanman gerektiğini söyler. Formül: ödeyeceğin miktar ÷ (pot + ödeyeceğin miktar). Buradaki pot, rakibin bahsini de içerir.",
        "Örnek: pot 6 BB, rakip 3 BB bahis yaptı. Ortada 9 BB var, senin ödemen 3 BB. 3 ÷ (9 + 3) = %25. Kazanma payın (equity) %25'in üstündeyse call uzun vadede artıdadır.",
        "Bahis büyüdükçe gereken equity artar: potun yarısı kadar bahiste %25, pot kadar bahiste yaklaşık %33.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "Pot odds neyi söyler?", { secenekler: ["Call'un zarar etmemesi için gereken asgari kazanma payını", "Rakibin elini", "Kaç out'un olduğunu"], dogru: 0 }, "Pot odds bir fiyat hesabıdır: ödediğine karşılık ne kadar kazanabileceğini ve bunun için gereken payı verir.", "Pot odds ile equity'yi aynı şey sanmak. Biri gereken, öteki sahip olduğun paydır."),
        a("a2", "dogruYanlis", 2, "Rakip ne kadar küçük bahis yaparsa, call için gereken equity o kadar düşer.", { dogru: true }, "Küçük bahiste az ödeyip görece büyük bir pota girersin.", "Küçük bahsi zayıflık sayıp fiyatı hesaba katmamak."),
        a("a3", "sayi", 2, "Pot 6 BB. Rakip 3 BB bahis yaptı. Call için kaç BB koyman gerekir?", { dogru: 3, tolerans: 0, birim: "BB" }, "Call, rakibin bahsini eşitlemektir: 3 BB.", "Potun tamamını (9 BB) ödeyeceğini sanmak."),
        a("a4", "sayi", 3, "Aynı durumda (ortada 9 BB, ödemen 3 BB) gereken equity yüzde kaçtır?", { dogru: 25, tolerans: 0.5, birim: "%" }, "3 ÷ (9 + 3) = 3 ÷ 12 = %25.", "3 ÷ 9 = %33 demek: kendi call'unu paydaya eklemeyi unutmak."),
        a("a5", "sayi", 3, "Pot 10 BB. Rakip pot kadar, 10 BB bahis yaptı. Gereken equity yüzde kaçtır?", { dogru: 33.3, tolerans: 0.5, birim: "%" }, "Ortada 20 BB var, ödemen 10 BB: 10 ÷ (20 + 10) = %33,3.", "10 ÷ 20 = %50 demek."),
        a("a6", "secmeli", 3, "Rakip potun yarısı kadar bahis yaptı. Gereken equity yüzde kaçtır?", { secenekler: ["%25", "%33", "%50", "%20"], dogru: 0 }, "Pot 2 birimse bahis 1: 1 ÷ (2 + 1 + 1) = %25.", "\"Yarım pot, o halde %50\" demek."),
        a("a7", "siralama", 4, "Bahis boyutlarını, call için gereken equity'ye göre düşükten yükseğe sırala.", { secenekler: ["Potun üçte biri", "Potun yarısı", "Pot kadar", "Potun iki katı"] }, "Sırasıyla %20, %25, %33,3 ve %40. Bahis büyüdükçe gereken pay artar.", "Büyük bahsi daha \"ucuz\" sanmak, çünkü kazanılacak pot da büyür. Oran yine yükselir."),
        a("a8", "spot", 4, "Buton 2,5 BB açtı, SB fold etti. Büyük blind'dasın. Hamlen?", { secenekler: ["Fold", "Call (1,5 BB daha)", "3-bet 11 BB"], dogru: 1, spotKimlik: "c05", dogrulamaGerekli: true }, "4 BB'lik pota girmek için 1,5 BB ödüyorsun: 1,5 ÷ 5,5, yaklaşık %27. Butonun aralığı geniştir; T8 suited bu eşiği geçer.", "Zaten 1 BB koyduğunu hesaba katmayıp fiyatı pahalı görmek ve fold etmek."),
      ],
    }),
    iskelet("c5-d4", "3-bet'e giriş", ["c5-d3"], "3-bet'in ne olduğunu ve hangi ellerle yapıldığını açıklar."),
  ],
  "pist",
);

// ───────────── t1: Turnuva temelleri (turnuva) ─────────────
const t1 = unite(
  "t1",
  "Turnuva temelleri",
  2,
  "#F0715A",
  "Turnuva akışı, stack'i BB ile ölçmek ve push/fold fikri.",
  [
    ders("t1-d1", "Turnuva nedir", ["o1-k"], {
      kazanimlar: ["Turnuvayı cash oyunundan ayıran üç özelliği sayar.", "Blind'lar yükseldikçe stack'in neden küçüldüğünü açıklar."],
      sureDk: 5,
      terimler: ["Turnuva", "Blind seviyesi", "Ante"],
      anlatim: [
        "Turnuvada herkes aynı sayıda chip ile başlar. Chip'ler yalnızca turnuva içinde geçerlidir; masadan kalkıp bozdurulamaz. Chip'i biten oyuncu elenir, son kalan oyuncu bütün chip'leri toplar.",
        "Blind'lar sabit değildir: belirli aralıklarla, seviye seviye yükselir. Chip sayın aynı kalsa bile BB cinsinden stack'in küçülür.",
        "Bu yüzden turnuvada beklemek bedava değildir. Sonraki derslerde stack'i BB ile ölçmeyi ve kısa stack'te nasıl oynanacağını göreceksin.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "Yeniden girişin olmadığı bir turnuvada chip'in biterse ne olur?", { secenekler: ["Elenirsin", "Yeni chip alır, devam edersin", "Bir tur blind ödemezsin"], dogru: 0 }, "Chip'i biten oyuncu turnuvadan çıkar.", "Cash oyunundaki gibi masaya yeniden chip getirilebileceğini sanmak."),
        a("a2", "dogruYanlis", 1, "Turnuvada blind'lar oyun boyunca sabit kalır.", { dogru: false }, "Blind'lar seviye seviye yükselir.", "Cash oyununun sabit blind yapısını turnuvaya taşımak."),
        a("a3", "dogruYanlis", 2, "Cash oyununda blind'lar sabittir; turnuvada seviyeler ilerledikçe yükselir.", { dogru: true }, "İki formatın temel yapısal farkı budur.", "İki formatı yalnızca oyuncu sayısıyla ayırmak."),
        a("a4", "eslestirme", 2, "Terimi tanımıyla eşleştir.", { secenekler: [["Blind seviyesi", "Blind'ların sabit kaldığı süre dilimi"], ["Ante", "Her elde pota giren ek zorunlu bahis"], ["Freezeout", "Yeniden girişin olmadığı turnuva"], ["Chip lideri", "En çok chip'i olan oyuncu"]] }, "Seviye bir süre dilimidir; ante pota ölü chip ekler; freezeout'ta tek giriş hakkı vardır.", "Ante ile blind'ı aynı şey sanmak."),
        a("a5", "secmeli", 2, "Blind'lar yükselirken chip sayın aynı kalırsa, BB cinsinden stack'in nasıl değişir?", { secenekler: ["Küçülür", "Büyür", "Değişmez"], dogru: 0 }, "Stack (BB) = chip ÷ büyük blind. Payda büyürse sonuç küçülür.", "Chip sayısı aynı diye stack'in de aynı kaldığını düşünmek."),
        a("a6", "siralama", 3, "Bir turnuvanın akışını sırala.", { secenekler: ["Herkes eşit chip ile başlar", "Blind'lar seviye seviye yükselir", "Chip'i biten oyuncular elenir", "Son oyuncu bütün chip'leri toplar"] }, "Eşit başlangıç, yükselen blind'lar, elenmeler ve tek kazanan.", "Elenmelerin blind'lar yükselmeden başlayamayacağını sanmak; yine de genel akış budur."),
        a("a7", "secmeli", 3, "Stack'ler BB cinsinden genellikle turnuvanın hangi aşamasında en derindir?", { secenekler: ["Başlangıçta", "Final masasında", "Bubble'da"], dogru: 0 }, "Başlangıçta blind'lar en düşük seviyededir; aynı chip en çok BB'ye karşılık gelir.", "Final masasında chip sayıları büyük diye stack'leri derin sanmak; blind'lar da büyümüştür."),
        a("a8", "dogruYanlis", 3, "Turnuva chip'leri masadan kalkınca bozdurulabilir.", { dogru: false }, "Chip'ler yalnızca turnuva içinde sayaçtır; sıralama elenme sırasına göre belirlenir.", "Turnuva chip'ini cash oyunu chip'i gibi düşünmek."),
      ],
    }),
    ders("t1-d2", "Stack'i BB ile ölçmek", ["t1-d1"], {
      kazanimlar: ["Chip sayısını BB'ye çevirir.", "Blind artışının stack'e etkisini hesaplar."],
      sureDk: 5,
      terimler: ["Stack", "BB (Big Blind)"],
      anlatim: [
        "Turnuvada chip sayısı tek başına bir şey söylemez. Önemli olan, stack'inin kaç büyük blind ettiğidir: chip sayısı ÷ büyük blind.",
        "Örnek: 3.000 chip'in var ve blind'lar 100/200. Büyük blind 200 olduğuna göre stack'in 3.000 ÷ 200 = 15 BB'dir.",
        "Blind'lar yükseldiğinde aynı chip daha az BB eder. Karar verirken hep BB sayısına bak.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 1, "Stack'i BB cinsinden bulmak için ne yapılır?", { secenekler: ["Chip sayısı büyük blind'a bölünür", "Chip sayısı küçük blind'a bölünür", "Chip sayısı oyuncu sayısına bölünür"], dogru: 0 }, "Ölçü birimi büyük blind'dır.", "Küçük blind'a bölmek; sonuç iki katı çıkar."),
        a("a2", "sayi", 1, "3.000 chip'in var, blind'lar 100/200. Stack'in kaç BB?", { dogru: 15, tolerans: 0, birim: "BB" }, "3.000 ÷ 200 = 15.", "100'e bölüp 30 demek."),
        a("a3", "sayi", 2, "10.000 chip'in var, blind'lar 250/500. Stack'in kaç BB?", { dogru: 20, tolerans: 0, birim: "BB" }, "10.000 ÷ 500 = 20.", "250'ye bölüp 40 demek."),
        a("a4", "dogruYanlis", 2, "20.000 chip her zaman derin bir stack demektir.", { dogru: false }, "Blind'lar 1.000/2.000 ise 20.000 chip yalnızca 10 BB eder.", "Chip sayısına bakıp blind seviyesini unutmak."),
        a("a5", "sayi", 3, "6.000 chip'in var. Blind'lar 200/400'den 300/600'e çıktı. Yeni stack'in kaç BB?", { dogru: 10, tolerans: 0, birim: "BB" }, "6.000 ÷ 600 = 10.", "Eski seviyeyle hesaplayıp 15 demek."),
        a("a6", "secmeli", 3, "Aynı 6.000 chip, 200/400 seviyesinde kaç BB ediyordu?", { secenekler: ["15", "10", "30", "12"], dogru: 0 }, "6.000 ÷ 400 = 15. Tek seviye artışı stack'i 15 BB'den 10 BB'ye indirdi.", "200'e bölüp 30 demek."),
        a("a7", "siralama", 3, "Stack'leri BB cinsinden küçükten büyüğe sırala.", { secenekler: ["4.000 chip, blind 400/800", "4.000 chip, blind 200/400", "9.000 chip, blind 300/600", "5.000 chip, blind 100/200"] }, "Sırasıyla 5, 10, 15 ve 25 BB.", "Chip sayısına göre sıralamak: 9.000 chip burada en büyük stack değil."),
        a("a8", "sayi", 4, "12.000 chip'in var, blind'lar 400/800. İki seviye sonra blind'lar 600/1.200 olacak. Chip sayın değişmezse o seviyede kaç BB'n olur?", { dogru: 10, tolerans: 0, birim: "BB" }, "12.000 ÷ 1.200 = 10. Şu an 15 BB'sin; beklemek stack'ini üçte bir küçültür.", "Bugünkü seviyeyle hesaplayıp 15 demek."),
      ],
    }),
    ders("t1-d3", "Kısa stack: push/fold fikri", ["t1-d2"], {
      kazanimlar: ["Push/fold'un ne olduğunu ve neden kısa stack'te kullanıldığını açıklar.", "Fold equity'yi tanımlar.", "10 BB civarında all-in ya da fold kararını verir."],
      sureDk: 7,
      terimler: ["Push/fold", "Fold equity", "Kısa stack"],
      anlatim: [
        "Stack'in 10 BB civarına indiğinde küçük bir raise bile stack'inin büyük bir parçasıdır: 2 BB'ye açıp all-in'e fold edersen chip'lerinin beşte biri gider.",
        "Bu derinlikte en sade strateji push/fold'dur: preflop ya bütün stack'inle all-in gidersin ya fold edersin. All-in'in iki kazanma yolu vardır: rakipler fold eder (fold equity) ya da görülürsün ve elin kazanır.",
        "Hangi ellerle push edileceği pozisyona ve stack'e göre değişir. Bu sitedeki push aralıkları çalışma amaçlı yaklaşık aralıklardır; solver çıktısı değildir.",
      ],
      alistirmalar: [
        a("a1", "secmeli", 2, "Push/fold ne demektir?", { secenekler: ["Preflop ya all-in gitmek ya fold etmek", "Her eli call etmek", "Yalnızca flop'ta bahis yapmak"], dogru: 0 }, "Kısa stack'te ara boyutlar bırakılır; iki seçenek kalır.", "Push/fold'u her stack derinliğinde geçerli sanmak."),
        a("a2", "dogruYanlis", 2, "10 BB ile 2 BB'ye raise edip all-in'e fold etmek, stack'inin beşte birini harcar.", { dogru: true }, "2 ÷ 10 = beşte bir.", "Küçük raise'i risksiz saymak."),
        a("a3", "sayi", 2, "Butondasın, blind koymadın. 8 BB stack'inle all-in gittin, herkes fold etti. Ortada blind'lar ve ante ile 2,5 BB vardı. Yeni stack'in kaç BB?", { dogru: 10.5, tolerans: 0, birim: "BB" }, "8 + 2,5 = 10,5 BB. Kart göstermeden stack'in yaklaşık üçte bir büyüdü.", "Yalnızca blind'ları (1,5 BB) sayıp ante'yi unutmak."),
        a("a4", "secmeli", 3, "Fold equity nedir?", { secenekler: ["Rakibin fold etmesiyle potu kazanma payın", "Showdown'da kazanma payın", "Pot odds'un başka adı"], dogru: 0 }, "Bahsin ya da all-in'in karşısında rakibin fold etme olasılığından gelen kazançtır.", "Fold equity'yi elinin gücüyle karıştırmak."),
        a("a5", "eslestirme", 3, "Terimi tanımıyla eşleştir.", { secenekler: [["Push (shove)", "Bütün stack'i ortaya koymak"], ["Fold equity", "Rakip fold ettiği için kazanılan pay"], ["Kısa stack", "BB cinsinden az chip'i olan oyuncu"]] }, "Push bütün stack'tir; fold equity rakibin fold etmesinden gelir; kısa stack BB ile ölçülür.", "Kısa stack'i chip sayısıyla tanımlamak."),
        a("a6", "range", 4, "10 BB ile butondasın, herkes fold etti. Bu ellerden push aralığında olanları işaretle.", { secenekler: ["AA", "A7o", "K9s", "T9s", "72o", "32s", "J4o", "83o"], dogru: ["AA", "A7o", "K9s", "T9s"], dogrulamaGerekli: true }, "Sitedeki 10 BB buton aralığı asları, güçlü papazları ve suited connector'ları içerir; 72o, 32s, J4o ve 83o dışarıda kalır.", "Yalnızca çok güçlü ellerle (AA gibi) push etmek. Kısa stack'te aralık geniştir."),
        a("a7", "spot", 4, "10 BB ile butondasın, herkes sana kadar fold etti. Hamlen?", { secenekler: ["Fold", "Min-raise (2 BB)", "All-in (10 BB)"], dogru: 2, spotKimlik: "t01", dogrulamaGerekli: true }, "Yalnızca iki oyuncuyu geçmen gerekiyor ve as içeren el görüldüğünde de makul equity taşır. 10 BB'de min-raise yapıp fold etmek pahalıdır.", "Daha iyi bir el beklemek; blind'lar her turda stack'ini eritir."),
        a("a8", "spot", 4, "10 BB ile UTG'desin. Hamlen?", {
          secenekler: ["Fold", "All-in (10 BB)"],
          dogru: 0,
          spot: { oyun: "turnuva", oyuncuSayisi: 6, stackBB: 10, heroPoz: "UTG", heroEl: "7c2d", aksiyonlar: [], ante: 1, rakipAraligi: "Arkandaki beş oyuncu henüz konuşmadı; herhangi iki kartla olabilirler." },
        }, "Arkanda beş oyuncu var ve 72 offsuit görüldüğünde çoğu ele karşı geridedir. Kısa stack her eli push etmek demek değildir.", "Kısa stack paniğiyle ilk elde all-in gitmek."),
      ],
    }),
    iskelet("t1-d4", "Ante ve ölü chip", ["t1-d3"], "Ante'nin potu ve push aralığını nasıl etkilediğini açıklar."),
  ],
  "pist",
);

export const ORNEK_MUFREDAT: Mufredat = {
  surum: 1,
  dil: "tr",
  varsayimlar: {
    cash: "6-max, 100 BB, 2,5 BB açılış, rake yok sayılır.",
    turnuva: "Aksi yazılmadıkça BB ante 1 BB; ICM hesaba katılmaz.",
  },
  pistler: [
    { kimlik: "cash", baslik: "Cash", aciklama: "Örnek pist: kartlardan preflop temellerine.", uniteler: ["o1", "c5"] },
    { kimlik: "turnuva", baslik: "Turnuva", aciklama: "Örnek pist: kartlardan push/fold fikrine.", uniteler: ["o1", "t1"] },
  ],
  uniteler: [o1, c5, t1],
};

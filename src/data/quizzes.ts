// Kısa tekrar quiz'leri. Sorular ekip raporlarından (docs/ekip/2026-11-11/02, 05, 14; 2026-11-12/15, 18, 19)
// alındı, çoktan seçmeli biçime getirildi ve sayıları quizzes.test.ts ile yeniden ölçüldü.
// Equity değerleri ranges.json'daki yaklaşık aralıklara karşıdır; solver çıktısı değildir.
// Puan, seri ya da kayıt yok (HAFIZA.md, "ödül döngüsü mekanikleri yok").

import type { Topic } from "./hands";

export type QuizQuestion = {
  q: string;
  options: string[];
  correct: number;
  why: string;
  /** Aynı fikri masada gösteren spot (alıştırma masasında `?el=` ile açılır). */
  spot?: string;
};

export type Quiz = {
  slug: string;
  title: string;
  summary: string;
  level: "Başlangıç–orta" | "Orta" | "Orta–ileri";
  game: "cash" | "turnuva";
  topic: Topic;
  /** Bütün sorularda geçerli varsayımlar. Soruların başında gösterilir. */
  assumptions: string;
  /** İlgili blog yazıları. */
  posts: string[];
  questions: QuizQuestion[];
};

export const QUIZZES: Quiz[] = [
  {
    slug: "pot-odds-ve-cekisler",
    title: "Pot odds ve çekişler: fiyat, out, implied odds",
    summary: "Call için gereken equity'yi bul, out'larını doğru say ve fiyat yetmediğinde implied odds'un ne zaman işe yaradığını gör.",
    level: "Başlangıç–orta",
    game: "cash",
    topic: "odds",
    assumptions:
      "Cash, rake yok. Out'ların hepsi temiz sayılır: tuttuğunda rakibe daha iyi el yaptırmaz. Rakibin kartları açık değilse onları da görülmeyen kartlara sayarsın. Olasılıklar kesin hesaptır; 2 ve 4 kuralı yalnızca yaklaşık tahmindir. Implied odds için kesin bir sayı verilmez, çünkü tutunca ne kadar kazanacağın rakibe bağlıdır.",
    posts: ["pot-odds-adim-adim", "c-bet-ne-zaman"],
    questions: [
      {
        q: "Flop'ta pot 5,5 BB. Rakip 3,7 BB bahis yaptı. Call için en az ne kadar equity gerekir?",
        options: ["%22", "%29", "%40", "%67"],
        correct: 1,
        why: "Rakibin bahsiyle ortada 9,2 BB var. 3,7 BB ödeyip 12,9 BB'lik pot için oynuyorsun: 3,7 / 12,9 ≈ %28,7. %40, call'u paydaya eklemeyi unutunca çıkar (3,7 / 9,2); %67 ise bahsi yalnızca eski pota böler (3,7 / 5,5).",
        spot: "c17",
      },
      {
        q: "Aynı elde nut floş çekişin var (9 out). Rakip turn'de de bahis yapabilecekse fiyatla hangi olasılığı karşılaştırmak daha gerçekçidir?",
        options: ["River'a kadar tutma: ≈ %35", "%50, çünkü ya tutar ya tutmaz", "Yalnızca turn kartında tutma: ≈ %19", "4 kuralıyla: ≈ %36"],
        correct: 2,
        why: "Flop'ta 47 kart görmüyorsun: 9 / 47 ≈ %19,1. İki kartlık %35 yalnızca all-in'de ya da turn'ü bedava göreceğin kesinse geçerlidir. %19, gereken %28,7'nin altında; bu yüzden c17'de call'u taşıyan yalnızca fiyat değil; as gelince bazı ellere karşı öne geçmen ve floş tutunca kazanacağın ek chip'ler (implied odds).",
        spot: "c17",
      },
      {
        q: "Turn'de pot 12 BB. Rakip pot kadar, 12 BB bahis yaptı. Elinde yalnızca gutshot var (4 out); geride yaklaşık 72 BB kalıyor. Bu spotta en iyi seçenek hangisi?",
        options: [
          "Fold: river'da tutma ≈ %9, gereken ≈ %33",
          "Call: gutshot bu fiyatı karşılar",
          "Call: tutunca kazanılacak chip'ler farkı kapatır",
          "%9 ile %33 arasındaki fark önemsiz",
        ],
        correct: 0,
        why: "Gereken equity 12 / 36 ≈ %33,3; tutma olasılığı 4 / 46 ≈ %8,7. Başabaş için tutunca yaklaşık 102 BB daha kazanman gerekir; rakibin geride kalan bütün stack'i (≈ 72 BB) bile yetmez. Fiyat bu kadar kötüyken implied odds kurtarmaz.",
        spot: "c18",
      },
      {
        q: "Turn'de pot 16 BB, rakip 4 BB bahis yaptı. Çift uçlu kent çekişin var (8 out), rakibin kartlarını bilmiyorsun. River'da tutma olasılığı nedir?",
        options: ["8 / 44 ≈ %18,2", "8 / 46 ≈ %17,4", "8 / 47 ≈ %17,0", "2 kuralıyla tam %16"],
        correct: 1,
        why: "Turn'de 52 − 2 (senin kartların) − 4 (board) = 46 kart görmüyorsun; rakibin kartları da bunların içinde. Gereken equity 4 / 24 ≈ %16,7, yani fiyat kıl payı (1 puandan az) yetiyor. Call'u rahatlatan pozisyonda olman ve tutunca ek chip kazanabilmen.",
        spot: "c19",
      },
      {
        q: "Turn'de rakip all-in yaptı ve kartlarını açtı. River için kaç görülmeyen kart kalır?",
        options: ["46", "47", "48", "44"],
        correct: 3,
        why: "52 − 2 (senin) − 2 (rakibin açık kartları) − 4 (board) = 44. Alıştırma masasındaki \"Turn all-in\" spotlarında oranlar bu yüzden 44'e bölünür. Örnek: 9 out → 9 / 44 ≈ %20,5; 34,75 BB'lik call için gereken ≈ %43,2, fold. All-in olduğu için implied odds yoktur.",
        spot: "o-QhKc-6cAh7hJc",
      },
      {
        q: "Flop'ta 15 out'lu bir çekişin var (floş + açık uçlu kent) ve all-in olduğun için iki kartı da göreceksin. River'a kadar tutma olasılığı yaklaşık kaçtır?",
        options: ["%30", "%45", "%54", "%60"],
        correct: 2,
        why: "Kesin hesap: 1 − (32 / 47 × 31 / 46) ≈ %54,1. 4 kuralı 15 × 4 = %60 der; out sayısı arttıkça kural olasılığı fazla tahmin eder. 9 out'ta fark küçüktür: kural %36, kesin ≈ %35,0.",
      },
      {
        q: "UTG 2,5 BB açtı, butonda 44 ile call etmeyi düşünüyorsun. Hangi durum bu call'u en çok destekler?",
        options: [
          "Stack'ler 200 BB ve UTG'nin aralığı güçlü",
          "Stack'ler 20 BB",
          "Flop'ta set olasılığı ≈ %25 olduğu için her derinlikte",
          "UTG'nin flop'ta sık sık pes eden biri olması",
        ],
        correct: 0,
        why: "Flop'ta set ya da daha iyisi yapma olasılığı ≈ %11,8 (yaklaşık 7,5'e 1). Tek başına fiyat yetmez; call'u kârlı yapan, set tutunca kazanacağın ek chip'lerdir. Bunun için derin stack ve set'e karşı chip verebilecek güçlü eller gerekir. 20 BB'de kazanılabilecek ek chip sınırlıdır; sık pes eden rakip de set tuttuğunda daha az ödeme yapar.",
        spot: "c13",
      },
      {
        q: "Rakip yarım pot bahis yaptı (pot 10 BB, bahis 5 BB). Call için gereken equity nedir?",
        options: ["%20", "%25", "%33", "%50"],
        correct: 1,
        why: "Ortada 15 BB var, 5 BB ödüyorsun: 5 / 20 = %25. Pot ne kadar olursa olsun yarım pot bahis her zaman %25 ister; pot kadar bahis %33, üçte bir pot bahis %20 ister.",
      },
    ],
  },
  {
    slug: "c-bet-ve-barrel",
    title: "C-bet ve barrel: boyut, board ve rakip sayısı",
    summary: "Blöf c-bet'inin ne sıklıkla fold görmesi gerektiğini hesapla, rakibe verdiğin fiyatı gör ve board'a, rakip sayısına, rakip tipine göre bahis mi check mi karar ver.",
    level: "Orta",
    game: "cash",
    topic: "cbet",
    assumptions:
      "Cash, 100 BB, rake yok (7. soru hariç: turnuva, 20 BB, ante 1). Fiyat, başabaş fold sıklığı, out ve SPR kesin hesaptır. \"Board kime uyuyor\" ve rakip aralığıyla ilgili yargılar yaygın kabul gören ilkelerdir; bu sitede solver ile karşılaştırılmadı. Rakibin gerçekte ne sıklıkla fold ettiği rakibe bağlıdır ve burada tahmin edilmez.",
    posts: ["c-bet-ne-zaman", "pot-odds-adim-adim"],
    questions: [
      {
        q: "Flop'ta pot 5,5 BB. Iska geçtin ve 1/3 pot (≈1,8 BB) blöf c-bet'i düşünüyorsun. Bahsin hemen kâra geçmesi için rakip en az ne sıklıkla fold etmeli?",
        options: ["%20", "%25", "%33", "%50"],
        correct: 1,
        why: "Blöfte riske ettiğin bahis, kazanacağın ise ortadaki pot: 1,83 / (5,5 + 1,83) = %25. Elin hiç gelişmeyecek gibi sayılır; gelişme şansın varsa eşik biraz daha düşer. %20, rakibin call için ihtiyaç duyduğu equity'dir (sonraki soru); %50 ise pot kadar bahsin eşiğidir. Aynı işi büyük bahisle yapmak, iki kat sık fold görmeyi gerektirir.",
        spot: "c15",
      },
      {
        q: "Aynı spotta BB, 1,8 BB'lik c-bet'ine call etmeyi düşünüyor. Call için en az ne kadar equity gerekir?",
        options: ["%20", "%25", "%33", "%40"],
        correct: 0,
        why: "Ortada 5,5 + 1,83 = 7,33 BB var; BB 1,83 ödeyip 9,17 BB'lik pot için oynar: 1,83 / 9,17 = %20. Küçük bahis rakibe iyi fiyat verir; bu yüzden en iyi, rakibin aralığındaki ellerin çoğunun hiçbir şey yakalamadığı kuru board'larda çalışır. Pot kadar bahis %33, 2/3 pot %28,6 equity ister.",
        spot: "c15",
      },
      {
        q: "Buton 2,5 BB açtı, yalnızca BB call etti. Aşağıdaki flop'lardan hangisi genel olarak açılış yapanın aralığına en iyi uyar ve küçük c-bet için en uygun adaydır?",
        options: ["9-8-7, iki kupa", "6-5-4, iki kupa", "K-7-2, üç farklı renk", "8-7-6, iki maça"],
        correct: 2,
        why: "Papaz yüksek, kartlar bağlantısız ve üç farklı renkte. Açılış yapanın aralığında AK, KQ, KK daha çoktur; BB bu güçlü ellerin bir kısmını preflop'ta 3-bet ile oynadığı için call aralığında daha az taşır (range avantajı). Diğer üç board orta-düşük ve bağlantılı: BB'nin suited connector'larına ve orta çiftlerine çok uyar. Bu genel kabul gören bir ilkedir; sitedeki aralıklarla oranı ölçülmedi.",
        spot: "c15",
      },
      {
        q: "Üç kişilik bir potta flop 8-7-6 (iki maça) geldi, sende AK var (per yok, çekiş yok). Örnek bir varsayım: her rakip bu flop'u bağımsız olarak %35 olasılıkla yakalıyor (per ya da çekiş). En az bir rakibin yakalamış olma olasılığı yaklaşık kaçtır?",
        options: ["%35", "%58", "%70", "%12"],
        correct: 1,
        why: "İkisinin de ıskalama olasılığı 0,65 × 0,65 ≈ 0,42; en az birinin yakalama olasılığı 1 − 0,42 ≈ %57,8. %70, iki olasılığı toplamaktan çıkar (yanlış); %12 ikisinin birden yakalamasıdır. %35 yalnızca örnek bir sayı ve iki rakibin kartları tam bağımsız değildir; fikir şu: her ek rakip, blöfünün çalışma ihtimalini hızla düşürür. c29'da check bu yüzden.",
        spot: "c29",
      },
      {
        q: "Turn'de elinde AJ var (floş çekişin yok), board T-6-2-K. Rakibin kartlarını bilmiyorsun. River'da kaç kart sana kent yaptırır ve olasılığı nedir?",
        options: ["4 / 46 ≈ %8,7", "8 / 46 ≈ %17,4", "4 / 44 ≈ %9,1", "7 / 46 ≈ %15,2"],
        correct: 0,
        why: "Yalnızca dört dam A-K-Q-J-T kentini tamamlar (gutshot). As gelirse per yaparsın ama kent değil; 7 out'u saymak bu yüzden yanlış. Payda 52 − 2 − 4 = 46, çünkü rakibin kartları görülmeyen kartların içinde. Kent şansı tek başına bahsi taşımaz; ikinci barrel'in asıl gerekçesi papazın açılış aralığına daha iyi uyması ve rakibin orta güçteki ellerine fold ettirmesi.",
        spot: "c27",
      },
      {
        q: "Aynı spotta pot 9,5 BB ve 2/3 pot (≈6,3 BB) ikinci barrel yapıyorsun. Elinin gelişme şansını yok sayarsan rakip en az ne sıklıkla fold etmeli?",
        options: ["%29", "%67", "%40", "%25"],
        correct: 2,
        why: "6,33 / (9,5 + 6,33) = %40. %28,6, rakibin bu bahse call için ihtiyaç duyduğu equity'dir; %67 bahsi yalnızca pota bölmekten çıkar. Gutshot ve as ile per şansın gerçek eşiği biraz düşürür; ne kadar düşürdüğü rakibin aralığına bağlı olduğu için burada kesin sayı verilmez.",
        spot: "c27",
      },
      {
        q: "Turnuva, 20 BB, ante 1: butonda AQ ile Q-8-4 flop'unda top pair'in var. Pot 5,5 BB, geride 18 BB. 1/3 pot c-bet görülür, turn'de 2/3 pot bahis de görülürse river'da geride potun ne kadarı kalır?",
        options: ["Hiç chip kalmaz", "Potun iki katı", "Potun onda biri", "Yaklaşık yarısı (≈10 BB, pot ≈21 BB)"],
        correct: 3,
        why: "Flop: 1,83 BB bahis, pot 9,17, geride 16,17. Turn: 6,11 BB bahis, pot 21,39, geride 10,06. River'da kalan 10,06 BB potun ≈ %47'si; doğal bir bahis boyutuyla hepsi girer. SPR ≈ 3,3 (18 / 5,5) olduğu için küçük c-bet value kaçırmaz; flop'ta all-in ise yalnızca seni yenen ellerin ve güçlü çekişlerin göreceği bir boyut olur.",
        spot: "t15",
      },
      {
        q: "Turn'de pot 9 BB, elinde as yüksek ve gutshot var. Rakip neredeyse hiç fold etmeyen biri. 2/3 pot (6 BB) blöf için en az ne sıklıkla fold görmen gerekir ve ne yapmalısın?",
        options: [
          "%29 fold yeter; blöf kârlı",
          "Fold sıklığı önemli değil; turn'de her zaman ikinci barrel",
          "%40 fold gerekir; bu rakip buna yaklaşmaz, check",
          "%60 fold gerekir; pot kadar bahis daha iyi",
        ],
        correct: 2,
        why: "6 / (9 + 6) = %40. Neredeyse hiç fold etmeyen birine karşı bu sıklık gelmez; blöf chip kaybettirir. Check ile river'ı bedava görürsün: on gelirse kent yaparsın, as ya da dam gelirse per'in kazanabilir. Pot kadar bahis eşiği %50'ye çıkarır, durumu kötüleştirir. Bu rakibe karşı tersini yap: blöfü azalt, value bet'i artır.",
        spot: "c28",
      },
    ],
  },
  {
    slug: "3-bet-ve-squeeze",
    title: "3-bet ve squeeze: fiyat, blocker, aralık",
    summary: "3-bet'e verdiğin fiyatı hesapla, blocker'ın rakibin kombinasyonlarını nasıl azalttığını say ve aynı elin rakibin aralığına göre neden 4-bet, call ya da fold olabileceğini gör.",
    level: "Orta–ileri",
    game: "cash",
    topic: "3bet",
    assumptions:
      "Cash, 100 BB, rake yok. Fiyat, blocker sayımı ve başabaş fold sıklığı kesin hesaptır. Equity değerleri sitenin referans açılış aralıklarına ve spotların notunda yazılı 3-bet ve call aralıklarına karşı Monte Carlo ile ölçüldü; bu aralıklar ekip tahminidir, solver çıktısı değildir. Hangi ellerin 3-bet blöfüne uygun olduğu yaygın kabul gören bir ilkedir; burada solver ile karşılaştırılmadı.",
    posts: ["pozisyon-neden-onemli", "blind-savunmasi-fiyat-aralik-pozisyon"],
    questions: [
      {
        q: "Cutoff 2,5 BB açtı, buton 7,5 BB'ye 3-bet attı, blind'lar fold etti. Cutoff call için en az ne kadar equity'ye ihtiyaç duyar?",
        options: ["%43", "%30", "%20", "%67"],
        correct: 1,
        why: "Cutoff'un önünde 2,5 + 7,5 + 0,5 + 1 = 11,5 BB var. 5 BB daha ödeyip 16,5 BB'lik pot için oynar: 5 / 16,5 ≈ %30,3. %43, call'u paydaya eklemeyi unutmaktan (5 / 11,5); %67 ise call'u yalnızca 3-bet'e bölmekten çıkar. Fiyat iyi görünse de cutoff bu potu pozisyon dışında oynar; ham equity'nin tamamını kullanamaz.",
        spot: "c07",
      },
      {
        q: "SB'desin, elinde maça as ve maça beşli (A5 suited) var. Butonun aralığında AA ve AK'nin hepsi olsaydı, senin kartların yüzünden kaç AA ve kaç AK kombinasyonu kalır?",
        options: ["6 AA, 16 AK", "5 AA, 15 AK", "3 AA, 12 AK", "3 AA, 8 AK"],
        correct: 2,
        why: "AA'nın 6 kombinasyonundan maça aslı olan 3'ü düşer: 3 kalır. AK'nin 16 kombinasyonundan maça aslı olan 4'ü düşer: 12 kalır. Bir as tutmak, rakibin en güçlü ellerinin kabaca dörtte birini (AK) ile yarısını (AA) ortadan kaldırır; A5s'yi iyi bir 3-bet blöf adayı yapan şey budur.",
        spot: "c08",
      },
      {
        q: "Aşağıdaki ellerden hangisi pozisyon dışından 3-bet blöfü için genelde en uygun adaydır?",
        options: [
          "A5s: as blocker'ı var, görülürse floş ve küçük kent yapabilir",
          "KJo: çoğu zaman call ile oynamak daha iyidir",
          "72o: blöf için en ucuz el",
          "TT: blöf olarak 3-bet atılır",
        ],
        correct: 0,
        why: "İyi bir 3-bet blöfü rakibin güçlü ellerini bloke eder ve call görülürse oynanabilir kalır. A5s ikisini de yapar. KJo gibi orta güçteki eller rakibin fold edeceği ellere karşı önde, devam edeceği ellere karşı geride kaldığı için 3-bet'e uygun düşmez. 72o'nun ne blocker'ı ne oynanabilirliği var; TT ise blöf değil, value için 3-bet atılan ya da call edilen bir el. Bu yaygın kabul gören bir ilkedir; solver ile karşılaştırılmadı.",
        spot: "c08",
      },
      {
        q: "Cutoff'tan QQ ile açtın, buton 8 BB 3-bet attı. Bu buton yalnızca KK ve AA ile 3-bet atan biriyse QQ'nun equity'si yaklaşık kaçtır ve 4-bet ne olur?",
        options: ["≈ %62; 4-bet value için", "≈ %50; fark etmez", "≈ %40; 4-bet blöf olur", "≈ %18; 4-bet büyük hata olur"],
        correct: 3,
        why: "QQ, KK ve AA'ya karşı %18 civarındadır; call için gereken %31,4'ü (5,5 / 17,5) bile karşılamaz. 4-bet'e yalnızca seni yenen eller devam eder. %62, butonun TT+, AQ+ ve bazı blöflerle 3-bet attığı (spotun notundaki) aralığa karşı equity'dir: o zaman 4-bet doğru. Aynı el, rakibin aralığına göre value 4-bet'ten fold'a kadar değişebilir.",
        spot: "c09",
      },
      {
        q: "HJ'den AJo ile açtın, buton 8 BB 3-bet attı, blind'lar fold. Call 5,5 BB; gereken equity ≈ %31,4. AJo nottaki aralığa karşı ham olarak ≈ %34,5 alıyor. Call'un kârlı olması için bu equity'nin en az ne kadarını gerçekleştirmen (realization) gerekir?",
        options: ["≈ %50", "≈ %91", "%100'ünü, ham equity zaten yeter", "≈ %69"],
        correct: 1,
        why: "31,4 / 34,5 ≈ %91. Ham equity eşiği yalnızca 3 puan geçiyor; pozisyon dışında, domine edilebilen offsuit bir elle equity'nin bu kadarını kullanmak gerçekçi değil (AJo, JJ+, AQ ve AK'ye karşı yalnızca %26 civarında). Bu yüzden spotta fold doğru kabul edildi, ama karar sınırda: buton daha geniş 3-bet atıyorsa equity %41 civarına çıkar ve call makul olur. Realization oranının kesin değeri rakibe ve oyun biçimine bağlıdır; burada ölçülmedi.",
        spot: "c10",
      },
      {
        q: "BB'desin. Cutoff 2,5 BB açtı, buton call etti, SB fold; pot 6,5 BB. 13 BB'ye squeeze yapıyorsun. Elin hiç kazanmayacak bir blöf olsaydı, iki rakibin birlikte en az ne sıklıkta fold etmesi gerekirdi?",
        options: ["%35", "%50", "%65", "%80"],
        correct: 2,
        why: "Zaten koyduğun 1 BB'nin üstüne 12 BB riske edip ortadaki 6,5 BB'yi almaya çalışıyorsun: 12 / (12 + 6,5) ≈ %64,9. İki rakibin ikisinin de fold etmesi gerektiği için saf blöf squeeze'i pahalıdır. c12'de JJ ile squeeze value içindir: JJ cutoff'un aralığına karşı ≈ %68, butonun call aralığına karşı ≈ %74 equity'ye sahip; üç kişilik potta payı ≈ %52 (adil pay %33).",
        spot: "c12",
      },
      {
        q: "Aynı spotta squeeze'i 9 BB ya da 13 BB yapabilirsin. Cutoff call etmek isterse hangi boyutta ne kadar equity'ye ihtiyaç duyar?",
        options: [
          "9 BB'de ≈ %31, 13 BB'de ≈ %36",
          "İkisinde de %33",
          "9 BB'de ≈ %45, 13 BB'de ≈ %57",
          "9 BB'de ≈ %69, 13 BB'de ≈ %64",
        ],
        correct: 0,
        why: "9 BB: cutoff'un önünde 2,5 + 2,5 + 0,5 + 9 = 14,5 BB; 6,5 BB ödeyip 21 BB'lik pot için oynar: ≈ %31. 13 BB: önünde 18,5 BB; 10,5 ödeyip 29 BB için oynar: ≈ %36,2. Cutoff call ettikten sonra buton daha da iyi fiyat alır. Küçük squeeze iki rakibe birden ucuz fiyat verir ve pozisyon dışında çok yollu bir pot yaratır; bu yüzden pozisyon dışında ve iki rakibe karşı boyut büyür. %45 ve %57, call'u paydaya eklemeyi unutmaktan çıkar.",
        spot: "c12",
      },
    ],
  },
  {
    slug: "blind-savunmasi",
    title: "Blind savunması: fiyat, aralık, pozisyon",
    summary: "BB'de ne kadar equity gerekir, ham equity neden yetmez ve açanın pozisyonu kararı nasıl değiştirir?",
    level: "Başlangıç–orta",
    game: "cash",
    topic: "savunma",
    assumptions:
      "Cash: 6 kişilik masa, 100 BB, rake yok. Turnuva sorularında BB ante 1 BB. Rakip aralıkları sitedeki yaklaşık açılış aralıkları: UTG ellerin yaklaşık %15'i, CO %27'si, buton %43'ü. Bunlar solver çıktısı değildir. Equity realization (ham equity'nin ne kadarının kullanılabildiği) için kesin bir sayı verilmez; oranlar kaynağa göre değişir.",
    posts: ["blind-savunmasi-fiyat-aralik-pozisyon", "pot-odds-adim-adim"],
    questions: [
      {
        q: "Buton 2,5 BB açtı, SB fold etti. BB'desin. Call için en az ne kadar equity gerekir?",
        options: ["%20", "%27", "%38", "%50"],
        correct: 1,
        why: "Ortada 4 BB var (2,5 + 0,5 + 1). 1,5 BB ödeyip 5,5 BB'lik pot için oynuyorsun: 1,5 / 5,5 ≈ %27,3.",
      },
      {
        q: "Aynı durum, ama buton 2 BB'ye açtı (min-raise). Gereken equity nedir?",
        options: ["%18", "%22", "%27", "%33"],
        correct: 1,
        why: "Ortada 3,5 BB var, 1 BB ödüyorsun: 1 / 4,5 ≈ %22,2. Açılış küçüldükçe BB daha geniş savunabilir.",
      },
      {
        q: "CO 2,5 BB açtı, buton call etti, SB fold etti. BB'desin. Gereken equity nedir?",
        options: ["%19", "%27", "%33", "%40"],
        correct: 0,
        why: "Ortada 6,5 BB var, 1,5 BB ödüyorsun: 1,5 / 8 ≈ %18,8. Fiyat çok iyi ama iki rakibe karşı oynayacaksın. En çok suited ve bağlantılı eller kazanır, çünkü güçlü el yaptıklarında büyük pot alırlar.",
        spot: "c36",
      },
      {
        q: "Turnuva, 30 BB, BB ante 1. Buton 2,2 BB açtı, SB fold etti. BB'desin. Gereken equity nedir?",
        options: ["%15", "%20", "%27", "%31"],
        correct: 1,
        why: "Ortada 4,7 BB var (2,2 + 0,5 + 1 + 1 ante). 1,2 BB ödüyorsun: 1,2 / 5,9 ≈ %20,3. Ante, BB'nin fiyatını belirgin biçimde iyileştirir.",
      },
      {
        q: "Butonun 2,5 BB açılışına karşı BB'de 72o var. 72o bu aralığa karşı ham olarak yaklaşık %29,5 equity taşıyor, gereken ise %27,3. Bu varsayımlarla neden yine de fold daha iyi?",
        options: [
          "Pot odds yanlış hesaplanmıştır",
          "Pozisyon dışında bu el ham equity'sinin neredeyse tamamını kullanamaz (equity realization)",
          "72o her zaman %20'den az equity taşır",
          "BB hiçbir zaman offsuit elle savunma yapmaz",
        ],
        correct: 1,
        why: "Eşik kıl payı geçiliyor: call'un kârlı olması için 72o'nun ham equity'sinin yaklaşık %92'sini kullanması gerekir. Pozisyon dışında, çoğu flop'u ıskalayan bir el için bu gerçekçi değil. Son seçenek de yanlış: K4o gibi offsuit eller ucuz fiyatlarda savunulur. Açılış 3 BB olunca fiyat %31'e çıkar ve 72o eşiğin altında kalır.",
        spot: "c34",
      },
      {
        q: "Aynı spotta T8s'in ham equity'si yaklaşık %41. Call'un kârlı olması için bu equity'nin en az ne kadarını kullanması gerekir?",
        options: ["%27", "%50", "%66", "%90"],
        correct: 2,
        why: "27,3 / 41 ≈ %66. Suited ve bağlantılı bir el için ulaşılabilir bir oran; 72o'nun ihtiyacı ise yaklaşık %92'ydi. Aynı fiyat, iki çok farklı karar.",
      },
      {
        q: "Turnuva, 30 BB, ante 1. Buton 2,2 BB açtı ve BB'de K4o var. Ham equity yaklaşık %41, gereken %20,3. En iyi hamle hangisi?",
        options: ["Fold", "Call", "All-in"],
        correct: 1,
        why: "Ham equity'nin yalnızca yaklaşık yarısını kullanmak yetiyor. 30 BB ile all-in ise 4,7 BB'lik potu almak için bütün stack'i riske atar ve çoğunlukla daha iyi eller tarafından görülür.",
        spot: "t25",
      },
      {
        q: "UTG 2,5 BB açtı, herkes fold etti, BB'de J4o var. Fiyat buton açılışındakiyle aynı (%27,3). J4o'nun UTG aralığına karşı ham equity'si yaklaşık %29. Kararı en çok değiştiren etken nedir?",
        options: ["Açanın pozisyonu ve buna bağlı aralığın gücü", "Kartların rengi", "Masadaki oyuncu sayısı"],
        correct: 0,
        why: "UTG'nin aralığı (yaklaşık %15) butonunkinden (yaklaşık %43) çok daha güçlü. J4o eşiğin hemen üstünde kalıyor ve J'li per yaptığında sık sık daha iyi kicker'a kaybediyor (domine). Fiyat aynı olsa da savunma aralığı açana göre daralır.",
        spot: "c35",
      },
    ],
  },
  {
    slug: "spr-ve-value",
    title: "SPR ve value bet",
    summary: "Flop'taki stack/pot oranını hesapla, set mining'in sınırını gör, bir bahsin value bet olup olmadığını ayırt et.",
    level: "Orta",
    game: "cash",
    topic: "spr",
    assumptions:
      "Cash, 100 BB, rake yok. SPR (stack-to-pot ratio): efektif stack'in flop'taki pota oranı. SPR'nin yaklaşık 3'ün altı ya da 10'un üstü olması pratik kurallardır, kesin sınırlar değildir.",
    posts: ["pot-odds-adim-adim", "c-bet-ne-zaman"],
    questions: [
      {
        q: "Buton 2,5 BB açtı, SB fold etti, BB call etti. Flop'ta SPR yaklaşık kaçtır?",
        options: ["5", "10", "18", "40"],
        correct: 2,
        why: "Pot 2,5 + 2,5 + 0,5 = 5,5 BB. Kalan stack 97,5 BB. 97,5 / 5,5 ≈ 17,7.",
      },
      {
        q: "CO 2,5 BB açtı, sen butonda 9 BB'ye 3-bet yaptın, blind'lar fold etti, CO call etti. Flop'ta SPR kaçtır?",
        options: ["1,7", "4,7", "9", "18"],
        correct: 1,
        why: "Pot 9 + 9 + 0,5 + 1 = 19,5 BB. Kalan stack 91 BB. 91 / 19,5 ≈ 4,7. 3-bet potlarında SPR, tek raise'li potlara göre çok daha düşüktür.",
      },
      {
        q: "Aynı masada 22 BB'ye 4-bet yaptın ve call geldi (blind'lar fold). Flop'ta SPR yaklaşık 1,7. Top pair top kicker ile rakip all-in yaptı. Bu SPR'de en doğru yaklaşım hangisi?",
        options: [
          "Rakibin aralığına bakmadan fold",
          "Top pair çoğu rakip aralığına karşı stack koymaya yeter; fold nadiren doğrudur",
          "Yalnızca set ile devam edilir",
        ],
        correct: 1,
        why: "Pot 22 + 22 + 1,5 = 45,5 BB, kalan 78 BB. Pot stack'lere göre çok büyük olduğu için fiyat iyidir ve rakibin 4-bet potunu call eden aralığında top pair'in yendiği çok el vardır. \"Nadiren\" bilinçli: aşırı sıkı bir rakibe karşı istisna olabilir.",
        spot: "t26",
      },
      {
        q: "Elinde küçük bir cep çifti var. Flop'ta set ya da daha iyisini yapma ihtimali yaklaşık nedir?",
        options: ["%6", "%12", "%20", "%25"],
        correct: 1,
        why: "1 − C(48,3) / C(50,3) = 1 − 17.296 / 19.600 ≈ %11,8. Yani yaklaşık 7,5'e 1 aleyhine.",
      },
      {
        q: "UTG 3 BB açtı ve masada yalnızca 20 BB'si var. CO'dasın, elinde 33 var. Yalnızca set mining için call etmenin neden zor olduğunu en iyi hangisi açıklar?",
        options: [
          "33 hiçbir zaman eşleşmeden kazanmaz",
          "Set yaptığında bile kazanabileceğin en fazla miktar call'un yaklaşık 7 katı; 7,5'e 1'lik ihtimali bu bile karşılamaz",
          "UTG hiçbir zaman çift oynamaz",
        ],
        correct: 1,
        why: "En fazla 17 BB (UTG'nin kalan stack'i) + 4,5 BB (ortadaki pot) = 21,5 BB kazanabilirsin. 3 BB'lik call'a oranı 21,5 / 3 ≈ 7,2. Set her zaman kazanmaz ve rakip her zaman bütün stack'ini vermez; gerçek oran daha da kötüdür. İlk seçenek yanlış: 33 bazen eşleşmeden de kazanır, ama bunu UTG'nin güçlü aralığına karşı kullanmak zordur.",
        spot: "c38",
      },
      {
        q: "River'da bahis yapıyorsun. Rakip yalnızca daha iyi ellerle call ediyor, daha kötü elleriyle fold ediyor. Bu bahis ne tür bir bahistir?",
        options: [
          "Value bet",
          "Value bet değil: bahis yalnızca daha iyi elleri ödetir ya da hiçbir şey kazanmaz",
          "Koruma bahsi",
        ],
        correct: 1,
        why: "Bir bahsin value bet sayılması için call edildiğinde daha kötü bir elin call ediyor olması gerekir. Daha kötü eller fold, daha iyiler call ediyorsa bahis yalnızca kaybını büyütür. River'da koruma diye bir şey yoktur, çünkü gelecek kart yok.",
      },
      {
        q: "River'da pot büyüklüğünde bahis yapıyorsun ve aralığın polarize (ya çok güçlü ya hiçbir şey). Basitleştirilmiş oyun teorisi modeline göre bahis aralığının yaklaşık ne kadarı blöf olmalı?",
        options: ["%10", "%33", "%50", "%66"],
        correct: 1,
        why: "Pot büyüklüğünde bahiste rakibin call için ihtiyaç duyduğu equity 1 / 3. Rakibi call ile fold arasında kararsız bırakmak için blöf oranı da 1 / 3 olur (genel formül: bahis / (pot + 2 × bahis)). Varsayımlar: river, polarize aralık, raise yok, rakip yalnızca blöfleri yenen bir elle karar veriyor. Bu oran gerçek bir solver çıktısıyla karşılaştırılmadı; hedef değil, başlangıç noktasıdır.",
      },
    ],
  },
  {
    slug: "bubble-call-fold",
    title: "Bubble'da all-in'e karşı call",
    summary: "ICM eşiğini hesapla ve aynı elin chip hesabıyla call, bubble'da fold olduğu durumları ayırt et.",
    level: "Orta–ileri",
    game: "turnuva",
    topic: "icm",
    assumptions:
      "Sit & go bubble'ı: 4 oyuncu kaldı, ilk 3 ödül alır; ödüller havuzun %50 / %30 / %20'si (varsayım). ICM: Malmuth-Harville, tek el; gelecek eller hesaba katılmıyor. Rakibin all-in aralığı sitedeki referans push aralığı; solver çıktısı değildir.",
    posts: ["icm-nedir", "risk-primi-hesabi", "bubble-push-fold-icm"],
    questions: [
      {
        q: "Bubble'da eşit stack'li bir rakibin all-in'ine call etmek için neden chip hesabından daha fazla equity gerekir?",
        options: [
          "Rakipler bubble'da yalnızca çok güçlü ellerle all-in yapar",
          "Kaybedersen ödülsüz elenirsin; kazanırsan stack'in ikiye katlanır ama ödül payın katlanmaz",
          "Bubble'da ante pota girmez",
        ],
        correct: 1,
        why: "Kayıp, kazançtan daha pahalıdır. Ödül payı stack'le doğru orantılı artmaz; elenmenin maliyeti, stack'i ikiye katlamanın getirisinden büyüktür. İlk seçenek bir rakip varsayımıdır, ICM'in sebebi değil.",
      },
      {
        q: "Call ettiğinde pot 21,5 BB olacak ve sen 9 BB ödüyorsun. Chip hesabıyla gereken equity kaçtır?",
        options: ["%30", "%42", "%50", "%58"],
        correct: 1,
        why: "9 / 21,5 ≈ %41,9. Bu, ödülleri hesaba katmayan eşik; bir sonraki soruda aynı spotun ICM eşiğini hesaplayacaksın.",
        spot: "ib01",
      },
      {
        q: "Fold edersen ödül havuzunun %16,4'ünü, call edip kazanırsan %31,9'unu, kaybedersen hiçbir şey beklemiyorsun. Call için gereken equity kaçtır?",
        options: ["%32", "%42", "%51,5", "%66"],
        correct: 2,
        why: "(16,4 − 0) / (31,9 − 0) ≈ %51,5. Chip eşiğinden (%41,9) yaklaşık 10 puan yüksek. Bu, A3o'nun chip hesabıyla call, bubble'da fold olduğu spot.",
        spot: "ib01",
      },
      {
        q: "Aynı bubble'da hangi durumda risk primi (ICM'in eşiğe eklediği fark) en küçüktür?",
        options: [
          "10 BB ile 10 BB'lik all-in'e karşı",
          "40 BB'lik chip lideri olarak 10 BB'lik all-in'e karşı",
          "15 BB ile 15 BB'lik all-in'e karşı",
        ],
        correct: 1,
        why: "Kaybetsen de en büyük stack olarak kalırsın; eşik %42'den yalnızca %45'e çıkar. 10 BB'ye karşı 10 BB'de eşik %42'den %51,5'e, 15 BB'ye karşı 15 BB'de %44'ten %56'ya çıkar.",
        spot: "ib03",
      },
      {
        q: "Doğru mu, yanlış mı: \"Bubble'da all-in'e karşı doğru cevap her zaman fold'dur.\"",
        options: ["Doğru", "Yanlış"],
        correct: 1,
        why: "Chip lideri, kısa stack'in geniş all-in'ine karşı A7s ile call eder: equity eşiğin belirgin üstünde ve kazanırsa bubble biter. Rakip çok daha dar itseydi aynı el fold olurdu.",
        spot: "ib03",
      },
      {
        q: "A3o spotunda buton ellerin %36'sı yerine %48'iyle itiyor olsun. A3o'nun equity'si yaklaşık %48,5 olur. Cevap değişir mi?",
        options: ["Evet, call olur", "Hayır, fold kalır"],
        correct: 1,
        why: "ICM eşiği %51,5; %48,5 hâlâ altında kalır. Rakip daha geniş itse de bu stack dağılımında fold.",
        spot: "ib01",
      },
    ],
  },
  {
    slug: "bubble-push-fold",
    title: "Bubble'da SB'den all-in ya da fold",
    summary: "Fold equity'yi hesaba kat, kimin ICM baskısı altında olduğunu gör ve kısa stack'in neden her eli fold etmemesi gerektiğini anla.",
    level: "Orta–ileri",
    game: "turnuva",
    topic: "icm",
    assumptions:
      "4 oyuncu, ilk 3 ödül; ödüller havuzun %50 / %30 / %20'si (varsayım). SB 0,5, BB 1, toplam ante 1 BB. Herkes SB'ye kadar fold etti; SB yalnızca fold ya da all-in, BB yalnızca call ya da fold. BB'nin call aralığı, kendi ICM eşiğine göre hesaplanan bir varsayımdır. Tek el ICM, solver çıktısı değildir.",
    posts: ["bubble-push-fold-icm", "push-fold-temelleri", "icm-nedir"],
    questions: [
      {
        q: "SB'den all-in yaptığında potu kazanmanın iki yolu nedir?",
        options: [
          "BB fold eder ve pot çekişmeden senindir, ya da BB call eder ve elin kazanır",
          "Yalnızca elin kazanırsa",
          "Yalnızca BB fold ederse",
        ],
        correct: 0,
        why: "Fold equity (rakibin fold etmesiyle gelen kazanç) push'un en büyük parçasıdır. Görüldüğünde gereken equity bu yüzden call tarafındakinden düşüktür.",
      },
      {
        q: "8 BB ile SB'desin, ortada 2,5 BB var, BB ellerin yaklaşık %35'iyle call ediyor. K6o görüldüğünde yaklaşık %38 equity taşıyor. All-in kârlı mı?",
        options: ["Evet", "Hayır"],
        correct: 0,
        why: "Görüldüğünde gereken equity ICM ile yaklaşık %24. Üç elden ikisinde pot çekişmeden geldiği için eşik düşer.",
        spot: "ip01",
      },
      {
        q: "Doğru mu, yanlış mı: \"Bubble'da kısa stack, ödüle girmek için her eli fold etmelidir.\"",
        options: ["Doğru", "Yanlış"],
        correct: 1,
        why: "K6o spotunda all-in, fold'dan ödül havuzunun yaklaşık 1 puanı kadar fazla getirir. Blind'lar ve ante stack'i eritirken beklemenin de bir maliyeti vardır.",
        spot: "ip01",
      },
      {
        q: "12 BB ile SB'desin, CO'da 4 BB'lik bir oyuncu var, BB 50 BB ile seni kapsıyor. KJo chip hesabıyla rahat all-in. ICM ile neden fold?",
        options: [
          "KJo BB'nin call aralığına karşı her zaman %30'un altındadır",
          "CO elenirse ödüle girersin; BB'ye kaybedersen ödülsüz elenirsin. Görüldüğünde yaklaşık %59 gerekir, KJo %47 taşır",
          "BB 50 BB ile her eli call eder",
        ],
        correct: 1,
        why: "Kararı değiştiren 4 BB'lik CO: o masadayken elenmenin maliyeti çok yüksek. Chip hesabıyla görüldüğünde gereken yalnızca %24 civarındaydı.",
        spot: "ip02",
      },
      {
        q: "45 BB'lik chip lideri olarak SB'desin; diğerleri 17–20 BB. BB neden neredeyse hiç call edemez ve bu senin için ne demek?",
        options: [
          "BB kaybederse ödülsüz 4. olur; kendi ICM hesabıyla call için yaklaşık %67 equity gerekir. Fold equity çok yüksek olduğu için T9s bile all-in yapabilir",
          "BB'nin kartları zayıftır; yalnızca AA ile all-in yapmalısın",
          "Chip lideri bubble'da hiç el oynamamalıdır",
        ],
        correct: 0,
        why: "BB kendi ICM eşiğiyle yalnızca JJ ve üstüyle call edebilir. ICM baskısı burada push edenin lehine. BB ICM'i yok sayıp daha geniş call etse bile, bu varsayımlarla all-in az farkla önde kalır.",
        spot: "ip03",
      },
    ],
  },
];

export const QUIZ_BY_SLUG = new Map(QUIZZES.map((q) => [q.slug, q]));

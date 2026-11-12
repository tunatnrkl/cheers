// Hero kararının değerlendirmesi.
// İlk karar: spotun yazılı doğru cevabıyla karşılaştırılır (tahmini: false).
// Sonraki kararlar: kural tabanlı TAHMİN (tahmini: true). Equity rakibin açık aksiyon hattından
// kurulan aralığa karşı hesaplanır; rakibin gerçek eline bakılmaz. Solver sonucu değildir.
import { requiredEquity } from "../math";
import { fmt, type ActKind, type Seat } from "../replay";
import { algilananAralik } from "./araliklar";
import { CEKIS_FLOS, CEKIS_KENT, doku, equity, ikili, kartNo, tablo } from "./kartlar";
import { hayatta, legalFor } from "./kurallar";
import { akis } from "./rng";
import type { Degerlendirme, EngineState, HeroAksiyon, Kademe, LegalActions } from "./types";

const MC = 300;
const SINIR = 0.05; // ±5 puan: "kabul" bandı

/** Seçenek metninden aksiyon türü (src/components/PokerTable.tsx içindeki mantığın kopyası). */
export function optionKind(option: string): ActKind {
  const o = option.toLocaleLowerCase("tr");
  if (o.startsWith("fold")) return "fold";
  if (o.includes("all-in")) return "allin";
  if (o.startsWith("check-raise")) return "raise";
  if (o.startsWith("check")) return "check";
  if (o.startsWith("call") || o.startsWith("limp")) return "call";
  if (o.includes("bahis") || o.startsWith("bet")) return "bet";
  return "raise";
}

/** Seçenek metnindeki hedef boyut: sokakta toplam kaç BB. Bilinmiyorsa null. */
function secenekHedefi(option: string, s: EngineState, legal: LegalActions): number | null {
  const a = legal.bet ?? legal.raise;
  if (optionKind(option) === "allin") return a ? a.max : null;
  const bb = option.match(/(\d+(?:,\d+)?)\s*BB/);
  if (bb) return Number(bb[1].replace(",", "."));
  const kesir = option.match(/(\d+)\/(\d+)\s*pot/);
  if (kesir) return (Number(kesir[1]) / Number(kesir[2])) * s.pot;
  const o = option.toLocaleLowerCase("tr");
  if (o.startsWith("pot")) return s.pot;
  if (o.startsWith("min")) return a ? a.min : null;
  return null;
}

/** Hero'nun serbest aksiyonunu spotun seçeneklerinden birine eşler. Eşleşme yoksa null. */
export function secenegeEsle(s: EngineState, action: HeroAksiyon): { index: number; boyutFarki: number | null } | null {
  const opts = s.spot.options;
  const kinds = opts.map(optionKind);
  const legal = legalFor(s, s.spot.heroPos);
  const bul = (k: ActKind) => {
    const i = kinds.indexOf(k);
    return i >= 0 ? { index: i, boyutFarki: null } : null;
  };

  if (action.tür === "fold") return bul("fold");
  if (action.tür === "check") return bul("check");
  const a = legal.bet ?? legal.raise;
  if (action.tür === "call" || (action.tür === "allin" && !a)) {
    const stack = s.seats[s.spot.heroPos].stack;
    // Call tüm stack'i götürüyorsa ve seçeneklerde yalnızca all-in varsa o seçenek kastedilir
    return bul("call") ?? ((legal.call ?? 0) >= stack ? bul("allin") : null);
  }
  if (!a) return null;

  const to = action.tür === "allin" ? a.max : action.miktar;
  const allin = to >= a.max - 1e-9;
  const adaylar = opts
    .map((o, index) => ({ index, kind: kinds[index], hedef: secenekHedefi(o, s, legal) }))
    .filter((x) => x.kind === "raise" || x.kind === "bet" || x.kind === "allin");
  if (adaylar.length === 0) return null;
  if (allin) {
    const x = adaylar.find((c) => c.kind === "allin");
    if (x) return { index: x.index, boyutFarki: null };
  }
  const boyutlu = adaylar.filter((c) => c.kind !== "allin");
  if (boyutlu.length === 0) {
    // Seçeneklerde yalnızca all-in var: stack'in büyük kısmını koyan artırma ona sayılır
    return to >= a.max * 0.8 ? { index: adaylar[0].index, boyutFarki: null } : null;
  }
  let best = boyutlu[0];
  let bestD = Infinity;
  for (const c of boyutlu) {
    const d = c.hedef === null ? Infinity : Math.abs(c.hedef - to);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  const fark = best.hedef === null || best.hedef <= 0 ? null : Math.abs(best.hedef - to) / best.hedef;
  return { index: best.index, boyutFarki: fark };
}

const yuzde = (x: number) => `%${Math.round(x * 100)}`;
const sonuc = (kademe: Kademe, gerekce: string): Degerlendirme => ({ kademe, tahmini: true, gerekce });

type Baglam = {
  eq: number;
  req: number;
  toCall: number;
  cokOyunculu: boolean;
  cekis: boolean;
  islak: boolean;
  spr: number;
  river: boolean;
  preflop: boolean;
  sonKonusan: boolean;
};

function baglam(s: EngineState, legal: LegalActions): Baglam {
  const hero = s.spot.heroPos;
  const hole = (s.spot.hero.match(/.{2}/g) ?? []).map(kartNo);
  const board = s.board.map(kartNo);
  const canli = hayatta(s).filter((p) => p !== hero);

  // Asıl rakip: önündeki bahsin sahibi; yoksa son saldırgan; o da yoksa kalan ilk oyuncu
  let rakip: Seat = canli[0];
  if (s.sonArtiran && canli.includes(s.sonArtiran)) rakip = s.sonArtiran;
  else {
    for (let i = s.history.length - 1; i >= 0; i--) {
      const k = s.history[i];
      if (k.artis && canli.includes(k.koltuk)) {
        rakip = k.koltuk;
        break;
      }
    }
  }

  const rnd = akis(s.seed, `deg|${s.history.length}`);
  const tek = equity(hole, board, algilananAralik(s, rakip, [...hole, ...board]), rnd, MC);
  const eq = canli.length > 1 ? tek ** (1 + 0.6 * (canli.length - 1)) : tek;
  const toCall = legal.call ?? 0;
  const st = s.seats[hero];
  const karsiStack = Math.max(0, ...canli.map((p) => s.seats[p].stack + s.seats[p].bet - st.bet));
  const efektif = Math.min(st.stack, karsiStack);
  const flopTurn = board.length === 3 || board.length === 4;
  const bayrak = flopTurn ? tablo(board).cekis[ikili(hole[0], hole[1])] : 0;
  // Hero'dan sonra konuşacak kimse kalmadıysa check eli kapatır
  const sonra = canli.some((p) => !s.seats[p].allin && !s.seats[p].acted);

  return {
    eq,
    req: requiredEquity(s.pot, toCall),
    toCall,
    cokOyunculu: canli.length > 1,
    cekis: (bayrak & (CEKIS_FLOS | CEKIS_KENT)) !== 0,
    islak: doku(board).islak,
    spr: s.pot > 0 ? efektif / s.pot : Infinity,
    river: board.length === 5,
    preflop: board.length === 0,
    sonKonusan: !sonra,
  };
}

/** Kural tabanlı tahmin. Kesinlik iddia etmez; cümleler "tahmini" ve "bu varsayımlarla" diye kurulur. */
function kuralTabanli(s: EngineState, action: HeroAksiyon, legal: LegalActions): Degerlendirme {
  const b = baglam(s, legal);
  const kime = b.cokOyunculu ? "Rakiplerin tahmini aralıklarına" : "Rakibin tahmini aralığına";
  const P = `${kime} karşı equity'n yaklaşık ${yuzde(b.eq)}`;
  const a = legal.bet ?? legal.raise;
  const to = action.tür === "allin" ? (a?.max ?? 0) : action.tür === "bet" || action.tür === "raise" ? action.miktar : 0;
  const agresif = (action.tür === "bet" || action.tür === "raise" || action.tür === "allin") && a !== undefined;
  const hepsi = agresif && a !== undefined && to >= a.max - 1e-9;
  const derin = hepsi && b.spr > 2.5 && b.eq < 0.8;

  if (b.toCall > 0) {
    const fark = b.eq - b.req;
    const G = `call için gereken ${yuzde(b.req)}`;
    if (action.tür === "fold") {
      if (fark < -SINIR) return sonuc("en-iyi", `${P}, ${G}; bu varsayımlarla fold yerinde görünüyor.`);
      if (fark <= SINIR) return sonuc("kabul", `${P}, ${G}; fark küçük olduğu için fold da call da savunulabilir.`);
      return sonuc("hata", `${P}, ${G}; bu varsayımlarla fold fazla sıkı görünüyor.`);
    }
    if (!agresif) {
      // Çekişte ve arkada chip varken sonradan kazanılacak para sınırı biraz gevşetir
      const pay = b.cekis && b.spr > 1 ? 0.04 : 0;
      if (fark > SINIR) return sonuc("en-iyi", `${P}, ${G}; bu varsayımlarla call kârlı görünüyor.`);
      if (fark >= -SINIR - pay) {
        const ek = pay > 0 && fark < -SINIR ? "çekişin tutarsa kazanacağın ek chip'ler farkı kapatabilir" : "fark küçük olduğu için call da fold da savunulabilir";
        return sonuc("kabul", `${P}, ${G}; ${ek}.`);
      }
      return sonuc("hata", `${P}, ${G}; bu varsayımlarla call fiyatı karşılamıyor görünüyor.`);
    }
    // Raise
    if (b.eq >= 0.7) {
      if (derin) return sonuc("kabul", `${P}; el güçlü, ancak SPR ${fmt(b.spr)} iken tüm stack'i koymak daha küçük bir raise'e göre riskli olabilir.`);
      return sonuc("en-iyi", `${P}; güçlü elle value için raise bu varsayımlarla yerinde görünüyor.`);
    }
    if (b.eq >= 0.6) return sonuc("kabul", `${P}; raise savunulabilir, ama call da makul bir seçenek.`);
    if (b.cekis && !b.cokOyunculu && !derin) return sonuc("kabul", `${P} ve güçlü bir çekişin var; yarı blöf raise savunulabilir, ancak rakibin fold etmesine dayanır.`);
    return sonuc("hata", `${P}; bu güçte bir elle raise, bu varsayımlarla çoğunlukla yalnızca daha iyi ellerden aksiyon alır.`);
  }

  // Önünde bahis yok
  if (agresif) {
    const neyle = b.preflop ? "raise" : "bahis";
    if (b.eq >= 0.6) {
      if (derin) return sonuc("kabul", `${P}; value için ${neyle} yerinde, ancak SPR ${fmt(b.spr)} iken all-in gereğinden büyük olabilir.`);
      const ek = b.islak && !b.river ? `${doku(s.board.map(kartNo)).ad} board'da value ve koruma için` : "value için";
      return sonuc("en-iyi", `${P}; ${ek} ${neyle} bu varsayımlarla yerinde görünüyor.`);
    }
    if (b.eq >= 0.5) return sonuc("kabul", `${P}; ince value için ${neyle} savunulabilir, check de makul.`);
    if (b.cekis) return sonuc(derin ? "hata" : "kabul", `${P} ve güçlü bir çekişin var; yarı blöf ${neyle} ${derin ? "bu derinlikte all-in olarak fazla riskli görünüyor" : "savunulabilir, ancak rakibin fold etmesine dayanır"}.`);
    if (b.eq >= 0.5 - SINIR) return sonuc("kabul", `${P}; sınırda bir el, ${neyle} da check de savunulabilir.`);
    if (b.eq >= 0.35) return sonuc("hata", `${P}; orta güçte elle ${neyle} çoğunlukla yalnızca daha iyi ellerden call alır, check showdown değerini korur.`);
    if (b.cokOyunculu || derin) return sonuc("hata", `${P}; ${b.cokOyunculu ? "çok oyunculu potta" : "bu derinlikte all-in ile"} blöf bu varsayımlarla zayıf görünüyor.`);
    return sonuc("kabul", `${P}; bu bir blöf, yalnızca rakip yeterince sık fold ederse kâr eder ve bunu tahmin edemiyoruz.`);
  }
  // Check
  if (b.eq >= 0.75 && b.river && b.sonKonusan) return sonuc("hata", `${P}; river'da son konuşan sensin, check bu varsayımlarla value kaçırıyor görünüyor.`);
  if (b.eq >= 0.7) {
    const ek = b.islak && !b.river ? "ıslak board'da bedava kart vermek riskli olabilir" : "bahis daha fazla value toplayabilir";
    return sonuc("kabul", `${P}; check (slow play) savunulabilir, ancak ${ek}.`);
  }
  if (b.eq >= 0.6) return sonuc("kabul", `${P}; check savunulabilir, ama value için bahis de güçlü bir seçenek.`);
  return sonuc("en-iyi", `${P}; bu güçte check bu varsayımlarla yerinde görünüyor.`);
}

/**
 * Hero'nun bu durumdaki aksiyonunu değerlendirir. Aksiyon yasal olmalıdır.
 * İlk karar spotun doğru cevabıyla, sonrakiler kural tabanlı tahminle değerlendirilir.
 */
export function evaluate(s: EngineState, action: HeroAksiyon): Degerlendirme {
  const legal = legalFor(s, s.spot.heroPos);
  if (s.decisions.length === 0) {
    const m = secenegeEsle(s, action);
    const opts = s.spot.options;
    if (m) {
      const secilen = opts[m.index];
      if (m.index === s.spot.correct) {
        if (m.boyutFarki !== null && m.boyutFarki > 0.25) {
          return { kademe: "kabul", tahmini: false, gerekce: `Hamle türün spotun önerisiyle aynı ("${secilen}"), ancak boyutun önerilenden belirgin biçimde farklı.` };
        }
        return { kademe: "en-iyi", tahmini: false, gerekce: `Bu spot için önerilen hamle bu: "${secilen}".` };
      }
      return {
        kademe: "hata",
        tahmini: false,
        gerekce: `Bu spot için önerilen hamle "${opts[s.spot.correct]}"; senin hamlen "${secilen}" seçeneğine karşılık geliyor.`,
      };
    }
    // Seçeneklerde karşılığı olmayan hamle. Preflop'ta spot yazarı bu hamleyi bilerek dışarıda
    // bırakmıştır (ör. açılış spotunda limp); spotun önerisine göre değerlendirilir.
    if (s.sokak === "preflop") {
      return {
        kademe: "hata",
        tahmini: false,
        gerekce: `Bu hamle spotun seçenekleri arasında yok; bu spot için önerilen hamle "${opts[s.spot.correct]}".`,
      };
    }
    // Postflop'ta kural tabanlı tahmine düşülür
    const t = kuralTabanli(s, action, legal);
    return { ...t, gerekce: `Bu hamle spotun seçenekleri arasında yok (önerilen: "${opts[s.spot.correct]}"); tahmini değerlendirme: ${t.gerekce.charAt(0).toLocaleLowerCase("tr")}${t.gerekce.slice(1)}` };
  }
  return kuralTabanli(s, action, legal);
}

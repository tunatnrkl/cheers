// El motorunun türleri. Durum ve olaylar düz veridir: JSON'a çevrilebilir, fonksiyon ya da sınıf içermez.
import type { Seat } from "../replay";

export type { Seat };
export type Sokak = "preflop" | "flop" | "turn" | "river";
/** Durum makinesinin aşaması. "kurulum" ve "showdown" geçiştir; saklanan durumda yalnızca sokaklar ve "sonuç" görünür. */
export type Asama = "kurulum" | Sokak | "showdown" | "sonuç";
export type AksiyonTuru = "fold" | "check" | "call" | "bet" | "raise" | "allin";

/** Hero'nun serbest aksiyonu. bet/raise için `miktar`: bu sokakta TOPLAM kaça çıkıldığı (replay.ts'teki "r2.5" gibi). */
export type HeroAksiyon =
  | { tür: "fold" }
  | { tür: "check" }
  | { tür: "call" }
  | { tür: "bet" | "raise"; miktar: number }
  | { tür: "allin" };

/** Motorun iç aksiyon biçimi. */
export type Hamle = { tür: "fold" } | { tür: "check" } | { tür: "call" } | { tür: "raise"; to: number };

export type Kisayol = { etiket: string; miktar: number };
export type BahisAraligi = { min: number; max: number; kısayollar: Kisayol[] };
export type LegalActions = {
  fold?: true;
  check?: true;
  /** Call için eklenecek chip (BB). Stack yetmiyorsa kalan stack. */
  call?: number;
  /** Önünde bahis yokken. min/max: sokakta toplam kaça bahis yapılabileceği. */
  bet?: BahisAraligi;
  /** Önünde bahis varken. min/max: sokakta toplam kaça çıkılabileceği. */
  raise?: BahisAraligi;
};

/** Spotun motorun ihtiyaç duyduğu, rakip kartı İÇERMEYEN kopyası. `villain`, `note` ve `reasoning` bilerek alınmaz. */
export type Spot = {
  id: string;
  game: "cash" | "turnuva";
  street: Sokak;
  heroPos: Seat;
  stackBB: number;
  hero: string;
  board: string;
  seq: string[];
  stacks?: Partial<Record<Seat, number>>;
  ante?: number;
  players?: Seat[];
  options: string[];
  correct: number;
};

export type Koltuk = {
  present: boolean;
  stack: number;
  /** Bu sokakta önüne koyduğu */
  bet: number;
  /** El boyunca pota koyduğu toplam (blind dahil) */
  total: number;
  folded: boolean;
  allin: boolean;
  /** Son tam artırmadan beri konuştu mu (konuştuysa eksik all-in'e raise edemez) */
  acted: boolean;
  start: number;
};

/** Herkese açık aksiyon kaydı; aralık tahmini bunlardan yapılır. */
export type Kayit = {
  sokak: Sokak;
  koltuk: Seat;
  aksiyon: AksiyonTuru;
  /** Aksiyondan sonra sokaktaki toplam bahsi */
  miktar: number;
  eklenen: number;
  /** Bahsi yükseltti mi (bet, raise ya da yükselten all-in) */
  artis: boolean;
  /** Bu sokakta bu aksiyondan önceki artırma sayısı */
  oncekiArtis: number;
  /** Aksiyondan önceki stack + sokaktaki bahis */
  efektif: number;
  /** All-in'e karşı verilen karar ise all-in'in sokaktaki toplamı */
  allinKarsi: number | null;
};

export type Kademe = "en-iyi" | "kabul" | "hata";
export type Degerlendirme = {
  kademe: Kademe;
  /** true: kural tabanlı tahmin. false: spotun yazılı doğru cevabıyla karşılaştırma. */
  tahmini: boolean;
  /** Türkçe, tek cümle */
  gerekce: string;
};

export type HeroKarar = Degerlendirme & {
  sokak: Sokak;
  aksiyon: AksiyonTuru;
  /** call: eklenen chip; bet/raise/allin: sokakta toplam */
  miktar: number;
  /** Karardan önceki pot */
  potOnce: number;
};

export type AcikEl = { koltuk: Seat; kartlar: string[]; elAdi: string };
export type PotPayi = { miktar: number; adaylar: Seat[]; kazananlar: Seat[] };
export type Kazanan = { koltuk: Seat; miktar: number; elAdi?: string };
export type SonucNedeni = "showdown" | "herkes-fold" | "hero-fold";

export type Sonuc = {
  neden: SonucNedeni;
  /** Dağıtılan toplam pot. hero-fold'da birden çok rakip kaldıysa el oynatılmaz; pot dağıtılmaz. */
  pot: number;
  potlar: PotPayi[];
  kazananlar: Kazanan[];
  /** Hero'nun elin BAŞINDAN (blind dahil) net sonucu, BB */
  heroNet: number;
};

export type Olay =
  | { tür: "aksiyon"; koltuk: Seat; aksiyon: AksiyonTuru; miktar: number; eklenen: number; stack: number; pot: number }
  | { tür: "iade"; koltuk: Seat; miktar: number; pot: number }
  | { tür: "sokak"; sokak: "flop" | "turn" | "river"; kartlar: string[]; board: string[]; pot: number }
  | { tür: "showdown"; board: string[]; eller: AcikEl[] }
  | ({ tür: "sonuç" } & Sonuc);

export type EngineState = {
  spot: Spot;
  /** Spot kimliğinden türetilen tohum */
  seed: number;
  asama: Sokak | "sonuç";
  sokak: Sokak;
  board: string[];
  seats: Record<Seat, Koltuk>;
  /** Önceki sokaklardan toplanan + ante */
  collected: number;
  /** Ortadaki toplam (sokaktaki bahisler dahil) */
  pot: number;
  currentBet: number;
  /** Minimum artış miktarı (son tam artış) */
  lastRaise: number;
  /** Son tam artırmanın bahis seviyesi */
  raiseBase: number;
  /** Bu sokaktaki artırma sayısı */
  raises: number;
  sonArtiran: Seat | null;
  /** Sıra aramasının başlayacağı koltuk sırası */
  ptr: number;
  toAct: Seat | null;
  history: Kayit[];
  decisions: HeroKarar[];
  /** Karar anından beri tüm olaylar */
  olaylar: Olay[];
  result: Sonuc | null;
  /** Kontrol için: toplam chip (stack'ler + pot); el boyunca sabit kalır */
  toplamChip: number;
};

/** Rakip elleri ve açılmamış board kartları. Durumda SAKLANMAZ; tohumdan yeniden türetilir. */
export type Gizli = {
  eller: Partial<Record<Seat, [string, string]>>;
  /** Tam board: spotun board'u + tohumla seçilen kalan kartlar (5 kart) */
  board: string[];
};

export type ElOzeti = {
  kararlar: HeroKarar[];
  potSeyri: { sokak: Sokak | "son"; pot: number }[];
  sonuc: Sonuc | null;
  showdown: AcikEl[] | null;
  /** Sonucun tek cümlelik anlatımı */
  sonucMetni: string;
  /** Kısa ders cümlesi */
  ders: string;
};

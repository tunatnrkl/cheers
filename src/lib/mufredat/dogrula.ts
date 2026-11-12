// Müfredat verisini yüklerken denetler. Hata listesi boşsa veri kullanılabilir.
// Mesajlar Türkçe ve yer bildirir ("c8-d4 / a3: ...").
import type { Alistirma, Ders, Mufredat } from "./tipler";

const TURLER = ["ders", "kontrol", "test", "tekrar"];
const TIPLER = ["secmeli", "dogruYanlis", "eslestirme", "siralama", "sayi", "range", "spot"];
const KART = /^([2-9TJQKA][shdc])+$/;
// Somut bir el: "A♠ K♦", "A♠K♦", "AhKd" gibi iki kartlık yazım. Aralık anlatımında bulunmamalı.
const SOMUT_EL = /(?<![A-Za-z0-9])[2-9TJQKA][shdc♠♥♦♣]\s?[2-9TJQKA][shdc♠♥♦♣](?![A-Za-z0-9])/g;
const SIMGE: Record<string, string> = { "♠": "s", "♥": "h", "♦": "d", "♣": "c" };
const yalin = (el: string) => el.replace(/\s/g, "").replace(/[♠♥♦♣]/g, (c) => SIMGE[c]);
/** Metindeki somut ellerden, hero eli (iki sırayla) dışında kalanlar. */
function yabanciEller(metin: string, heroEl?: string): string[] {
  const hero = heroEl ? [heroEl, heroEl.slice(2) + heroEl.slice(0, 2)] : [];
  return (metin.match(SOMUT_EL) ?? []).filter((e) => !hero.includes(yalin(e)));
}

export type Baglam = { terimler?: Set<string>; spotKimlikleri?: Set<string> };

function alistirmaHatalari(a: Alistirma, yer: string, b: Baglam): string[] {
  const h: string[] = [];
  const e = (m: string) => h.push(`${yer}: ${m}`);
  if (!TIPLER.includes(a.tip)) e(`bilinmeyen alıştırma tipi "${a.tip}"`);
  if (!(Number.isInteger(a.zorluk) && a.zorluk >= 1 && a.zorluk <= 5)) e("zorluk 1 ile 5 arasında tam sayı olmalı");
  if (!a.soru?.trim()) e("soru boş");
  if (!a.neden?.trim()) e('"neden" açıklaması boş');
  if (!a.yanilgi?.trim()) e("tipik yanılgı boş");
  if (typeof a.dogrulamaGerekli !== "boolean") e('"dogrulamaGerekli" true ya da false olmalı');
  const n = Array.isArray(a.secenekler) ? a.secenekler.length : 0;
  switch (a.tip) {
    case "secmeli":
    case "spot":
      if (n < 2) e("en az 2 seçenek gerekli");
      if (!(typeof a.dogru === "number" && Number.isInteger(a.dogru) && a.dogru >= 0 && a.dogru < n)) e("doğru cevap seçeneklerden birinin sırası olmalı");
      for (const k of a.kabulEdilebilir ?? []) {
        if (!(Number.isInteger(k) && k >= 0 && k < n)) e(`kabul edilebilir seçenek sırası geçersiz (${k})`);
        if (k === a.dogru) e("kabul edilebilir seçenek doğru cevapla aynı olamaz");
      }
      break;
    case "dogruYanlis":
      if (typeof a.dogru !== "boolean") e("doğru/yanlış sorusunda cevap true ya da false olmalı");
      break;
    case "sayi":
      if (typeof a.dogru !== "number" || !Number.isFinite(a.dogru)) e("sayı sorusunda cevap sayı olmalı");
      if (!(typeof a.tolerans === "number" && a.tolerans >= 0)) e("sayı sorusunda tolerans (0 ya da pozitif) gerekli");
      break;
    case "eslestirme":
      if (n < 3 || !(a.secenekler as unknown[]).every((s) => Array.isArray(s) && s.length === 2 && s.every((x) => typeof x === "string" && x.trim())))
        e("eşleştirme en az 3 [terim, tanım] çifti ister");
      break;
    case "siralama":
      if (n < 3 || !(a.secenekler as unknown[]).every((s) => typeof s === "string")) e("sıralama en az 3 öğe ister");
      break;
    case "range":
      if (!(Array.isArray(a.dogru) && a.dogru.length > 0 && a.dogru.every((x) => /^[2-9TJQKA]{2}[so]?$/.test(x)))) e("range sorusunda cevap el adları listesi olmalı (AKs, 77, QJo)");
      break;
  }
  if (a.tip === "spot") {
    if (!!a.spotKimlik === !!a.spot) e("spot alıştırması ya mevcut bir spota bağlanır (spotKimlik) ya da yeni tanım taşır (spot); ikisi birden olmaz");
    if (a.spotKimlik && b.spotKimlikleri && !b.spotKimlikleri.has(a.spotKimlik)) e(`bağlanan spot bulunamadı: ${a.spotKimlik}`);
    const s = a.spot;
    if (s) {
      if (!KART.test(s.heroEl) || s.heroEl.length !== 4) e("hero eli iki kart olmalı (AhKd)");
      if (s.board && (!KART.test(s.board) || ![6, 8, 10].includes(s.board.length))) e("board 3, 4 ya da 5 kart olmalı");
      if (!(s.oyuncuSayisi >= 2 && s.oyuncuSayisi <= 9)) e("oyuncu sayısı 2 ile 9 arasında olmalı");
      if (!(s.stackBB > 0)) e("stack derinliği pozitif olmalı");
      if (!s.rakipAraligi?.trim()) e("rakip aralığı yazılmalı");
      else if (yabanciEller(s.rakipAraligi).length) e("rakip aralığında somut bir el yazılmış; rakip yalnızca aralıkla anlatılır");
      const kartlar = (s.heroEl + (s.board ?? "")).match(/../g) ?? [];
      if (new Set(kartlar).size !== kartlar.length) e("aynı kart iki kez kullanılmış");
    }
    // Soru ve seçeneklerde hero eli dışında somut el geçmemeli: rakibin eli verilmez.
    const metinler = [a.soru, ...((a.secenekler ?? []) as unknown[]).filter((x): x is string => typeof x === "string")];
    const sizan = metinler.flatMap((t) => yabanciEller(t, a.spot?.heroEl));
    if (sizan.length) e(`soru ya da seçeneklerde hero eli dışında somut bir el var (${sizan.join(", ")}); rakibin eli verilmemeli`);
  }
  return h;
}

function dersHatalari(d: Ders, b: Baglam): string[] {
  const h: string[] = [];
  const e = (m: string) => h.push(`${d.kimlik}: ${m}`);
  if (!d.baslik?.trim()) e("başlık boş");
  if (!TURLER.includes(d.tur)) e(`bilinmeyen ders türü "${d.tur}"`);
  if (!Array.isArray(d.kazanimlar) || d.kazanimlar.length === 0) e("en az bir kazanım gerekli");
  if (!(d.sureDk > 0)) e("tahmini süre pozitif olmalı");
  if (!(d.ustalik && d.ustalik.son > 0 && d.ustalik.oran > 0 && d.ustalik.oran <= 1)) e("ustalık ölçütü eksik ya da geçersiz (son > 0, 0 < oran ≤ 1)");
  for (const t of d.terimler ?? []) if (b.terimler && !b.terimler.has(t)) e(`sözlükte olmayan terim: ${t}`);
  if (d.durum === "iskelet") {
    if (d.alistirmalar.length) e('alıştırması olan ders "iskelet" durumunda kalamaz');
    return h;
  }
  if (d.durum !== "dolu") e('durum "iskelet" ya da "dolu" olmalı');
  if (d.tur === "ders") {
    if (d.anlatim.length < 2 || d.anlatim.length > 4) e("anlatım 2 ile 4 paragraf olmalı");
    if (d.alistirmalar.length < 8 || d.alistirmalar.length > 12) e(`ders 8 ile 12 alıştırma ister (şu an ${d.alistirmalar.length})`);
    if (new Set(d.alistirmalar.map((a) => a.tip)).size < 3) e("derste en az 3 farklı alıştırma tipi olmalı");
    const z = d.alistirmalar.map((a) => a.zorluk);
    if (z.some((v, i) => i > 0 && v < z[i - 1])) e("zorluk ders içinde azalmamalı");
  } else if (d.alistirmalar.length < 8) e(`en az 8 alıştırma gerekli (şu an ${d.alistirmalar.length})`);
  const gorulen = new Set<string>();
  for (const a of d.alistirmalar) {
    if (gorulen.has(a.kimlik)) e(`alıştırma kimliği tekrar ediyor: ${a.kimlik}`);
    gorulen.add(a.kimlik);
    h.push(...alistirmaHatalari(a, `${d.kimlik} / ${a.kimlik}`, b));
  }
  return h;
}

export function dogrula(m: Mufredat, b: Baglam = {}): string[] {
  const h: string[] = [];
  if (!m || typeof m !== "object") return ["müfredat verisi okunamadı"];
  if (!Number.isInteger(m.surum) || m.surum < 1) h.push("sürüm numarası eksik");
  if (!Array.isArray(m.pistler) || !Array.isArray(m.uniteler)) return [...h, "pistler ve üniteler listesi gerekli"];
  const pistAd = m.pistler.map((p) => p.kimlik).sort().join(",");
  if (pistAd !== "cash,turnuva") h.push(`iki pist bekleniyor (cash, turnuva); bulunan: ${pistAd || "yok"}`);

  const uniteler = new Map(m.uniteler.map((u) => [u.kimlik, u]));
  if (uniteler.size !== m.uniteler.length) h.push("ünite kimlikleri benzersiz olmalı");
  const dersler = new Map<string, Ders>();
  for (const u of m.uniteler) {
    if (!(Number.isInteger(u.seviye) && u.seviye >= 1 && u.seviye <= 10)) h.push(`${u.kimlik}: seviye 1 ile 10 arasında olmalı`);
    if (!u.baslik?.trim() || !u.ozet?.trim() || !/^#[0-9a-fA-F]{6}$/.test(u.renk)) h.push(`${u.kimlik}: başlık, özet ve renk (#rrggbb) gerekli`);
    if (!u.dersler?.length) h.push(`${u.kimlik}: ünitede ders yok`);
    for (const d of u.dersler ?? []) {
      if (dersler.has(d.kimlik)) h.push(`ders kimliği tekrar ediyor: ${d.kimlik}`);
      dersler.set(d.kimlik, d);
      h.push(...dersHatalari(d, b));
    }
    if (!u.dersler?.some((d) => d.tur === "kontrol")) h.push(`${u.kimlik}: ünite sonunda kontrol dersi yok`);
  }

  // Önkoşullar: var olmalı, döngü olmamalı, her pistte dersten ÖNCE gelmeli.
  for (const d of dersler.values()) for (const o of d.onkosul ?? []) if (!dersler.has(o)) h.push(`${d.kimlik}: önkoşul bulunamadı: ${o}`);
  const durum = new Map<string, 1 | 2>();
  const gez = (k: string, yol: string[]): void => {
    if (durum.get(k) === 2) return;
    if (durum.get(k) === 1) {
      h.push(`önkoşul döngüsü: ${[...yol.slice(yol.indexOf(k)), k].join(" → ")}`);
      return;
    }
    durum.set(k, 1);
    for (const o of dersler.get(k)?.onkosul ?? []) if (dersler.has(o)) gez(o, [...yol, k]);
    durum.set(k, 2);
  };
  for (const k of dersler.keys()) gez(k, []);

  for (const p of m.pistler) {
    if (!p.baslik?.trim() || !p.aciklama?.trim()) h.push(`${p.kimlik}: pist başlığı ve açıklaması gerekli`);
    const sira = new Map<string, number>();
    let i = 0;
    let oncekiSeviye = 0;
    for (const uk of p.uniteler ?? []) {
      const u = uniteler.get(uk);
      if (!u) {
        h.push(`${p.kimlik}: ünite bulunamadı: ${uk}`);
        continue;
      }
      if (u.seviye < oncekiSeviye) h.push(`${p.kimlik}: ${uk} ünitesinin seviyesi (${u.seviye}) kendinden önceki üniteden düşük`);
      oncekiSeviye = u.seviye;
      for (const d of u.dersler) sira.set(d.kimlik, i++);
    }
    for (const [k, n] of sira) {
      for (const o of dersler.get(k)!.onkosul ?? []) {
        const on = sira.get(o);
        if (on === undefined) h.push(`${p.kimlik}: ${k} dersinin önkoşulu ${o} bu pistte yok`);
        else if (on >= n) h.push(`${p.kimlik}: ${k}, kendinden sonra gelen ${o} dersine dayanıyor`);
      }
    }
    const n = p.uniteler?.length ?? 0;
    if (n < 10 || n > 14) h.push(`${p.kimlik}: pist 10 ile 14 ünite içermeli (şu an ${n})`);
  }
  return h;
}

// Yüzdeye gelen Türkçe ek: "%54'üyle", "%12'sinde", "%40'ında".
// Ek, sayının okunuşunun son kelimesine (dört, iki, kırk...) ünlü uyumuyla uyar.
const UNITS = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
const VOWELS = "aeıioöuü";

/** n'nin okunuşundaki son kelime (0–100 arası tam sayılar). */
function lastWord(n: number): string {
  if (n % 10) return UNITS[n % 10];
  if (n % 100) return TENS[(n % 100) / 10];
  return n ? "yüz" : "sıfır";
}

/** `%n` + iyelik eki ("i"), iyelik + bulunma ("inde") ya da iyelik + vasıta ("iyle"). */
export function pctWithSuffix(n: number, kind: "i" | "inde" | "iyle"): string {
  const word = lastWord(n);
  const last = [...word].filter((c) => VOWELS.includes(c)).pop()!;
  const v4 = "aı".includes(last) ? "ı" : "ei".includes(last) ? "i" : "ou".includes(last) ? "u" : "ü";
  const v2 = "aıou".includes(last) ? "a" : "e";
  const poss = (VOWELS.includes(word[word.length - 1]) ? "s" : "") + v4;
  return `%${n}'` + (kind === "i" ? poss : kind === "inde" ? `${poss}nd${v2}` : `${poss}yl${v2}`);
}

/**
 * Elle yazılmış metindeki "%n'ek" yazımını denetler (Y-1). "%27,3'lük" gibi ondalıklarda
 * ek virgülden sonraki sayının okunuşuna uyar. Kontrol edilenler: ilk ünlünün uyumu,
 * kaynaştırma harfi (s/y/n) ve d/t benzeşmesi. Geçerliyse null, değilse kısa açıklama döner.
 */
export function pctSuffixProblem(num: string, suffix: string): string | null {
  const [int, frac] = num.split(",");
  const n = Number(frac ?? int);
  if (!Number.isInteger(n) || n > 100) return null; // okunuşu kapsam dışı
  const word = lastWord(n);
  const lastV = [...word].filter((c) => VOWELS.includes(c)).pop()!;
  const endsV = VOWELS.includes(word[word.length - 1]);
  const v4 = "aı".includes(lastV) ? "ı" : "ei".includes(lastV) ? "i" : "ou".includes(lastV) ? "u" : "ü";
  const v2 = "aıou".includes(lastV) ? "a" : "e";
  const firstV = [...suffix].find((c) => VOWELS.includes(c));
  if (firstV && "ıiuü".includes(firstV) && firstV !== v4) return `ünlü uyumu: ${v4} olmalı`;
  if (firstV && "ae".includes(firstV) && firstV !== v2) return `ünlü uyumu: ${v2} olmalı`;
  if (endsV && VOWELS.includes(suffix[0])) return "kaynaştırma harfi eksik";
  if (!endsV && /^[sy][aeıioöuü]/.test(suffix)) return "gereksiz kaynaştırma harfi";
  if (/^[dt]/.test(suffix)) {
    const hard = !endsV && "fstkçşhp".includes(word[word.length - 1]);
    if ((suffix[0] === "t") !== hard) return `benzeşme: ${hard ? "t" : "d"} olmalı`;
  }
  return null;
}

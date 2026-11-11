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

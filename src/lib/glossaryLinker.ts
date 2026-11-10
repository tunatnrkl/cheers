import { GLOSSARY } from "@/data/glossary";

// Metindeki poker terimlerini bulup sözlük maddesine bağlamak için tek bir düzenli ifade.
// Yapay zeka yanıtlarında ve el açıklamalarında kullanılır.

type Entry = { slug: string; exactCase: boolean };
const lookup = new Map<string, Entry>();

function add(text: string, slug: string) {
  const key = text.toLowerCase();
  if (key.length < 2 || lookup.has(key)) return;
  // BB, CO, EV gibi kısaltmalar yalnızca büyük harfle yazıldığında terim sayılır
  lookup.set(key, { slug, exactCase: /^[A-Z0-9$+\-/]{2,5}$/.test(text) });
}

for (const g of GLOSSARY) {
  const m = g.term.match(/^(.+?)\s*\((.+)\)$/);
  if (m) {
    add(m[1], g.slug);
    add(m[2], g.slug);
  } else {
    add(g.term, g.slug);
  }
  for (const a of g.aliases ?? []) add(a, g.slug);
}

// Günlük dilde de geçen, her seferinde bağlanması dikkat dağıtan yazımlar
for (const noisy of ["pot", "out", "level", "push", "value", "nut", "bet", "open", "draw", "set"]) {
  lookup.delete(noisy);
}

const escaped = [...lookup.keys()]
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"));

// Terim + isteğe bağlı Türkçe ek ("pot odds'u", "blöfler", "flop'ta")
const RE = new RegExp(
  `(?<![\\p{L}\\p{N}])(${escaped.join("|")})((?:['’]\\p{L}+)|\\p{Ll}{1,6})?(?![\\p{L}\\p{N}])`,
  "giu",
);

export type Piece = string | { text: string; slug: string };

/** Metni parçalara böler. Her terim, verilen `seen` kümesi başına yalnızca bir kez bağlanır. */
export function linkTerms(text: string, seen: Set<string>): Piece[] {
  const out: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(RE)) {
    const base = m[1];
    const suffix = m[2] ?? "";
    const entry = lookup.get(base.toLowerCase());
    if (!entry || seen.has(entry.slug)) continue;
    if (entry.exactCase && base !== base.toUpperCase()) continue;
    // Kısa terimlerde kesme işaretsiz ek, başka bir kelimeyi yakalayabilir
    if (suffix && !/^['’]/.test(suffix) && base.length < 4) continue;
    seen.add(entry.slug);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ text: m[0], slug: entry.slug });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

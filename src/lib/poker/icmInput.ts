// ICM hesap makinesindeki serbest metin girişini sayılara çevirir (araçlar sayfası).
// Ayırıcı: boşluk, virgül, noktalı virgül. Türkçe binlik yazımı ("5.000", "12.500") binlik sayılır (I-2);
// Yüzde işareti ("%50") yok sayılır. "2.5" gibi tek noktalı ve üç haneli olmayan kesirler ondalık kalır.
// Geçersiz (sayı değil, 0 ya da negatif) girişler atılır ve sayılır; üst sınırı aşan girişler kesilir ve
// ayrıca sayılır ki arayüz oyuncu numaralarının kaydığını söyleyebilsin (I-1).

export type ParsedList = {
  values: number[];
  /** Sayı olmayan, 0 ya da negatif olduğu için atılan giriş sayısı */
  dropped: number;
  /** Üst sınırı aştığı için kesilen geçerli giriş sayısı */
  truncated: number;
  /** Binlik ayırıcı olarak yorumlanan giriş sayısı ("5.000" → 5000) */
  thousands: number;
};

const THOUSANDS = /^\d{1,3}(\.\d{3})+$/;

export function parseIcmList(input: string, max = 9): ParsedList {
  const tokens = input.split(/[\s;,]+/).filter(Boolean);
  const valid: number[] = [];
  let dropped = 0;
  let thousands = 0;
  for (const t of tokens) {
    let s = t.replace(/^%|%$/g, ""); // "%50" (Türkçe yazım) ve "50%" yüzde olarak okunur (I-3)
    if (THOUSANDS.test(s)) {
      s = s.replace(/\./g, "");
      thousands++;
    }
    const n = Number(s);
    if (Number.isFinite(n) && n > 0) valid.push(n);
    else dropped++;
  }
  return { values: valid.slice(0, max), dropped, truncated: Math.max(0, valid.length - max), thousands };
}

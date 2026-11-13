export const SITE_NAME = "Cheers";
// GitHub Pages (statik) sürümünde sunucu ve yapay zeka yok; koç hazır sorularla, kural tabanlı çalışır.
export const SITE_DESC =
  process.env.NEXT_PUBLIC_STATIC === "1"
    ? "Türkçe Texas Hold'em çalışma sitesi: örnek eller, alıştırmalar, öğrenme yolu, range matrisi, hesap makineleri ve hazır sorularla açıklama yapan koç."
    : "Türkçe Texas Hold'em çalışma sitesi: örnek eller, alıştırmalar, range matrisi, hesap makineleri ve yapay zeka asistanı.";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

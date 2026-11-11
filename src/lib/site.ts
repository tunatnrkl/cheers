export const SITE_NAME = "Cheers";
export const SITE_DESC =
  "Türkçe Texas Hold'em çalışma sitesi: örnek eller, alıştırmalar, range matrisi, hesap makineleri ve yapay zeka asistanı.";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

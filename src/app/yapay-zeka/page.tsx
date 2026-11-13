import type { Metadata } from "next";
import Link from "next/link";
import { KartBaglanti, NotKutusu, SayfaBasligi } from "@/components/ui";
import { Assistant } from "./Assistant";

// GitHub Pages sürümünde sunucu ve API yoktur: sayfa yerinde durur (eski bağlantılar kırılmasın),
// ama asistan gibi davranmaz; kapalı olduğunu söyler ve çalışan yollara yönlendirir.
const STATIK = process.env.NEXT_PUBLIC_STATIC === "1";

export const metadata: Metadata = {
  title: "Yapay Zeka Asistanı",
  description: STATIK
    ? "Yapay zeka asistanı bu sürümde kapalı. Alıştırma masasındaki koç ve öğrenme yolu çalışır."
    : "Poker elini formla ya da serbest metinle anlat, yapay zekadan kısa ve sade bir değerlendirme al. İstersen detaylı açıklama iste.",
};

export default function Page() {
  if (STATIK) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <SayfaBasligi
          baslik="Yapay zeka asistanı bu sürümde kapalı"
          aciklama="Asistan bir sunucu ve API anahtarı gerektirir; bu sürüm saf statik bir sitedir. Sorularını yazamazsın, sitede hiçbir yanıt yapay zeka tarafından üretilmez."
        />
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <KartBaglanti
              href="/alistirma"
              ust="Alıştırma masası"
              baslik="Masada koça sor"
              aciklama="Kararını ver, sonra “Neden?”e dokun. Koç hazır sorularla, spotun doğrulanmış gerekçesini kısaca anlatır."
            />
          </li>
          <li>
            <KartBaglanti
              href="/ogren"
              ust="Öğren"
              baslik="Öğrenme yolu"
              aciklama="Kısa derslerle temelden başla; her dersin sonunda alıştırma ve tekrar var."
            />
          </li>
        </ul>
        <NotKutusu className="text-muted">
          Takıldığın bir terim varsa{" "}
          <Link href="/sozluk" className="link">
            sözlüğe
          </Link>{" "}
          bakabilirsin.
        </NotKutusu>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <SayfaBasligi
        baslik="Yapay zekaya sor"
        aciklama="Bir kavramı sor ya da oynadığın bir eli anlat. Yanıt önce kısa gelir; “Detaylı anlat” ile derinleşir."
      />
      <Assistant />
    </div>
  );
}

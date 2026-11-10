import type { Metadata } from "next";
import { Assistant } from "./Assistant";

export const metadata: Metadata = {
  title: "Yapay Zeka Asistanı",
  description:
    "Poker elini formla ya da serbest metinle anlat, yapay zekadan kısa ve sade bir değerlendirme al. İstersen detaylı açıklama iste.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="h1">Yapay zekaya sor</h1>
        <p className="lead mt-1">
          Bir kavramı sor ya da oynadığın bir eli anlat. Yanıt önce kısa gelir; “Detaylı anlat” ile derinleşir.
        </p>
      </header>
      <Assistant />
    </div>
  );
}

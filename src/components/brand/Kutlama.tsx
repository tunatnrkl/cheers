"use client";

// "Şerefe!" kutlaması: iki bira bardağı birbirine yaklaşır ve tokuşur, köpük ve küçük kıvılcımlar
// dağılır, "Şerefe!" belirir. Yalnızca transform ve opacity; CSS keyframes (globals.css, kt-*).
//
// - <TokusanIsaret>: logonun tokuşma animasyonu (ana sayfa hero'su, ders sonu, kutlama katmanı).
// - <Kutlama>: oyunu kesmeyen kısa katman. pointer-events yok, odak çalmaz; ekran okuyucuya
//   aria-live="polite" ile tek cümle duyurulur. Hareket azaltma açıkken yalnızca kısa bir solma.
// - useSeriKutlamasi(): alıştırma serisini dinler; 5 ve 10'da, oturumda her eşik bir kez (kutlama.ts).
// - <DersSonuIsareti>: Öğren ders sonunda aynı dilin sakin sürümü.
import { type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { CheersMark } from "./CheersMark";
import { kutlamaDuyurusu, kutlamaEsigi } from "./kutlama";

export type Kivilcim = "tam" | "az" | "yok";

/** Parçacıklar: başlangıç noktası (işaretin yüzdesi), gidiş (cqw), boyut (cqw). `az`: sakin sürümde de var. */
const PARCACIKLAR: { tur: "kopuk" | "kivilcim"; x: number; y: number; dx: number; dy: number; s: number; az?: boolean }[] = [
  { tur: "kivilcim", x: 50, y: 30, dx: 0, dy: -30, s: 4.2, az: true },
  { tur: "kivilcim", x: 50, y: 32, dx: -26, dy: -22, s: 3.2 },
  { tur: "kivilcim", x: 50, y: 32, dx: 26, dy: -22, s: 3.2 },
  { tur: "kivilcim", x: 50, y: 34, dx: -36, dy: -4, s: 2.6, az: true },
  { tur: "kivilcim", x: 50, y: 34, dx: 36, dy: -6, s: 2.6, az: true },
  { tur: "kopuk", x: 41, y: 38, dx: -14, dy: -26, s: 4.6 },
  { tur: "kopuk", x: 59, y: 38, dx: 15, dy: -24, s: 4 },
  { tur: "kopuk", x: 45, y: 36, dx: -6, dy: -34, s: 3 },
  { tur: "kopuk", x: 56, y: 36, dx: 8, dy: -33, s: 3.4 },
];

export function TokusanIsaret({
  oynat = true,
  kivilcim = "tam",
  className = "",
  title,
  sure,
  gecikme,
}: {
  oynat?: boolean;
  kivilcim?: Kivilcim;
  className?: string;
  /** Erişilebilir ad; boşsa dekoratif */
  title?: string;
  /** Animasyon süresi (CSS zamanı), varsayılan 1.6s */
  sure?: string;
  gecikme?: string;
}) {
  const parcalar = !oynat || kivilcim === "yok" ? [] : kivilcim === "az" ? PARCACIKLAR.filter((p) => p.az) : PARCACIKLAR;
  const stil = { ...(sure && { "--kt-sure": sure }), ...(gecikme && { "--kt-gecikme": gecikme }) } as CSSProperties;
  return (
    <span className={`kt-isaret${oynat ? " kt-oynat" : ""}${className ? ` ${className}` : ""}`} style={stil}>
      <CheersMark title={title} />
      {parcalar.map((p, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`kt-parca kt-${p.tur}`}
          style={{ "--x": `${p.x}%`, "--y": `${p.y}%`, "--dx": `${p.dx}cqw`, "--dy": `${p.dy}cqw`, "--s": `${p.s}cqw` } as CSSProperties}
        />
      ))}
    </span>
  );
}

export type KutlamaOlayi = { id: number; metin: string; duyuru: string };

/** Katmanın ekranda kaldığı süre (CSS'teki kt-kutu ile aynı) */
export const KUTLAMA_MS = 1700;

export function Kutlama({ olay, sakin = false }: { olay: KutlamaOlayi | null; sakin?: boolean }) {
  const [gorunen, setGorunen] = useState<KutlamaOlayi | null>(null);
  useEffect(() => {
    if (!olay) return;
    setGorunen(olay);
    const t = setTimeout(() => setGorunen((g) => (g?.id === olay.id ? null : g)), KUTLAMA_MS + 80);
    return () => clearTimeout(t);
  }, [olay]);

  return (
    <>
      {/* Canlı bölge her zaman yerinde: içerik değişince duyurulur, odak yerinden oynamaz */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {gorunen?.duyuru ?? ""}
      </p>
      {gorunen && (
        <div key={gorunen.id} className={`kt-katman${sakin ? " kt-sakin" : ""}`} aria-hidden="true" data-kutlama="">
          <div className="kt-kutu">
            <TokusanIsaret kivilcim={sakin ? "az" : "tam"} />
            <p className="kt-yazi">{gorunen.metin}</p>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Alıştırma serisi kutlaması. Döndürdüğü düğüm sayfaya bir kez yerleştirilir; `bildir(seri)`
 * her yeni seri değerinde çağrılır. Eşikler bu bileşen yaşadığı sürece (oturum) bir kez kutlanır.
 */
export function useSeriKutlamasi(): [ReactNode, (seri: number) => void] {
  const gorulen = useRef(new Set<number>());
  const [olay, setOlay] = useState<KutlamaOlayi | null>(null);
  const bildir = useCallback((seri: number) => {
    const esik = kutlamaEsigi(seri, gorulen.current);
    if (esik === null) return;
    gorulen.current.add(esik);
    setOlay({ id: Date.now(), metin: "Şerefe!", duyuru: kutlamaDuyurusu(esik) });
  }, []);
  return [<Kutlama key="kutlama" olay={olay} />, bildir];
}

/**
 * Öğren ders sonu işareti. "sabit": hareket yok (tekrar oturumu, kalınan test).
 * "ders": ilk kez biten derste kıvılcımsız tek tokuşma. "unite": ünite bittiğinde az kıvılcım ve "Şerefe!".
 */
export function DersSonuIsareti({ seviye }: { seviye: "sabit" | "ders" | "unite" }) {
  return (
    <div className="flex flex-col items-center">
      <TokusanIsaret className="size-28" oynat={seviye !== "sabit"} kivilcim={seviye === "unite" ? "az" : "yok"} />
      {seviye === "unite" && <p className="kt-yazi kt-yazi-sakin">Şerefe!</p>}
    </div>
  );
}

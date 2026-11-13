"use client";

// Ana sayfanın üstündeki küçük alan: Öğren yolundaki mevcut ders ve günlük seri.
// Veri yalnızca tarayıcıda (localStorage, src/lib/ogren/depo); sunucuda ve ilk çizimde yer tutucu.
// Alıştırmanın doğru serisi burada gösterilmez (karar 4: kalıcı sayaç yok).
import Link from "next/link";
import { useMemo } from "react";
import { Simge } from "@/app/ogren/Simge";
import type { Mufredat } from "@/lib/mufredat/tipler";
import { useOgren } from "@/lib/ogren/depo";
import { ANAHTAR } from "@/lib/ogren/ilerleme";
import { dizinKur } from "@/lib/ogren/yol";
import { ogrenOzeti } from "./ogrenOzeti";

export function KaldiginYer({ mufredat }: { mufredat: Mufredat }) {
  const dz = useMemo(() => dizinKur(mufredat), [mufredat]);
  const depo = useOgren(ANAHTAR);
  const o = depo.hazir ? ogrenOzeti(dz, depo.durum, new Date()) : null;

  const ust = !o ? "Öğrenme yolu" : o.ilk ? "Öğrenme yolu" : o.ders ? (o.ders.basladi ? "Yarıda kalan ders" : "Sıradaki ders") : "Öğrenme yolu";
  const baslik = !o ? " " : o.ilk ? "Kısa derslerle temelden başla" : o.ders ? o.ders.baslik : "Yazılmış bütün dersler tamam";
  const dugme = !o ? "" : o.ilk ? "İlk derse başla" : o.ders ? (o.ders.basladi ? "Derse devam et" : "Derse başla") : "Yolu aç";

  return (
    <section
      aria-labelledby="kaldigin-yer"
      aria-busy={!o}
      className="grid gap-3 rounded-[18px] border border-line bg-surface px-4 py-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-soft text-accent-text">
          <Simge ad="bayrak" boyut={20} />
        </span>
        <div className="min-w-0">
          <p id="kaldigin-yer" className="text-sm font-semibold text-muted">
            {ust}
          </p>
          <p className="truncate font-bold text-ink">{baslik}</p>
          {o?.ders?.unite && <p className="truncate text-sm text-muted">{o.ders.unite}</p>}
        </div>
      </div>

      <p className={`flex min-h-6 items-center gap-2 text-sm text-muted ${o ? "" : "invisible"}`}>
        <Simge ad="ates" boyut={18} kalin={1.8} className="shrink-0 text-accent-text" />
        <span>
          {o && o.seri > 0 && (
            <>
              <strong className="text-ink tabular-nums">{o.seri}</strong> günlük seri ·{" "}
            </>
          )}
          {o?.seriNotu ?? " "}
        </span>
      </p>

      {o ? (
        <Link href={o.adres} className="btn justify-self-start sm:justify-self-end">
          {dugme}
          <Simge ad="ok" boyut={18} />
        </Link>
      ) : (
        <span className="block min-h-11 w-36" aria-hidden="true" />
      )}
    </section>
  );
}

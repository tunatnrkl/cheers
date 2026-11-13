"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Alıştırma sayfası açıkken belge kaymaz: html/body'ye overflow: hidden ve
 * overscroll-behavior: none eklenir, footer gizlenir, body'nin alt boşluğu kaldırılır.
 * Ayrıca üst başlığın ve mobil alt menünün yüksekliği ölçülüp köke --ust / --alt olarak yazılır.
 * Temizlikte her şey önceki hâline döner; diğer sayfalar normal kayar.
 */
export function useSayfaKilidi(kok: RefObject<HTMLElement | null>) {
  const onceki = useRef<{ el: HTMLElement; prop: string; value: string }[]>([]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const footer = document.querySelector<HTMLElement>("body > footer");
    const ayarla = (el: HTMLElement | null, prop: string, value: string) => {
      if (!el) return;
      onceki.current.push({ el, prop, value: el.style.getPropertyValue(prop) });
      el.style.setProperty(prop, value);
    };
    ayarla(html, "overflow", "hidden");
    ayarla(html, "overscroll-behavior", "none");
    ayarla(body, "overflow", "hidden");
    ayarla(body, "overscroll-behavior", "none");
    ayarla(body, "padding-bottom", "0px");
    ayarla(footer, "display", "none");
    const kayit = onceki.current;
    return () => {
      for (const { el, prop, value } of kayit.reverse()) {
        if (value) el.style.setProperty(prop, value);
        else el.style.removeProperty(prop);
      }
      onceki.current = [];
    };
  }, []);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("body > header");
    const altMenu = document.querySelector<HTMLElement>("body > nav");
    const olc = () => {
      const el = kok.current;
      if (!el) return;
      const ust = header ? Math.round(header.getBoundingClientRect().height) : 0;
      // Alt menü yalnızca mobilde görünür (md:hidden); gizliyse yüksekliği 0'dır
      const alt = altMenu && getComputedStyle(altMenu).display !== "none" ? Math.round(altMenu.getBoundingClientRect().height) : 0;
      el.style.setProperty("--ust", `${ust}px`);
      el.style.setProperty("--alt", `${alt}px`);
    };
    olc();
    const ro = new ResizeObserver(olc);
    if (header) ro.observe(header);
    if (altMenu) ro.observe(altMenu);
    addEventListener("resize", olc);
    return () => {
      ro.disconnect();
      removeEventListener("resize", olc);
    };
  }, [kok]);
}

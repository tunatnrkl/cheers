import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

// Buton dili: .btn temelli. Her boyutta dokunma alanı en az 44px.
// birincil: sayfada tek ana eylem (amber). ikincil: düz yüzey, ince kenar. hayalet: kenarsız, ikincil eylemler.
export type ButonTuru = "birincil" | "ikincil" | "hayalet" | "tehlike";
export type ButonBoyutu = "kucuk" | "orta" | "buyuk";

const TUR: Record<ButonTuru, string> = {
  birincil: "btn-primary",
  ikincil: "",
  hayalet: "btn-ghost",
  tehlike: "btn-danger",
};
const BOYUT: Record<ButonBoyutu, string> = { kucuk: "btn-sm", orta: "", buyuk: "btn-lg" };

export function butonSinifi(tur: ButonTuru = "ikincil", boyut: ButonBoyutu = "orta", ekstra = "") {
  return ["btn", TUR[tur], BOYUT[boyut], ekstra].filter(Boolean).join(" ");
}

type Ortak = { tur?: ButonTuru; boyut?: ButonBoyutu; blok?: boolean; children: ReactNode };

export function Buton({ tur, boyut, blok, className = "", type = "button", ...rest }: Ortak & ComponentProps<"button">) {
  return <button type={type} className={butonSinifi(tur, boyut, `${blok ? "btn-block" : ""} ${className}`.trim())} {...rest} />;
}

/** Sayfa içi bağlantı (next/link) buton görünümünde */
export function ButonBaglanti({ tur, boyut, blok, className = "", ...rest }: Ortak & ComponentProps<typeof Link>) {
  return <Link className={butonSinifi(tur, boyut, `${blok ? "btn-block" : ""} ${className}`.trim())} {...rest} />;
}

/** Dış bağlantı ya da tel: buton görünümünde */
export function ButonA({ tur, boyut, blok, className = "", ...rest }: Ortak & ComponentProps<"a">) {
  return <a className={butonSinifi(tur, boyut, `${blok ? "btn-block" : ""} ${className}`.trim())} {...rest} />;
}

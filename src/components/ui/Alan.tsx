import type { ComponentProps, ReactNode } from "react";

// Etiketli giriş alanı ve seçim kutusu. Etiket her zaman görünür; yardım metni aria-describedby ile bağlanır.

type Ortak = { id: string; etiket: ReactNode; yardim?: ReactNode; className?: string };

export function Alan({ id, etiket, yardim, className = "", ...rest }: Ortak & Omit<ComponentProps<"input">, "id" | "className">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {etiket}
      </label>
      <input id={id} className="field" aria-describedby={yardim ? `${id}-yardim` : undefined} {...rest} />
      {yardim && (
        <p id={`${id}-yardim`} className="mt-1 text-xs text-muted">
          {yardim}
        </p>
      )}
    </div>
  );
}

export function SecimAlani({ id, etiket, yardim, className = "", children, ...rest }: Ortak & Omit<ComponentProps<"select">, "id" | "className">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {etiket}
      </label>
      <select id={id} className="field" aria-describedby={yardim ? `${id}-yardim` : undefined} {...rest}>
        {children}
      </select>
      {yardim && (
        <p id={`${id}-yardim`} className="mt-1 text-xs text-muted">
          {yardim}
        </p>
      )}
    </div>
  );
}

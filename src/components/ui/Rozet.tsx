import type { ReactNode } from "react";

// Rozet: kısa etiket (konu, sayı, durum). amber: vurgulu; notr: ikincil bilgi.
export function Rozet({ ton = "amber", children, className = "" }: { ton?: "amber" | "notr"; children: ReactNode; className?: string }) {
  return <span className={`tag ${ton === "notr" ? "rozet-notr" : ""} ${className}`.trim()}>{children}</span>;
}

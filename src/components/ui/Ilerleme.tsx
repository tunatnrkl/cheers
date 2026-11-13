// İlerleme çubuğu. Oran yanında yazıyla veriliyorsa çubuk dekoratiftir (etiket boş);
// tek başına anlam taşıyorsa `etiket` ile progressbar olarak duyurulur.
export function Ilerleme({ oran, etiket, className = "" }: { oran: number; etiket?: string; className?: string }) {
  const yuzde = Math.round(Math.min(1, Math.max(0, oran)) * 100);
  const aria = etiket
    ? { role: "progressbar", "aria-label": etiket, "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": yuzde }
    : { "aria-hidden": true };
  return (
    <div className={`ilerleme ${className}`.trim()} {...aria}>
      <span style={{ width: `${yuzde}%` }} />
    </div>
  );
}

import type { Metadata } from "next";
import { RangeTool } from "./RangeTool";

export const metadata: Metadata = {
  title: "Range Matrisi",
  description:
    "13x13 el matrisi ile pozisyona göre açılış aralıkları ve kısa stack push/fold aralıkları. Kendi range'ini işaretle, yapay zekadan değerlendirme iste.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="h1">Range matrisi</h1>
        <p className="lead mt-1">
          Pozisyona göre hangi ellerle açılır? Referansa bak ya da kendi aralığını işaretleyip karşılaştır.
        </p>
      </header>
      <RangeTool />
    </div>
  );
}

import type { Metadata } from "next";
import { SayfaBasligi } from "@/components/ui";
import { RangeTool } from "./RangeTool";

export const metadata: Metadata = {
  title: "Range Matrisi",
  description:
    process.env.NEXT_PUBLIC_STATIC === "1"
      ? "13x13 el matrisi ile pozisyona göre açılış aralıkları ve kısa stack push/fold aralıkları. Kendi range'ini işaretle, referans aralıkla karşılaştır."
      : "13x13 el matrisi ile pozisyona göre açılış aralıkları ve kısa stack push/fold aralıkları. Kendi range'ini işaretle, yapay zekadan değerlendirme iste.",
};

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <SayfaBasligi
        baslik="Range matrisi"
        aciklama="Pozisyona göre hangi ellerle açılır? Referansa bak ya da kendi aralığını işaretleyip karşılaştır."
      />
      <RangeTool />
    </div>
  );
}

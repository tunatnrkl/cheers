import type { Metadata } from "next";
import { Practice } from "./Practice";

export const metadata: Metadata = {
  title: "Alıştırma",
  description:
    "Texas Hold'em karar alıştırmaları: senaryoyu oku, fold / call / raise seç, doğru cevabı ve gerekçesini gör. Sonuçlarını yapay zekaya analiz ettir.",
};

export default function Page() {
  return <Practice />;
}

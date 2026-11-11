// Profil verisinin saf yardımcıları (G-2): konu tablosu, sayfalı tam döküm ve CSV/JSON üretimi.
// Ağa ve tarayıcıya dokunmaz; birim testleri progressData.test.ts'de.
import { HAND_BY_ID, TOPICS, type Topic } from "@/data/hands";

export type TopicTotal = { topic: Topic; ok: number; total: number };
export type TopicStat = TopicTotal & { rate: number };

/** Konu toplamlarından doğruluk tablosu: en zayıf başta, eşitlikte daha çok çözülen başta. */
export function rankTopics(rows: TopicTotal[]): TopicStat[] {
  return rows
    .filter((r) => r.total > 0)
    .map((r) => ({ ...r, rate: r.ok / r.total }))
    .sort((a, b) => a.rate - b.rate || b.total - a.total);
}

/** Cevap listesinden konu toplamları (misafir; ya da sunucu toplamı yoksa). */
export function topicTotals(attempts: { topic: Topic; correct: boolean }[]): TopicTotal[] {
  const map = new Map<Topic, TopicTotal>();
  for (const a of attempts) {
    const t = map.get(a.topic) ?? { topic: a.topic, ok: 0, total: 0 };
    t.total++;
    if (a.correct) t.ok++;
    map.set(a.topic, t);
  }
  return [...map.values()];
}

export type Page<T> = { attempts: T[]; next: string | null };

/**
 * İmleçli uç noktayı sonuna kadar okur. `maxPages` sonsuz döngüye karşı emniyettir;
 * aşılırsa hata fırlatılır (eksik dosyayı "tam" diye indirmemek için).
 */
export async function collectPages<T>(fetchPage: (before: string | null) => Promise<Page<T>>, maxPages = 200): Promise<T[]> {
  const out: T[] = [];
  let before: string | null = null;
  for (let i = 0; i < maxPages; i++) {
    const page: Page<T> = await fetchPage(before);
    out.push(...page.attempts);
    if (!page.next) return out;
    if (page.next === before) throw new Error("Döküm imleci ilerlemedi.");
    before = page.next;
  }
  throw new Error("Döküm çok uzun; sayfa sınırı aşıldı.");
}

export type ExportAttempt = { handId: string; chosen: number; correct: boolean; topic: Topic | string; at: string };
export type ExportSaved = { handId: string; note: string; at: string };

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Dışa aktarılacak dosyanın içeriği. Cevaplar yeniden eskiye sıralanır. */
export function buildExport(format: "csv" | "json", attempts: ExportAttempt[], saved: ExportSaved[]): string {
  const rows = [...attempts]
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .map((a) => {
      const h = HAND_BY_ID.get(a.handId);
      return {
        tarih: a.at,
        el: h?.title ?? a.handId,
        konu: TOPICS[a.topic as Topic] ?? a.topic,
        secim: h?.options[a.chosen] ?? a.chosen,
        onerilen: h ? h.options[h.correct] : "",
        dogru: a.correct ? "evet" : "hayır",
      };
    });
  const notes = saved.map((s) => ({ tarih: s.at, el: HAND_BY_ID.get(s.handId)?.title ?? s.handId, not: s.note }));

  if (format === "json") return JSON.stringify({ alistirmalar: rows, kaydedilenEller: notes }, null, 2);
  const lines = [
    ["tur", "tarih", "el", "konu", "secim", "onerilen", "dogru", "not"].join(","),
    ...rows.map((r) => ["alistirma", r.tarih, r.el, r.konu, r.secim, r.onerilen, r.dogru, ""].map(csvCell).join(",")),
    ...notes.map((n) => ["kayitli-el", n.tarih, n.el, "", "", "", "", n.not].map(csvCell).join(",")),
  ];
  // BOM: Excel Türkçe karakterleri doğru göstersin
  return "﻿" + lines.join("\n");
}

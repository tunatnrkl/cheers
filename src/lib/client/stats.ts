// Gelişim istatistikleri (Aşama 3). Yalnızca mevcut cevap kayıtlarından hesaplanır;
// yeni veri toplanmaz, sunucuya ek istek gitmez. Spesifikasyon:
// docs/ekip/2026-11-11/10-gelisim-istatistikleri-spec.md
import { HAND_BY_ID, POSITIONS, type Game, type Pos } from "@/data/hands";

export type StatAttempt = { handId: string; correct: boolean; at: string };

/** Bu sayıdan az cevapta oran gösterilmez, "az veri" yazılır. */
export const MIN_SAMPLE = 10;

export type Rate = {
  ok: number;
  total: number;
  /** ok / total; total < MIN_SAMPLE ise null */
  rate: number | null;
};

const DAY = 86_400_000;

function rate(ok: number, total: number): Rate {
  return { ok, total, rate: total >= MIN_SAMPLE ? ok / total : null };
}

/**
 * 95% Wilson aralığı. Küçük örneklerde oranın ne kadar oynak olduğunu göstermek için;
 * arayüzde yalnızca açıklama metninde kullanılır.
 */
export function wilson(ok: number, total: number, z = 1.96): [number, number] {
  if (!total) return [0, 1];
  const p = ok / total;
  const d = 1 + (z * z) / total;
  const c = p + (z * z) / (2 * total);
  const m = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

export type WeekBucket = Rate & {
  /** 0 = son 7 gün, 1 = 7–14 gün önce, ... */
  weeksAgo: number;
};

/**
 * Kayan 7 günlük pencereler (takvim haftası değil): pazartesi sıfırlanan bir sayaç
 * hissi vermez. En eski pencere en başta.
 */
export function weeklyTrend(attempts: StatAttempt[], now: Date, weeks = 8): WeekBucket[] {
  const ok = Array<number>(weeks).fill(0);
  const total = Array<number>(weeks).fill(0);
  for (const a of attempts) {
    const age = now.getTime() - new Date(a.at).getTime();
    if (!(age >= 0)) continue; // gelecek tarih ya da geçersiz
    const w = Math.floor(age / (7 * DAY));
    if (w >= weeks) continue;
    total[w]++;
    if (a.correct) ok[w]++;
  }
  return total.map((t, w) => ({ weeksAgo: w, ...rate(ok[w], t) })).reverse();
}

export type PosStat = Rate & { pos: Pos };

/** Kahramanın pozisyonuna göre doğruluk, masa sırasıyla. Kütüphanede olmayan eller atlanır. */
export function positionStats(attempts: StatAttempt[], game?: Game): PosStat[] {
  const ok = new Map<Pos, number>();
  const total = new Map<Pos, number>();
  for (const a of attempts) {
    const h = HAND_BY_ID.get(a.handId);
    if (!h || (game && h.game !== game)) continue;
    total.set(h.heroPos, (total.get(h.heroPos) ?? 0) + 1);
    if (a.correct) ok.set(h.heroPos, (ok.get(h.heroPos) ?? 0) + 1);
  }
  return POSITIONS.filter((p) => total.has(p)).map((pos) => ({ pos, ...rate(ok.get(pos) ?? 0, total.get(pos)!) }));
}

/**
 * İlk görüş ve tekrar doğruluğu. Yanlışlar masada geri döndüğü için genel doğruluk
 * tekrarlarla şişebilir; "ilk görüşte" oranı yeni bir spotu ne kadar okuduğunu gösterir.
 */
export function firstVsRepeat(attempts: StatAttempt[]): { first: Rate; repeat: Rate } {
  const sorted = [...attempts].sort((a, b) => a.at.localeCompare(b.at));
  const seen = new Set<string>();
  let fo = 0, ft = 0, ro = 0, rt = 0;
  for (const a of sorted) {
    if (seen.has(a.handId)) {
      rt++;
      if (a.correct) ro++;
    } else {
      seen.add(a.handId);
      ft++;
      if (a.correct) fo++;
    }
  }
  return { first: rate(fo, ft), repeat: rate(ro, rt) };
}

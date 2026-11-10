import { NextResponse } from "next/server";
import { z } from "zod";
import { HAND_BY_ID } from "@/data/hands";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { fail, readJson, sameOrigin } from "@/lib/server/http";

// GET /api/attempts → kullanıcının alıştırma cevapları (yeniden eskiye)
export async function GET() {
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  const { rows } = await db()!.query(
    `SELECT hand_id AS "handId", chosen, correct, topic, created_at AS at
       FROM attempts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5000`,
    [user.id],
  );
  return NextResponse.json({ attempts: rows }, { headers: { "Cache-Control": "no-store" } });
}

const schema = z.object({
  items: z
    .array(
      z.object({
        handId: z.string().max(24),
        chosen: z.number().int().min(0).max(5),
        at: z.string().datetime().optional(),
      }),
    )
    .min(1)
    .max(500),
});

// POST /api/attempts → cevapları kaydeder. Doğru/yanlış sunucuda hesaplanır.
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  const parsed = await readJson(req, schema);
  if (parsed.error) return parsed.error;

  const values: unknown[] = [];
  const tuples: string[] = [];
  for (const it of parsed.data.items) {
    const hand = HAND_BY_ID.get(it.handId);
    if (!hand || it.chosen >= hand.options.length) continue;
    const n = values.length;
    values.push(user.id, hand.id, it.chosen, it.chosen === hand.correct, hand.topic, it.at ?? new Date().toISOString());
    tuples.push(`($${n + 1}, $${n + 2}, $${n + 3}, $${n + 4}, $${n + 5}, $${n + 6})`);
  }
  if (tuples.length) {
    await db()!.query(
      `INSERT INTO attempts (user_id, hand_id, chosen, correct, topic, created_at) VALUES ${tuples.join(", ")}`,
      values,
    );
  }
  return NextResponse.json({ saved: tuples.length });
}

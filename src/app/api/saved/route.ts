import { NextResponse } from "next/server";
import { z } from "zod";
import { HAND_BY_ID } from "@/data/hands";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { fail, readJson, sameOrigin } from "@/lib/server/http";

// GET /api/saved → kaydedilen eller ve notları
export async function GET() {
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  const { rows } = await db()!.query(
    `SELECT hand_id AS "handId", note, updated_at AS at
       FROM saved_hands WHERE user_id = $1 ORDER BY updated_at DESC`,
    [user.id],
  );
  return NextResponse.json({ saved: rows }, { headers: { "Cache-Control": "no-store" } });
}

const schema = z.object({
  handId: z.string().max(10),
  note: z.string().max(2000).default(""),
});

// PUT /api/saved → eli kaydeder ya da notunu günceller
export async function PUT(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  const parsed = await readJson(req, schema);
  if (parsed.error) return parsed.error;
  if (!HAND_BY_ID.has(parsed.data.handId)) return fail(404, "El bulunamadı.");

  await db()!.query(
    `INSERT INTO saved_hands (user_id, hand_id, note) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, hand_id) DO UPDATE SET note = EXCLUDED.note, updated_at = now()`,
    [user.id, parsed.data.handId, parsed.data.note],
  );
  return NextResponse.json({ ok: true });
}

// DELETE /api/saved?handId=c01 → kaydı kaldırır
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  const handId = new URL(req.url).searchParams.get("handId") ?? "";
  await db()!.query("DELETE FROM saved_hands WHERE user_id = $1 AND hand_id = $2", [user.id, handId]);
  return NextResponse.json({ ok: true });
}

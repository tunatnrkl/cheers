import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, verifyPassword } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { clientIp, fail, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");
  if (!rateLimit(`login:${clientIp(req)}`, 10, 10 * 60_000)) {
    return fail(429, "Çok fazla deneme. Birkaç dakika sonra yeniden dene.");
  }
  const pool = db();
  if (!pool) return fail(503, "Hesap sistemi bu kurulumda etkin değil.");

  const parsed = await readJson(req, schema);
  if (parsed.error) return fail(400, "E-posta ya da şifre hatalı.");

  const { rows } = await pool.query("SELECT id, password_hash FROM users WHERE email = $1", [
    parsed.data.email,
  ]);
  // Hesap var mı yok mu belli olmasın diye iki durumda da aynı mesaj döner.
  const ok = await verifyPassword(parsed.data.password, rows[0]?.password_hash ?? null);
  if (!rows[0] || !ok) return fail(401, "E-posta ya da şifre hatalı.");

  await createSession(String(rows[0].id));
  return NextResponse.json({ ok: true });
}

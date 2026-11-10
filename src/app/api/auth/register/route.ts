import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, hashPassword } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { clientIp, fail, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(200),
  displayName: z.string().trim().max(60).optional(),
  // 18 yaş beyanı ve aydınlatma metni onayı zorunlu
  consent: z.literal(true),
});

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");
  if (!rateLimit(`reg:${clientIp(req)}`, 8, 10 * 60_000)) {
    return fail(429, "Çok fazla deneme. Birkaç dakika sonra yeniden dene.");
  }
  const pool = db();
  if (!pool) return fail(503, "Hesap sistemi bu kurulumda etkin değil.");

  const parsed = await readJson(req, schema);
  if (parsed.error) {
    return fail(400, "E-posta geçerli olmalı, şifre en az 8 karakter olmalı ve onay kutusu işaretlenmeli.");
  }
  const { email, password, displayName } = parsed.data;

  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, consent_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [email, await hashPassword(password), displayName || null],
  );
  if (!rows[0]) return fail(409, "Bu e-posta ile kayıtlı bir hesap var. Giriş yapmayı dene.");

  await createSession(String(rows[0].id));
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSession, googleEnabled } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { siteUrl } from "@/lib/site";

const back = (q: string) => NextResponse.redirect(new URL(`/profil${q}`, siteUrl()));

// GET /api/auth/google/callback → kodu token'a çevirir, kullanıcıyı bulur ya da oluşturur
export async function GET(req: Request) {
  const pool = db();
  if (!googleEnabled() || !pool) return back("?hata=google");

  const params = new URL(req.url).searchParams;
  const jar = await cookies();
  const expected = jar.get("pd_oauth")?.value;
  jar.delete("pd_oauth");
  const code = params.get("code");
  if (!code || !expected || params.get("state") !== expected) return back("?hata=google");

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${siteUrl()}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return back("?hata=google");
    const { access_token } = (await tokenRes.json()) as { access_token?: string };

    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!infoRes.ok) return back("?hata=google");
    const info = (await infoRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!info.sub || !info.email || !info.email_verified) return back("?hata=google");

    // Aynı e-postayla şifreli hesap varsa Google kimliği o hesaba bağlanır.
    // 18+ beyanı ve aydınlatma metni, giriş ekranında butonun hemen üstünde gösterilir.
    const { rows } = await pool.query(
      `INSERT INTO users (email, google_sub, display_name, consent_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (email) DO UPDATE SET google_sub = COALESCE(users.google_sub, EXCLUDED.google_sub)
       RETURNING id, google_sub`,
      [info.email.toLowerCase(), info.sub, info.name?.slice(0, 60) ?? null],
    );
    if (rows[0].google_sub !== info.sub) return back("?hata=google");

    await createSession(String(rows[0].id));
    return back("?giris=1");
  } catch {
    return back("?hata=google");
  }
}

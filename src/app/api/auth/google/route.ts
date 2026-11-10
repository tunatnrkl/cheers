import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { googleEnabled } from "@/lib/server/auth";
import { siteUrl } from "@/lib/site";

// GET /api/auth/google → Google onay ekranına yönlendirir (OAuth 2.0 yetki kodu akışı)
export async function GET() {
  if (!googleEnabled()) return NextResponse.redirect(new URL("/profil?hata=google", siteUrl()));

  const state = randomBytes(16).toString("hex");
  (await cookies()).set("pd_oauth", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${siteUrl()}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();
  return NextResponse.redirect(url);
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { currentUser, googleEnabled, SESSION_COOKIE } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { fail, sameOrigin } from "@/lib/server/http";

// GET /api/auth/me → oturum bilgisi ve hangi giriş yöntemlerinin açık olduğu
export async function GET() {
  return NextResponse.json(
    { user: await currentUser(), accounts: !!db(), google: googleEnabled() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

// DELETE /api/auth/me → hesabı ve tüm verisini kalıcı olarak siler (KVKK: silme hakkı)
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  await db()!.query("DELETE FROM users WHERE id = $1", [user.id]);
  (await cookies()).delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}

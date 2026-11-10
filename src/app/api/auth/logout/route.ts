import { NextResponse } from "next/server";
import { destroySession } from "@/lib/server/auth";
import { fail, sameOrigin } from "@/lib/server/http";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");
  await destroySession();
  return NextResponse.json({ ok: true });
}

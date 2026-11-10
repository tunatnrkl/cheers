import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";

export function fail(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** JSON gövdeyi okur ve şemayla doğrular. Hata durumunda hazır yanıt döner. */
export async function readJson<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { error: fail(400, "Geçersiz istek gövdesi.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { error: fail(400, "Gönderilen bilgiler geçersiz. Lütfen alanları kontrol et.") };
  }
  return { data: parsed.data };
}

/**
 * CSRF koruması: durum değiştiren isteklerde Origin başlığı sitenin kendi adresi olmalı.
 * (Oturum çerezi SameSite=Lax; bu kontrol ikinci katmandır.)
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (o.host === host) return true;
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    return !!site && o.origin === new URL(site).origin;
  } catch {
    return false;
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "yerel";
}

// Basit kayan pencere sınırlayıcı. Tek süreçte çalışır; birden çok sunucu için
// aynı arayüz Redis ya da PostgreSQL ile değiştirilebilir.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (!v.some((t) => now - t < windowMs)) hits.delete(k);
    }
  }
  return true;
}

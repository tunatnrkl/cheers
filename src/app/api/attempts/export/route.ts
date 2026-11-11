import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { fail } from "@/lib/server/http";

const EXPORT_PAGE = 5000;

// GET /api/attempts/export?before=<imleç> → oturumdaki kullanıcının cevaplarının tam dökümü, sayfa sayfa (G-2).
// Yalnızca okuma; yalnızca kendi kayıtları (user_id oturumdan gelir, istekten alınmaz).
// Sıra kayıt sırasıdır (id azalan); `at` istemciden gelebildiği için tarihe göre sıralama istemcide yapılır.
// `next` null ise son sayfadır.
// Dikkat: seçimde `id::text AS id` takma adı var; ORDER BY'da tablo adıyla yazılmazsa
// Postgres takma adı (metni) sıralar ve sayfalar kayıt atlar (9. çalışmada yakalandı).
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  const before = new URL(req.url).searchParams.get("before");
  if (before !== null && !/^[1-9]\d{0,17}$/.test(before)) return fail(400, "Geçersiz imleç.");

  const { rows } = await db()!.query(
    `SELECT id::text AS id, hand_id AS "handId", chosen, correct, topic, created_at AS at
       FROM attempts
      WHERE user_id = $1 AND ($2::bigint IS NULL OR attempts.id < $2::bigint)
      ORDER BY attempts.id DESC
      LIMIT ${EXPORT_PAGE}`,
    [user.id, before],
  );
  const next = rows.length === EXPORT_PAGE ? rows[rows.length - 1].id : null;
  return NextResponse.json(
    { attempts: rows.map(({ id: _id, ...a }) => a), next },
    { headers: { "Cache-Control": "no-store" } },
  );
}

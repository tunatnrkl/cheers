import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { fail } from "@/lib/server/http";

const EXPORT_PAGE_SIZE = 5000;

// GET /api/attempts/export?after=<id> → oturumdaki kullanıcının BÜTÜN cevapları, eskiden yeniye,
// sayfa sayfa (G-2: veri taşınabilirliği). `next` null değilse bir sonraki sayfa için `after` olarak
// gönderilir. Yalnızca kendi satırları; `id` yalnızca imleç olarak döner, başka kimseninkine işaret etmez.
export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) return fail(401, "Giriş yapman gerekiyor.");
  const after = new URL(req.url).searchParams.get("after") ?? "0";
  if (!/^\d{1,18}$/.test(after)) return fail(400, "Geçersiz sayfa.");

  const { rows } = await db()!.query(
    // Dikkat: ORDER BY'da tablo adı şart. Yalın "id" metne çevrilmiş çıktı sütununa bağlanır ve
    // sıralama sözlüksel olur ("10" < "9"); imleç sayısal karşılaştırıldığı için satırlar tekrar eder.
    `SELECT attempts.id::text AS id, hand_id AS "handId", chosen, correct, topic, created_at AS at
       FROM attempts WHERE user_id = $1 AND attempts.id > $2::bigint
      ORDER BY attempts.id LIMIT ${EXPORT_PAGE_SIZE + 1}`,
    [user.id, after],
  );
  const more = rows.length > EXPORT_PAGE_SIZE;
  const page = more ? rows.slice(0, EXPORT_PAGE_SIZE) : rows;
  return NextResponse.json(
    {
      attempts: page.map(({ id: _id, ...a }) => a),
      next: more ? page[page.length - 1].id : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import {
  aiConfigured,
  cacheGet,
  cacheKey,
  cacheSet,
  chatSchema,
  describeAiError,
  streamAnswer,
} from "@/lib/server/ai";
import { currentUser } from "@/lib/server/auth";
import { clientIp, fail, rateLimit, readJson, sameOrigin } from "@/lib/server/http";

export const runtime = "nodejs";
export const maxDuration = 120;

const TEXT = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

// POST /api/ai/chat → düz metin akışı (yanıt yazıldıkça gelir)
export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "İstek reddedildi.");

  const parsed = await readJson(req, chatSchema);
  if (parsed.error) return parsed.error;
  const input = parsed.data;

  // Kullanım sınırı: giriş yapan kullanıcı için hesaba, misafir için IP'ye göre
  const user = await currentUser();
  const who = user ? `u:${user.id}` : `ip:${clientIp(req)}`;
  if (!rateLimit(`ai:${who}`, user ? 30 : 12, 10 * 60_000)) {
    return fail(429, "Kısa sürede çok soru sordun. Birkaç dakika sonra yeniden deneyebilirsin.");
  }

  const key = cacheKey(input);
  if (key) {
    const cached = await cacheGet(key);
    if (cached) return new Response(cached, { headers: { ...TEXT, "X-Cache": "hit" } });
  }

  if (!aiConfigured()) {
    return fail(503, "Yapay zeka asistanı bu kurulumda etkin değil (API anahtarı tanımlanmamış).");
  }

  // İlk parçayı yanıt başlamadan bekle: kimlik, kota gibi hatalar düzgün HTTP koduyla dönsün.
  const gen = streamAnswer(input);
  let first: IteratorResult<string, boolean>;
  try {
    first = await gen.next();
  } catch (err) {
    const e = describeAiError(err);
    return fail(e.status, e.message);
  }

  const encoder = new TextEncoder();
  let full = "";
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let step = first;
        while (!step.done) {
          full += step.value;
          controller.enqueue(encoder.encode(step.value));
          step = await gen.next();
        }
        if (step.value && key) await cacheSet(key, full);
      } catch (err) {
        describeAiError(err);
        controller.enqueue(encoder.encode("\n\n(Bağlantı kesildi; yanıt tamamlanamadı.)"));
      } finally {
        controller.close();
      }
    },
    cancel() {
      void gen.return(false);
    },
  });

  return new Response(body, { headers: { ...TEXT, "X-Cache": "miss" } });
}

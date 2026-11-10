import { NextResponse } from "next/server";
import { HANDS, stackBucket } from "@/data/hands";

// GET /api/hands?game=cash&street=flop&pos=BTN&stack=51-100&topic=cbet
export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const hands = HANDS.filter(
    (h) =>
      (!q.get("game") || h.game === q.get("game")) &&
      (!q.get("street") || h.street === q.get("street")) &&
      (!q.get("pos") || h.heroPos === q.get("pos")) &&
      (!q.get("topic") || h.topic === q.get("topic")) &&
      (!q.get("stack") || stackBucket(h.stackBB) === q.get("stack")),
  );
  return NextResponse.json({ count: hands.length, hands });
}

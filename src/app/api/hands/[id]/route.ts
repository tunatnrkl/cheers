import { NextResponse } from "next/server";
import { HAND_BY_ID } from "@/data/hands";

// GET /api/hands/c17
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const hand = HAND_BY_ID.get((await params).id);
  if (!hand) return NextResponse.json({ error: "El bulunamadı." }, { status: 404 });
  return NextResponse.json(hand);
}

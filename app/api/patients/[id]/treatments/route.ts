// app/api/patients/[id]/treatments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withCors, preflight } from "@/app/api/_utils/cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function OPTIONS() {
  return preflight();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const res = await fetch(`${BASE}/api/treatments?patientId=${params.id}`, {
    cache: "no-store",
  });
  const data = await res.json();
  return withCors(NextResponse.json(data, { status: res.status }));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const res = await fetch(`${BASE}/api/treatments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, patient_id: params.id }),
  });
  const data = await res.json();
  return withCors(NextResponse.json(data, { status: res.status }));
}

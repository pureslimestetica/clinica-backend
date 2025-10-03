// app/api/patients/[id]/treatments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // redireciona internamente para /api/treatments?patientId=...
  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost"}/api/treatments`);
  url.searchParams.set("patientId", params.id);
  const res = await fetch(url.toString());
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const payload = { ...body, patient_id: params.id };
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost"}/api/treatments`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

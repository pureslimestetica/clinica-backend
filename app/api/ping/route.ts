// app/api/ping/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, service: "clinica-backend" });
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

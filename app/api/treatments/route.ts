import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Item = {
  asset_id: string | number;
  quantity: number;
};

type Body = {
  patientId: string;
  date: string;
  value?: number;
  nextDate?: string | null;
  items: Item[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.patientId || !body?.date || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    // 1) cria tratamento
    const { data: tr, error: trErr } = await supabaseAdmin
      .from("treatments")
      .insert({
        patient_id: body.patientId,
        date: body.date,
        value: body.value ?? 0,
        next_date: body.nextDate ?? null,
      })
      .select()
      .single();

    if (trErr) {
      return NextResponse.json({ error: trErr.message }, { status: 400 });
    }

    const treatmentId = tr.id;

    // 2) cria aplicações
    const appsPayload = body.items.map((it) => ({
      treatment_id: treatmentId,
      patient_id: body.patientId,
      asset_id: it.asset_id,
      quantity: it.quantity,
    }));

    if (appsPayload.length) {
      const { error: appsErr } = await supabaseAdmin
        .from("applications")
        .insert(appsPayload);
      if (appsErr) {
        return NextResponse.json({ error: appsErr.message }, { status: 400 });
      }
    }

    // 3) baixa estoque (se preferir, troque por RPC decrement_asset_stock)
    for (const it of body.items) {
      const { error: updErr } = await supabaseAdmin.rpc(
        "decrement_asset_stock",
        { p_asset_id: it.asset_id, p_qty: it.quantity }
      );
      if (updErr) {
        console.warn("Falha ao baixar estoque", updErr);
      }
    }

    return NextResponse.json({ ok: true, id: treatmentId }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}

// GET /api/treatments?patientId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    if (!patientId) return NextResponse.json([]);

    const { data, error } = await supabaseAdmin
      .from("treatments")
      .select("id, patient_id, date, value, next_date")
      .eq("patient_id", patientId)
      .order("date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(data || []);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}

// Opcional: silencia preflight/OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

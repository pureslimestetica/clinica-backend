import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  groupAppsByTreatment,
  Application,
  Asset,
} from "@/app/api/_utils/treatments";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    // 1) tratamentos
    const { data: treatments, error: trErr } = await supabaseAdmin
      .from("treatments")
      .select("id, patient_id, date, value, next_date")
      .eq("patient_id", patientId)
      .order("date", { ascending: false });

    if (trErr) {
      return NextResponse.json({ error: trErr.message }, { status: 400 });
    }
    if (!treatments || treatments.length === 0) {
      return NextResponse.json([]);
    }

    const tIds = treatments.map((t) => t.id);

    // 2) applications (itens)
    const { data: apps, error: apErr } = await supabaseAdmin
      .from("applications")
      .select("id, treatment_id, asset_id, quantity")
      .in("treatment_id", tIds);

    if (apErr) {
      return NextResponse.json({ error: apErr.message }, { status: 400 });
    }

    // 3) assets usados
    const assetIds = [...new Set((apps || []).map((a) => a.asset_id))];
    let assetsByList: Asset[] = [];
    if (assetIds.length) {
      const { data: assets, error: asErr } = await supabaseAdmin
        .from("assets")
        .select("id, name, unit")
        .in("id", assetIds);

      if (asErr) {
        return NextResponse.json({ error: asErr.message }, { status: 400 });
      }
      assetsByList = (assets || []) as unknown as Asset[];
    }

    // 4) agrega itens por tratamento (tipagem explícita)
    const grouped = groupAppsByTreatment(
      (apps || []) as unknown as Application[],
      assetsByList
    );

    const out = treatments.map((t) => ({
      id: t.id,
      date: t.date,
      value: t.value,
      next_date: t.next_date,
      items: grouped[String(t.id)] || [],
    }));

    return NextResponse.json(out);
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

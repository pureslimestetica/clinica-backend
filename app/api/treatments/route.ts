// app/api/treatments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";

type Item = { asset_id: string; quantity: number };

async function listWithItems(patientId: string) {
  const { data: treatments, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);

  // pega itens em lote
  const ids = (treatments ?? []).map((t) => t.id);
  if (!ids.length) return [];

  const { data: items, error: e2 } = await supabase
    .from("treatment_items")
    .select("id, treatment_id, quantity, asset:assets(id,name,unit)")
    .in("treatment_id", ids);

  if (e2) throw new Error(e2.message);

  const byTreat: Record<string, any[]> = {};
  (items || []).forEach((it) => {
    (byTreat[it.treatment_id] ||= []).push({
      id: it.id,
      asset_id: it.asset?.id,
      asset_name: it.asset?.name,
      unit: it.asset?.unit,
      quantity: it.quantity,
    });
  });

  return (treatments || []).map((t) => ({
    ...t,
    items: byTreat[t.id] || [],
  }));
}

export async function GET(req: NextRequest) {
  try {
    const patientId = req.nextUrl.searchParams.get("patientId");
    if (!patientId) {
      return NextResponse.json(
        { error: "Parâmetro patientId é obrigatório" },
        { status: 400 }
      );
    }

    const list = await listWithItems(patientId);
    return NextResponse.json(list);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Formatos aceitos (A/B/C). Normalizamos aqui:
    const patient_id =
      body.patient_id ?? body.patientId ?? body.patient ?? null;
    if (!patient_id)
      return NextResponse.json(
        { error: "patient_id é obrigatório" },
        { status: 400 }
      );

    const date =
      body.date ||
      body.application_date ||
      new Date().toISOString().slice(0, 10);
    const value_paid = body.value_paid ?? body.value ?? null;
    const next_date = body.next_date ?? body.next_application ?? null;

    const rawItems: Item[] =
      body.items ??
      body.assets ??
      body.lines?.map((l: any) => ({
        asset_id: l.asset_id,
        quantity: l.qty ?? l.quantity,
      })) ??
      [];

    if (!rawItems.length)
      return NextResponse.json(
        { error: "Informe pelo menos um item (asset_id, quantity)" },
        { status: 400 }
      );

    // 1) cria tratamento
    const { data: created, error: e1 } = await supabase
      .from("treatments")
      .insert([{ patient_id, date, value_paid, next_date }])
      .select("*")
      .single();
    if (e1) throw new Error(e1.message);

    // 2) insere itens
    const itemsToInsert = rawItems.map((it) => ({
      treatment_id: created.id,
      asset_id: it.asset_id,
      quantity: Number(it.quantity),
    }));
    const { error: e2 } = await supabase
      .from("treatment_items")
      .insert(itemsToInsert);
    if (e2) throw new Error(e2.message);

    // 3) baixa do estoque
    for (const it of rawItems) {
      const { data: assetRow, error: eA } = await supabase
        .from("assets")
        .select("id, quantity")
        .eq("id", it.asset_id)
        .single();
      if (eA) throw new Error(eA.message);
      const newQty = Math.max(0, Number(assetRow.quantity ?? 0) - Number(it.quantity));
      const { error: eU } = await supabase
        .from("assets")
        .update({ quantity: newQty })
        .eq("id", it.asset_id);
      if (eU) throw new Error(eU.message);
    }

    // 4) retorna com itens
    const full = await listWithItems(patient_id);
    const justCreated = full.find((t: any) => t.id === created.id) || created;

    return NextResponse.json(justCreated, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao criar tratamento" },
      { status: 500 }
    );
  }
}

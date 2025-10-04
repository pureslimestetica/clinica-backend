import { NextRequest, NextResponse } from "next/server";
import { withCors, preflight } from "../../_utils/cors";
import {
  listTreatmentsWithItems,
  createTreatmentAndDecreaseStock,
  TreatmentItem,
} from "../../_utils/treatments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflight();
}

export async function GET(req: NextRequest) {
  try {
    const pid = req.nextUrl.searchParams.get("patientId");
    if (!pid) {
      return withCors(
        NextResponse.json({ error: "patientId é obrigatório" }, { status: 400 })
      );
    }
    const list = await listTreatmentsWithItems(pid);
    return withCors(NextResponse.json(list));
  } catch (e: any) {
    return withCors(
      NextResponse.json({ error: e.message || "Erro ao listar" }, { status: 500 })
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const patient_id = body.patient_id ?? body.patientId;
    if (!patient_id) {
      return withCors(
        NextResponse.json({ error: "patient_id é obrigatório" }, { status: 400 })
      );
    }

    const date = (body.date || new Date().toISOString().slice(0, 10)) as string;
    const value_paid = body.value_paid ?? body.value ?? null;
    const next_date = body.next_date ?? body.next_application ?? null;

    const items: TreatmentItem[] =
      body.items ??
      body.assets ??
      body.lines?.map((l: any) => ({
        asset_id: l.asset_id,
        quantity: l.qty ?? l.quantity,
      })) ??
      [];

    if (!Array.isArray(items) || !items.length) {
      return withCors(
        NextResponse.json(
          { error: "Informe itens: [{ asset_id, quantity }]" },
          { status: 400 }
        )
      );
    }

    const created = await createTreatmentAndDecreaseStock({
      patient_id,
      date,
      value_paid,
      next_date,
      items,
    });

    const full = (await listTreatmentsWithItems(patient_id)).find(
      (t: any) => t.id === created.id
    );

    return withCors(NextResponse.json(full || created, { status: 201 }));
  } catch (e: any) {
    return withCors(
      NextResponse.json({ error: e.message || "Erro ao criar" }, { status: 500 })
    );
  }
}

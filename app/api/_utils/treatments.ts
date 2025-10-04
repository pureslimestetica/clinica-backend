import { supabaseAdmin as supabase } from "../../../lib/supabaseAdmin";

export type TreatmentItem = { asset_id: string; quantity: number };

export async function listTreatmentsWithItems(patientId: string) {
  const { data: treatments, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  const ids = (treatments ?? []).map((t) => t.id);
  if (!ids.length) return [];

  const { data: items, error: e2 } = await supabase
    .from("treatment_items")
    .select("id, treatment_id, quantity, asset:assets(id,name,unit)")
    .in("treatment_id", ids);

  if (e2) throw new Error(e2.message);

  const group: Record<string, any[]> = {};
  (items || []).forEach((it) => {
    (group[it.treatment_id] ||= []).push({
      id: it.id,
      asset_id: it.asset?.id,
      asset_name: it.asset?.name,
      unit: it.asset?.unit,
      quantity: it.quantity,
    });
  });

  return (treatments || []).map((t) => ({
    ...t,
    items: group[t.id] || [],
  }));
}

export async function createTreatmentAndDecreaseStock(params: {
  patient_id: string;
  date: string; // yyyy-mm-dd
  value_paid: number | null;
  next_date: string | null; // yyyy-mm-dd | null
  items: TreatmentItem[];
}) {
  const { patient_id, date, value_paid, next_date, items } = params;

  const { data: created, error: e1 } = await supabase
    .from("treatments")
    .insert([{ patient_id, date, value_paid, next_date }])
    .select("*")
    .single();
  if (e1) throw new Error(e1.message);

  const rows = items.map((it) => ({
    treatment_id: created.id,
    asset_id: it.asset_id,
    quantity: Number(it.quantity),
  }));
  const { error: e2 } = await supabase.from("treatment_items").insert(rows);
  if (e2) throw new Error(e2.message);

  for (const it of items) {
    const { data: asset, error: eL } = await supabase
      .from("assets")
      .select("id, quantity")
      .eq("id", it.asset_id)
      .single();
    if (eL) throw new Error(eL.message);

    const newQty = Math.max(0, Number(asset?.quantity ?? 0) - Number(it.quantity));
    const { error: eU } = await supabase
      .from("assets")
      .update({ quantity: newQty })
      .eq("id", it.asset_id);
    if (eU) throw new Error(eU.message);
  }

  return created;
}

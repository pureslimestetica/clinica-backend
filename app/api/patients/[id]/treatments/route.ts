// app/api/patients/[id]/treatments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

type Item = { asset_id: string; qty: number }

function num(v: any, def = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id

    // tratamentos do paciente
    const { data: treatments, error: tErr } = await supabaseAdmin
      .from('treatments')
      .select('id, date, value_paid, next_date, created_at')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })

    if (tErr) {
      return NextResponse.json({ error: tErr.message }, { status: 400 })
    }

    if (!treatments || treatments.length === 0) {
      return NextResponse.json({ treatments: [] }, { status: 200 })
    }

    const ids = treatments.map(t => t.id)

    // itens
    const { data: items, error: iErr } = await supabaseAdmin
      .from('treatment_items')
      .select('treatment_id, asset_id, qty')
      .in('treatment_id', ids)

    if (iErr) {
      return NextResponse.json({ error: iErr.message }, { status: 400 })
    }

    // nomes dos ativos
    const assetIds = Array.from(new Set((items ?? []).map(i => i.asset_id)))
    let assetsById = new Map<string, { name: string; unit: string | null }>()
    if (assetIds.length > 0) {
      const { data: assets } = await supabaseAdmin
        .from('assets')
        .select('id, name, unit')
        .in('id', assetIds)

      for (const a of assets ?? []) {
        assetsById.set(a.id, { name: a.name, unit: a.unit ?? null })
      }
    }

    const itemsByTreatment = new Map<string, any[]>()
    for (const it of items ?? []) {
      const arr = itemsByTreatment.get(it.treatment_id) ?? []
      const meta = assetsById.get(it.asset_id)
      arr.push({
        asset_id: it.asset_id,
        asset_name: meta?.name ?? '',
        unit: meta?.unit ?? null,
        qty: num(it.qty, 0),
      })
      itemsByTreatment.set(it.treatment_id, arr)
    }

    const result = treatments.map(t => ({
      ...t,
      items: itemsByTreatment.get(t.id) ?? [],
    }))

    return NextResponse.json({ treatments: result }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id
    const body = await req.json()

    const date: string = body?.date // 'YYYY-MM-DD'
    const value_paid: number = num(body?.value_paid, 0)
    const next_date: string | null = body?.next_date || null
    const items: Item[] = Array.isArray(body?.items) ? body.items : []

    if (!date) {
      return NextResponse.json({ error: 'date obrigatório' }, { status: 400 })
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Nenhum item informado' }, { status: 400 })
    }

    // cria tratamento
    const { data: created, error: insErr } = await supabaseAdmin
      .from('treatments')
      .insert([{ patient_id: patientId, date, value_paid, next_date }])
      .select('id')
      .single()

    if (insErr || !created) {
      return NextResponse.json({ error: insErr?.message ?? 'Falha ao criar tratamento' }, { status: 400 })
    }

    const treatmentId = created.id

    // cria itens
    const rows = items.map(it => ({
      treatment_id: treatmentId,
      asset_id: it.asset_id,
      qty: num(it.qty, 0),
    }))

    const { error: itemsErr } = await supabaseAdmin
      .from('treatment_items')
      .insert(rows)

    if (itemsErr) {
      return NextResponse.json({ error: itemsErr.message }, { status: 400 })
    }

    // baixa de estoque (simples, sem transação)
    for (const r of rows) {
      const { data: a } = await supabaseAdmin
        .from('assets')
        .select('quantity')
        .eq('id', r.asset_id)
        .single()

      const current = num(a?.quantity, 0)
      const next = Math.max(0, current - num(r.qty, 0))

      await supabaseAdmin
        .from('assets')
        .update({ quantity: next })
        .eq('id', r.asset_id)
    }

    return NextResponse.json({ ok: true, id: treatmentId }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}

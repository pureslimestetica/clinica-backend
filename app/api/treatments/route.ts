// app/api/treatments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function num(v: any, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d }

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId obrigatório' }, { status: 400 })

  // reaproveita a lógica da rota por paciente
  try {
    const { data: treatments, error: tErr } = await supabaseAdmin
      .from('treatments')
      .select('id, date, value_paid, next_date, created_at')
      .eq('patient_id', patientId)
      .order('date', { ascending: false })

    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 400 })

    if (!treatments || treatments.length === 0) {
      return NextResponse.json({ treatments: [] }, { status: 200 })
    }

    const ids = treatments.map(t => t.id)
    const { data: items } = await supabaseAdmin
      .from('treatment_items')
      .select('treatment_id, asset_id, qty')
      .in('treatment_id', ids)

    const assetIds = Array.from(new Set((items ?? []).map(i => i.asset_id)))
    const { data: assets } = await supabaseAdmin
      .from('assets')
      .select('id, name, unit')
      .in('id', assetIds)

    const meta = new Map<string, { name: string; unit: string | null }>()
    for (const a of assets ?? []) meta.set(a.id, { name: a.name, unit: a.unit ?? null })

    const itemsByTreatment = new Map<string, any[]>()
    for (const it of items ?? []) {
      const arr = itemsByTreatment.get(it.treatment_id) ?? []
      const m = meta.get(it.asset_id)
      arr.push({ asset_id: it.asset_id, asset_name: m?.name ?? '', unit: m?.unit ?? null, qty: num(it.qty) })
      itemsByTreatment.set(it.treatment_id, arr)
    }

    const result = (treatments ?? []).map(t => ({ ...t, items: itemsByTreatment.get(t.id) ?? [] }))
    return NextResponse.json({ treatments: result }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get('patientId')
  if (!patientId) return NextResponse.json({ error: 'patientId obrigatório' }, { status: 400 })

  const body = await req.json()
  const date: string = body?.date
  const value_paid: number = num(body?.value_paid, 0)
  const next_date: string | null = body?.next_date || null
  const items: Array<{ asset_id: string; qty: number }> = Array.isArray(body?.items) ? body.items : []

  if (!date) return NextResponse.json({ error: 'date obrigatório' }, { status: 400 })
  if (items.length === 0) return NextResponse.json({ error: 'Nenhum item informado' }, { status: 400 })

  // mesma lógica da outra rota
  const { data: created, error: insErr } = await supabaseAdmin
    .from('treatments')
    .insert([{ patient_id: patientId, date, value_paid, next_date }])
    .select('id')
    .single()

  if (insErr || !created) {
    return NextResponse.json({ error: insErr?.message ?? 'Falha ao criar tratamento' }, { status: 400 })
  }

  const treatmentId = created.id

  const rows = items.map(it => ({ treatment_id: treatmentId, asset_id: it.asset_id, qty: num(it.qty, 0) }))
  const { error: itemsErr } = await supabaseAdmin.from('treatment_items').insert(rows)
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 400 })

  for (const r of rows) {
    const { data: a } = await supabaseAdmin.from('assets').select('quantity').eq('id', r.asset_id).single()
    const next = Math.max(0, num(a?.quantity, 0) - num(r.qty, 0))
    await supabaseAdmin.from('assets').update({ quantity: next }).eq('id', r.asset_id)
  }

  return NextResponse.json({ ok: true, id: treatmentId }, { status: 201 })
}

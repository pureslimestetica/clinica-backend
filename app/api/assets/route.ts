import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

function corsJson(data: any, init?: ResponseInit) {
  return NextResponse.json(data, { ...(init ?? {}), headers: { ...(init?.headers ?? {}), ...CORS } })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('assets').select('*')
  if (error) return corsJson({ error: error.message, code: 'DB_SELECT' }, { status: 500 })
  return corsJson(data ?? [])
}

async function readBody(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) return await req.json()
  } catch {}
  try {
    const form = await req.formData()
    return Object.fromEntries(form.entries())
  } catch {}
  return {}
}

function toNumberOrNull(v: any) {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export async function POST(req: NextRequest) {
  try {
    const b: any = await readBody(req)

    // aceita "nome/laboratorio/quantidade/unidade" e/ou "name/lab/quantity/unit"
    const payload = {
      name: (b.name ?? b.nome ?? '').toString() || null,
      lab: (b.lab ?? b.laboratorio ?? '').toString() || null,
      quantity: toNumberOrNull(b.quantity ?? b.quantidade),
      unit: (b.unit ?? b.unidade ?? '').toString() || null,
    }

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert(payload)
      .select()
      .single()

    if (error) {
      // devolve o erro do banco p/ aparecer no alerta
      return corsJson({ error: error.message, code: 'DB_INSERT', payload }, { status: 400 })
    }

    return corsJson(data, { status: 201 })
  } catch (e: any) {
    return corsJson({ error: e?.message || 'Bad Request', code: 'UNEXPECTED' }, { status: 400 })
  }
}

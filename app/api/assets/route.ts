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
  const { data, error } = await supabaseAdmin
    .from('assets')
    .select('*')
  if (error) return corsJson({ error: error.message }, { status: 500 })
  return corsJson(data ?? [])
}

async function readBody(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) {
      return await req.json()
    }
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await req.formData()
      return Object.fromEntries(form.entries())
    }
    // tentativa final
    return await req.json()
  } catch {
    try {
      const form = await req.formData()
      return Object.fromEntries(form.entries())
    } catch {
      return {}
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await readBody(req)

    const row = {
      name: body?.name ?? null,
      lab: body?.lab ?? null,
      quantity:
        body?.quantity === '' || body?.quantity === undefined || body?.quantity === null
          ? null
          : Number(body.quantity),
      unit: body?.unit ?? null,
    }

    const { data, error } = await supabaseAdmin.from('assets').insert(row).select().single()
    if (error) return corsJson({ error: error.message }, { status: 400 })

    return corsJson(data, { status: 201 })
  } catch {
    return corsJson({ error: 'Bad Request' }, { status: 400 })
  }
}

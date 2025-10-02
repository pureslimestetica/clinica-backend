import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
}

function corsJson(data: any, init?: ResponseInit) {
  return NextResponse.json(data, { ...(init ?? {}), headers: { ...(init?.headers ?? {}), ...CORS } })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

async function readBody(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''
  try {
    if (ct.includes('application/json')) return await req.json()
    const form = await req.formData()
    return Object.fromEntries(form.entries())
  } catch {
    return {}
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body: any = await readBody(req)

    const patch: any = {}
    if ('name' in body) patch.name = body.name ?? null
    if ('lab' in body) patch.lab = body.lab ?? null
    if ('quantity' in body) {
      patch.quantity =
        body.quantity === '' || body.quantity === undefined || body.quantity === null
          ? null
          : Number(body.quantity)
    }
    if ('unit' in body) patch.unit = body.unit ?? null

    const { data, error } = await supabaseAdmin.from('assets').update(patch).eq('id', id).select().single()
    if (error) return corsJson({ error: error.message }, { status: 400 })

    return corsJson(data)
  } catch {
    return corsJson({ error: 'Bad Request' }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin.from('assets').delete().eq('id', params.id)
  if (error) return corsJson({ error: error.message }, { status: 400 })
  return corsJson({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json()

    const patch: any = {}
    if ('name' in body) patch.name = body.name ?? null
    if ('lab' in body) patch.lab = body.lab ?? null
    if ('quantity' in body) {
      patch.quantity = body.quantity === null || body.quantity === undefined ? null : Number(body.quantity)
    }
    if ('unit' in body) patch.unit = body.unit ?? null

    const { data, error } = await supabaseAdmin
      .from('assets')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS })
    }
    return NextResponse.json(data, { headers: CORS })
  } catch (e: any) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400, headers: CORS })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  const { error } = await supabaseAdmin.from('assets').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: CORS })
  }
  return NextResponse.json({ ok: true }, { headers: CORS })
}

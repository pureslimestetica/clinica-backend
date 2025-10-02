import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS })
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
  }

  return NextResponse.json(data ?? [], { headers: CORS })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const row = {
      name: body?.name ?? null,
      lab: body?.lab ?? null,
      quantity: body?.quantity === null || body?.quantity === undefined ? null : Number(body.quantity),
      unit: body?.unit ?? null,
    }

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert(row)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS })
    }
    return NextResponse.json(data, { status: 201, headers: CORS })
  } catch (e: any) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400, headers: CORS })
  }
}

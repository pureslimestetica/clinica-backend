import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers });
}

// GET /api/assets?q=texto
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() || '';

  let query = supabaseAdmin
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (q) query = query.ilike('name', `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
  return NextResponse.json(data ?? [], { status: 200, headers });
}

// POST /api/assets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert({
        name: body.name ?? null,
        lab: body.lab ?? null,
        quantity: body.quantity === '' || body.quantity === undefined ? null : Number(body.quantity),
        unit: body.unit ?? null, // 'MG' | 'ML'
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
    return NextResponse.json(data, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro' }, { status: 500, headers });
  }
}

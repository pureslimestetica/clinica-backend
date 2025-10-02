import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';

function cors(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = new Set([
    'https://clinicapureslim.com.br',
    'https://www.clinicapureslim.com.br',
  ]);
  const allow = allowed.has(origin) ? origin : 'https://clinicapureslim.com.br';

  return {
    'Access-Control-Allow-Origin': allow,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/assets  -> lista ativos
export async function GET(req: NextRequest) {
  const headers = cors(req);
  const { data, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers });
  }
  return NextResponse.json(data || [], { status: 200, headers });
}

// POST /api/assets  -> cria ativo
export async function POST(req: NextRequest) {
  const headers = cors(req);
  try {
    const body = await req.json();
    const payload = {
      name: body?.name ?? null,
      lab: body?.lab ?? null,
      quantity: body?.quantity ?? null,
      unit: body?.unit ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers });
    }

    return NextResponse.json(data, { status: 201, headers });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Erro inesperado' },
      { status: 500, headers }
    );
  }
}

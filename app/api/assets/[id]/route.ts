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
    'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: cors(req) });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = cors(req);
  try {
    const body = await req.json();
    const updates: any = {};
    if (body?.name !== undefined) updates.name = body.name;
    if (body?.lab !== undefined) updates.lab = body.lab;
    if (body?.quantity !== undefined) updates.quantity = body.quantity;
    if (body?.unit !== undefined) updates.unit = body.unit;

    const { data, error } = await supabaseAdmin
      .from('assets')
      .update(updates)
      .eq('id', params.id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers });
    }
    return NextResponse.json(data, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Erro inesperado' },
      { status: 500, headers }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const headers = cors(req);
  const { error } = await supabaseAdmin.from('assets').delete().eq('id', params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers });
  }
  return new NextResponse(null, { status: 204, headers });
}

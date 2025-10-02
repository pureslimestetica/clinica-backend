import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers });
}

// PATCH /api/assets/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const payload = {
      name: body.name ?? null,
      lab: body.lab ?? null,
      quantity: body.quantity === '' || body.quantity === undefined ? null : Number(body.quantity),
      unit: body.unit ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('assets')
      .update(payload)
      .eq('id', params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
    return NextResponse.json(data, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro' }, { status: 500, headers });
  }
}

// DELETE /api/assets/:id
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('assets').delete().eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
    return new NextResponse(null, { status: 204, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro' }, { status: 500, headers });
  }
}

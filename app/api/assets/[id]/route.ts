// app/api/assets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function normalizeUnit(raw?: string): 'ml' | 'mg' | 'un' {
  const s = (raw ?? '').toLowerCase().replace(/\s+/g, '');
  if (s.includes('ml')) return 'ml';
  if (s.includes('mg')) return 'mg';
  if (['un', 'uni', 'und', 'unid', 'unidade', 'unidades'].some(k => s.includes(k))) return 'un';
  return 'ml';
}

/**
 * PATCH /api/assets/:id
 * Body JSON: (qualquer campo opcional) { name?, laboratory?, quantity?, unit? }
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => ({}));

    const update: any = {};
    if (typeof body?.name === 'string') update.name = String(body.name).trim();
    if (typeof body?.laboratory === 'string') update.laboratory = String(body.laboratory).trim();
    if (body?.quantity !== undefined) {
      const q = Number(body.quantity);
      if (!Number.isFinite(q) || q <= 0) {
        return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400, headers: CORS });
      }
      update.quantity = q;
    }
    if (typeof body?.unit === 'string') {
      update.unit = normalizeUnit(body.unit);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400, headers: CORS });
    }

    const { data, error } = await supabaseAdmin
      .from('assets')
      .update(update)
      .eq('id', params.id)
      .select('id, name, laboratory, quantity, unit, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS });
    }
    return NextResponse.json({ item: data }, { status: 200, headers: CORS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'PATCH failed' }, { status: 500, headers: CORS });
  }
}

/**
 * DELETE /api/assets/:id
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await supabaseAdmin.from('assets').delete().eq('id', params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS });
    }
    return new NextResponse(null, { status: 204, headers: CORS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'DELETE failed' }, { status: 500, headers: CORS });
  }
}

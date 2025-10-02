import { NextRequest, NextResponse } from 'next/server';
import supabaseAdmin from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Preflight (CORS)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

// PATCH /api/assets/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));

    const toNull = (v: any) =>
      v === undefined || v === null || (typeof v === 'string' && v.trim() === '')
        ? null
        : v;

    const toNumberOrNull = (v: any) => {
      if (v === undefined || v === null || String(v).trim() === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const payload: any = {
      name: toNull(body.name),
      lab: toNull(body.lab),
      quantity: toNumberOrNull(body.quantity),
      unit: toNull(body.unit),
    };

    const { data, error } = await supabaseAdmin
      .from('assets')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 });
  }
}

// DELETE /api/assets/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const { error } = await supabaseAdmin.from('assets').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 });
  }
}

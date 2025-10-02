import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // se quiser travar, troque por https://clinicapureslim.com.br
  'Access-Control-Allow-Methods': 'PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json();

    const toNull = (v: any) =>
      v === undefined || v === null || (typeof v === 'string' && v.trim() === '') ? null : v;

    const payload = {
      name: toNull(body?.name),
      lab: toNull(body?.lab),
      quantity:
        body?.quantity === '' || body?.quantity === null || body?.quantity === undefined
          ? null
          : Number(body.quantity),
      unit: toNull(body?.unit),
    };

    const { data, error } = await supabaseAdmin
      .from('assets')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json(data, { status: 200, headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;

    const { error } = await supabaseAdmin.from('assets').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500, headers: corsHeaders });
  }
}

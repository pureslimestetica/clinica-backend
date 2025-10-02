import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // se quiser travar, troque por https://clinicapureslim.com.br
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }

  return NextResponse.json(data ?? [], { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body?.name ?? null;
    const lab = body?.lab ?? null;
    const unit = body?.unit ?? null;

    const qtyParsed =
      body?.quantity === '' || body?.quantity === null || body?.quantity === undefined
        ? null
        : Number(body.quantity);

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert({
        name,
        lab,
        quantity: qtyParsed,
        unit,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json(data, { status: 201, headers: corsHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'unknown' }, { status: 500, headers: corsHeaders });
  }
}

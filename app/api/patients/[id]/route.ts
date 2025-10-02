import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers });
}

function toNull(v: any) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  return v;
}
function toIntOrNull(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// PATCH /api/patients/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const payload = {
      full_name: toNull(body.full_name),
      age: toIntOrNull(body.age),
      birth_date: toNull(body.birth_date),
      contact: toNull(body.contact),
      email: toNull(body.email),
    };

    const { data, error } = await supabaseAdmin
      .from('patients')
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

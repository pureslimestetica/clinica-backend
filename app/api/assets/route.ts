import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin'; // <- named import

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Preflight (CORS)
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

// GET /api/assets?q=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() ?? '';

    let query = supabaseAdmin
      .from('assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (q) {
      query = query.or(`name.ilike.%${q}%,lab.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? [], { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 });
  }
}

// POST /api/assets  { name, lab, quantity, unit }
export async function POST(req: NextRequest) {
  try {
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

    const payload = {
      name: toNull(body.name),
      lab: toNull(body.lab),
      quantity: toNumberOrNull(body.quantity),
      unit: toNull(body.unit),
    };

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro' }, { status: 500 });
  }
}

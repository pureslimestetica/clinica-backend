import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_ORIGIN = 'https://clinicapureslim.com.br';
function cors() {
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', CORS_ORIGIN);
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return h;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

function sanitizeUnit(v: unknown): '1ml' | '2ml' | '5ml' | '10ml' {
  const map = new Set(['1ml', '2ml', '5ml', '10ml']);
  const s = String(v ?? '').toLowerCase().replace(/\s+/g, '');
  return (map.has(s) ? (s as any) : '1ml');
}

// GET /api/assets
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q')?.trim();

    let query = supabaseAdmin
      .from('assets')
      .select('id, name, quantity, laboratory, unit2, unit, expires_at')
      .order('id', { ascending: false });

    if (q) {
      query = query.ilike('name', `%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const list = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? '',
      quantity: row.quantity ?? 0,
      laboratory: row.laboratory ?? '',
      unit: (row.unit2 ?? row.unit ?? '1ml') as string,
      expires_at: row.expires_at ?? null,
    }));

    return NextResponse.json(list, { headers: cors() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao listar' }, { status: 400, headers: cors() });
  }
}

// POST /api/assets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? '').trim();
    const laboratory = String(body?.laboratory ?? '').trim();
    const quantity = Number(body?.quantity ?? 0) || 0;
    const unit = sanitizeUnit(body?.unit);
    const expires_at = body?.expires_at ? String(body.expires_at) : null; // YYYY-MM-DD

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400, headers: cors() });
    }

    const payload: any = {
      name,
      laboratory,
      quantity,
      unit2: unit,
      ...(expires_at ? { expires_at } : {})
    };

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert([payload])
      .select('id, name, quantity, laboratory, unit2, expires_at')
      .single();

    if (error) throw error;

    const created = {
      id: data.id,
      name: data.name,
      quantity: data.quantity,
      laboratory: data.laboratory,
      unit: data.unit2,
      expires_at: data.expires_at ?? null,
    };

    return NextResponse.json(created, { status: 201, headers: cors() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Erro ao salvar' }, { status: 400, headers: cors() });
  }
}

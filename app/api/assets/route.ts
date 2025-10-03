// app/api/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// CORS simples
function cors() {
  const h = new Headers();
  h.set('Access-Control-Allow-Origin', 'https://clinicapureslim.com.br');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return h;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

// Normaliza unidade -> '1ml' | '2ml' | '5ml' | '10ml'
function sanitizeUnit(v: unknown): '1ml' | '2ml' | '5ml' | '10ml' {
  const map = new Set(['1ml', '2ml', '5ml', '10ml']);
  const s = String(v ?? '').toLowerCase().replace(/\s+/g, '');
  return (map.has(s) ? (s as any) : '1ml');
}

// GET /api/assets  -> lista
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('assets')
      // Lê unit como COALESCE(unit2, unit)
      .select(`
        id,
        name,
        quantity,
        laboratory,
        unit2,
        unit
      `)
      .order('id', { ascending: false });

    if (error) throw error;

    const list = (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name ?? '',
      quantity: row.quantity ?? 0,
      laboratory: row.laboratory ?? '',
      unit: (row.unit2 ?? row.unit ?? '1ml') as string,
    }));

    return NextResponse.json(list, { headers: cors() });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Erro ao listar' },
      { status: 400, headers: cors() }
    );
  }
}

// POST /api/assets  -> cria
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? '').trim();
    const laboratory = String(body?.laboratory ?? '').trim();
    const quantity = Number(body?.quantity ?? 0) || 0;
    const unit = sanitizeUnit(body?.unit);

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400, headers: cors() }
      );
    }

    const payload = {
      name,
      laboratory,
      quantity,
      unit2: unit, // <— grava SOMENTE em unit2
    };

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert([payload])
      .select('id, name, quantity, laboratory, unit2')
      .single();

    if (error) throw error;

    const created = {
      id: data.id,
      name: data.name,
      quantity: data.quantity,
      laboratory: data.laboratory,
      unit: data.unit2, // resposta consistente com o front
    };

    return NextResponse.json(created, { status: 201, headers: cors() });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Erro ao salvar' },
      { status: 400, headers: cors() }
    );
  }
}

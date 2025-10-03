// app/api/assets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

// Normaliza qualquer coisa digitada em "unit" para um dos valores aceitos no banco
function normalizeUnit(raw?: string): 'ml' | 'mg' | 'un' {
  const s = (raw ?? '').toLowerCase().replace(/\s+/g, '');
  if (s.includes('ml')) return 'ml';
  if (s.includes('mg')) return 'mg';
  // aceita várias variações de "unidade"
  if (['un', 'uni', 'und', 'unid', 'unidade', 'unidades'].some(k => s.includes(k))) return 'un';
  // padrão
  return 'ml';
}

/**
 * GET /api/assets
 * Lista todos os ativos (ajuste conforme sua necessidade / filtros)
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('assets')
      .select('id, name, laboratory, quantity, unit, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS });
    }
    return NextResponse.json({ items: data ?? [] }, { status: 200, headers: CORS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'GET failed' }, { status: 500, headers: CORS });
  }
}

/**
 * POST /api/assets
 * Body JSON: { name: string, laboratory: string, quantity: number, unit: string }
 * Ex.: unit pode vir "2 ml", "2ml", "ml", "mg", "un" etc — será normalizado.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name ?? '').trim();
    const laboratory = String(body?.laboratory ?? '').trim();
    const quantity = Number(body?.quantity ?? 0);
    const unit = normalizeUnit(String(body?.unit ?? ''));

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400, headers: CORS });
    }
    if (!laboratory) {
      return NextResponse.json({ error: 'Laboratório é obrigatório' }, { status: 400, headers: CORS });
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400, headers: CORS });
    }

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert({ name, laboratory, quantity, unit })
      .select('id, name, laboratory, quantity, unit, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS });
    }
    return NextResponse.json({ item: data }, { status: 201, headers: CORS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'POST failed' }, { status: 500, headers: CORS });
  }
}

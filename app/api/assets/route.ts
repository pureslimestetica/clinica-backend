import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

// ajuste se quiser ler de variável:
// const ORIGIN = process.env.CORS_ORIGIN ?? 'https://clinicapureslim.com.br';
const ORIGIN = 'https://clinicapureslim.com.br';

const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCORS<T>(data: T, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

// Normaliza "1ml", "2ml", "5ml", "10ml" -> "ml"
// (se vier "mg" ou "un", mantém; pode expandir se precisar)
function normalizeUnit(input?: string | null): 'ml' | 'mg' | 'un' | null {
  if (!input) return null;
  const val = String(input).trim().toLowerCase();
  // bate "2ml", "10ml", "ml" etc.
  const m = val.match(/^(\d+)?\s*(ml|mg|un)$/i);
  if (m) {
    const unit = m[2].toLowerCase();
    if (unit === 'ml' || unit === 'mg' || unit === 'un') return unit as 'ml' | 'mg' | 'un';
  }
  // fallback: se contiver "ml", grava ml
  if (val.includes('ml')) return 'ml';
  if (val.includes('mg')) return 'mg';
  if (val.includes('un')) return 'un';
  return null;
}

/**
 * GET /api/assets
 * Lista os ativos: id, name, laboratory, quantity, unit
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('assets')
      .select('id, name, laboratory, quantity, unit')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return withCORS({ items: data ?? [] });
  } catch (e: any) {
    return withCORS({ error: e?.message || 'failed' }, 500);
  }
}

/**
 * POST /api/assets
 * Body JSON: { name: string, laboratory: string, quantity: number, unit: "1ml" | "2ml" | "5ml" | "10ml" | "ml" | "mg" | "un" }
 * Salva normalizando unit para "ml" | "mg" | "un" (CHECK da tabela).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body?.name ?? '').toString().trim();
    const laboratory = (body?.laboratory ?? '').toString().trim();
    const quantity = Number(body?.quantity);
    const unitNorm = normalizeUnit(body?.unit);

    if (!name) return withCORS({ error: 'name required' }, 400);
    if (!laboratory) return withCORS({ error: 'laboratory required' }, 400);
    if (!Number.isFinite(quantity) || quantity <= 0) return withCORS({ error: 'quantity invalid' }, 400);

    // se não deu pra normalizar, força "ml" (alinha com o CHECK da tabela)
    const unit = unitNorm ?? 'ml';

    const { data, error } = await supabaseAdmin
      .from('assets')
      .insert([{ name, laboratory, quantity, unit }])
      .select('id')
      .single();

    if (error) throw error;
    return withCORS({ id: data?.id }, 201);
  } catch (e: any) {
    return withCORS({ error: e?.message || 'failed' }, 400);
  }
}

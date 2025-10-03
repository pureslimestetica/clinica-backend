import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const ORIGIN = 'https://clinicapureslim.com.br';
const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function withCORS<T>(data: T, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

/**
 * DELETE /api/assets/:id
 */
export async function DELETE(
  _req: Request,
  ctx: { params: { id: string } }
) {
  try {
    const id = ctx.params.id;
    if (!id) return withCORS({ error: 'id required' }, 400);

    const { error } = await supabaseAdmin.from('assets').delete().eq('id', id);
    if (error) throw error;

    return withCORS({ ok: true });
  } catch (e: any) {
    return withCORS({ error: e?.message || 'failed' }, 400);
  }
}

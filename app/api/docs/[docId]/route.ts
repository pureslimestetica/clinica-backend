import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_ORIGIN = 'https://clinicapureslim.com.br';
const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Methods': 'GET,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/docs/:docId
export async function GET(_req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, patient_id, category, file_name, storage_path, created_at')
      .eq('id', params.docId)
      .single();

    if (error || !data) return json({ error: 'Documento não encontrado' }, 404);
    return json(data, 200);
  } catch (e: any) {
    return json({ error: e?.message || 'Erro' }, 500);
  }
}

// PATCH /api/docs/:docId  (atualiza file_name e/ou category)
export async function PATCH(req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const body = await req.json().catch(() => ({}));
    const payload: any = {};
    if (typeof body.file_name === 'string' && body.file_name.trim()) payload.file_name = body.file_name.trim();
    if (typeof body.category === 'string' && body.category.trim()) payload.category = body.category.trim();

    if (!Object.keys(payload).length) return json({ error: 'Nada para atualizar' }, 400);

    const { data, error } = await supabaseAdmin
      .from('documents')
      .update(payload)
      .eq('id', params.docId)
      .select('id, category, file_name')
      .single();

    if (error) return json({ error: error.message }, 400);
    return json(data, 200);
  } catch (e: any) {
    return json({ error: e?.message || 'Erro' }, 500);
  }
}

// DELETE /api/docs/:docId
export async function DELETE(_req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const { data: doc, error: fetchErr } = await supabaseAdmin
      .from('documents')
      .select('id, storage_path')
      .eq('id', params.docId)
      .single();

    if (fetchErr || !doc) return json({ error: 'Documento não encontrado' }, 404);

    if (doc.storage_path) {
      const { error: storageErr } = await supabaseAdmin.storage.from('docs').remove([doc.storage_path]);
      if (storageErr) return json({ error: storageErr.message }, 500);
    }

    const { error: delErr } = await supabaseAdmin.from('documents').delete().eq('id', params.docId);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true }, 200);
  } catch (e: any) {
    return json({ error: e?.message || 'Erro' }, 500);
  }
}

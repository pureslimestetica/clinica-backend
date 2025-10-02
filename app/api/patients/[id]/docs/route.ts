import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers });
}

// GET /api/patients/:id/docs?category=anamnese|orcamento|prescricao
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') as 'anamnese'|'orcamento'|'prescricao'|null;
    if (!category) return NextResponse.json({ error: 'category é obrigatório' }, { status: 400, headers });

    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, created_at')
      .eq('patient_id', params.id)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
    return NextResponse.json(data ?? [], { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers });
  }
}

// (No seu POST existente de upload) — retorne sempre com { headers }

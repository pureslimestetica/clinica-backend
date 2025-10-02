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
    return NextResponse.json({ error: e.message || 'Erro' }, { status: 500, headers });
  }
}

// POST /api/patients/:id/docs?category=...
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') as 'anamnese'|'orcamento'|'prescricao'|null;
    if (!category) return NextResponse.json({ error: 'category é obrigatório' }, { status: 400, headers });

    const form = await req.formData();
    const entries = form.getAll('files');
    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: 'Envie ao menos um arquivo em "files"' }, { status: 400, headers });
    }

    const saved: any[] = [];

    for (const entry of entries) {
      if (!(entry instanceof File)) continue;
      const arrayBuffer = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = '.pdf';
      const fileName = entry.name || `documento.pdf`;
      const path = `${params.id}/${category}/${crypto.randomUUID()}${ext}`;

      const up = await supabaseAdmin.storage.from('docs').upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });
      if (up.error) return NextResponse.json({ error: up.error.message }, { status: 400, headers });

      const { data, error } = await supabaseAdmin
        .from('documents')
        .insert({
          patient_id: params.id,
          category,
          file_name: fileName,
          storage_path: path,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 400, headers });
      saved.push(data);
    }

    return NextResponse.json(saved, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro' }, { status: 500, headers });
  }
}

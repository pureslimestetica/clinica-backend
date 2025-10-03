import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/docs/:docId  -> retorna metadados do documento
export async function GET(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('id, patient_id, category, file_name, storage_path, created_at')
      .eq('id', params.docId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE /api/docs/:docId  -> apaga o registro e o arquivo do Storage
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    // Busca para obter o caminho no Storage
    const { data: doc, error: fetchErr } = await supabaseAdmin
      .from('documents')
      .select('id, storage_path')
      .eq('id', params.docId)
      .single();

    if (fetchErr || !doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    // Remove do Storage (bucket "docs")
    if (doc.storage_path) {
      const { error: storageErr } = await supabaseAdmin.storage
        .from('docs')
        .remove([doc.storage_path]);

      if (storageErr) {
        return NextResponse.json({ error: storageErr.message }, { status: 500 });
      }
    }

    // Remove o registro
    const { error: delErr } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', params.docId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// CORS preflight (opcional)
export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

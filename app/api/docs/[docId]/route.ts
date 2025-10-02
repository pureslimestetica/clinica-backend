import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers });
}

// DELETE /api/docs/:docId
export async function DELETE(_req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const { data: doc, error: e1 } = await supabaseAdmin
      .from('documents')
      .select('id, storage_path')
      .eq('id', params.docId)
      .single();

    if (e1 || !doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404, headers });

    if (doc.storage_path) {
      await supabaseAdmin.storage.from('docs').remove([doc.storage_path]);
    }

    const { error: e2 } = await supabaseAdmin.from('documents').delete().eq('id', params.docId);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 400, headers });

    return new NextResponse(null, { status: 204, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro' }, { status: 500, headers });
  }
}

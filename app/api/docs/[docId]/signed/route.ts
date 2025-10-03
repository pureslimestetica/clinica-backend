import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/docs/:docId/signed?download=1
export async function GET(
  req: NextRequest,
  { params }: { params: { docId: string } }
) {
  try {
    const { data: doc, error } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, storage_path')
      .eq('id', params.docId)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });
    }

    const url = new URL(req.url);
    const asDownload = url.searchParams.get('download') === '1';

    // URL assinada por 15 minutos
    const expiresIn = 60 * 15;
    const { data: signed, error: signedErr } = await supabaseAdmin.storage
      .from('docs')
      .createSignedUrl(doc.storage_path, expiresIn, {
        download: asDownload ? doc.file_name : undefined,
      });

    if (signedErr || !signed?.signedUrl) {
      return NextResponse.json({ error: signedErr?.message || 'Falha ao assinar' }, { status: 400 });
    }

    return NextResponse.json({ signedUrl: signed.signedUrl }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

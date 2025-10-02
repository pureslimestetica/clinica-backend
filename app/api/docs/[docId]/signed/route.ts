import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Pré-flight
export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }

// GET /api/docs/:docId/signed?download=1  -> retorna { url }
export async function GET(req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const { data: doc, error } = await supabaseAdmin
      .from('documents')
      .select('storage_path,file_name')
      .eq('id', params.docId)
      .single();

    if (error || !doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 });

    const u = new URL(req.url);
    const asDownload = u.searchParams.get('download') === '1';

    const seconds = 60 * 15; // 15 minutos
    const signed = await supabaseAdmin
      .storage
      .from('docs')
      .createSignedUrl(doc.storage_path, seconds, { download: asDownload ? doc.file_name : undefined });

    if (signed.error) return NextResponse.json({ error: signed.error.message }, { status: 400 });

    return NextResponse.json({ url: signed.data.signedUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// app/api/docs/[docId]/signed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const BUCKET = 'docs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/docs/:docId/signed?download=1
 * Retorna { signedUrl }
 */
export async function GET(req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const url = new URL(req.url);
    const asDownload = url.searchParams.get('download') === '1';

    const { data: doc, error } = await supabaseAdmin
      .from('documents')
      .select('storage_path, file_name')
      .eq('id', params.docId)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404, headers: CORS_HEADERS });
    }

    const seconds = 60 * 15; // 15 min
    const signed = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(doc.storage_path, seconds, {
        download: asDownload ? doc.file_name : undefined,
      });

    if (signed.error || !signed.data?.signedUrl) {
      return NextResponse.json({ error: signed.error?.message ?? 'Falha ao assinar URL' }, { status: 400, headers: CORS_HEADERS });
    }

    return NextResponse.json({ signedUrl: signed.data.signedUrl }, { status: 200, headers: CORS_HEADERS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'GET failed' }, { status: 500, headers: CORS_HEADERS });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers });
}

export async function GET(req: NextRequest, { params }: { params: { docId: string } }) {
  try {
    const { data: doc, error } = await supabaseAdmin
      .from('documents')
      .select('id, file_name, storage_path')
      .eq('id', params.docId)
      .single();

    if (error || !doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404, headers });

    const url = new URL(req.url);
    const asDownload = url.searchParams.get('download') === '1';

    const seconds = 60 * 15;
    const signed = await supabaseAdmin.storage
      .from('docs')
      .createSignedUrl(doc.storage_path, seconds, { download: asDownload ? doc.file_name : undefined });

    if (signed.error) return NextResponse.json({ error: signed.error.message }, { status: 400, headers });

    return NextResponse.json({ url: signed.data.signedUrl }, { status: 200, headers });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers });
  }
}

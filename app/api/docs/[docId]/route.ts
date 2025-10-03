// app/api/docs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

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
 * GET /api/docs?patientId=:id
 * Opcional: ?category=anamnese|orcamento|prescricao
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const patientId = url.searchParams.get('patientId');
    const category = url.searchParams.get('category') ?? undefined;

    if (!patientId) {
      return NextResponse.json({ error: 'patientId é obrigatório' }, { status: 400, headers: CORS_HEADERS });
    }

    let query = supabaseAdmin
      .from('documents')
      .select('id, file_name, storage_path, category, created_at')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS_HEADERS });
    }

    // URLs assinadas (15 min)
    const seconds = 60 * 15;
    const items = await Promise.all(
      (data ?? []).map(async (doc) => {
        const signed = await supabaseAdmin
          .storage
          .from(BUCKET)
          .createSignedUrl(doc.storage_path, seconds);
        return {
          ...doc,
          signed_url: signed.data?.signedUrl ?? null,
        };
      })
    );

    return NextResponse.json({ items }, { status: 200, headers: CORS_HEADERS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'GET failed' }, { status: 500, headers: CORS_HEADERS });
  }
}

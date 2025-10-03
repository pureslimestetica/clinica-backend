// app/api/patients/[id]/docs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const BUCKET = 'docs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/patients/:id/docs
 * Opcional: ?category=anamnese|orcamento|prescricao
 * Retorna: { items: Array<{id,file_name,category,created_at,storage_path,signed_url}> }
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') ?? undefined;

    let query = supabaseAdmin
      .from('documents')
      .select('id, file_name, storage_path, category, created_at')
      .eq('patient_id', params.id)
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: CORS_HEADERS });
    }

    // gera URL assinada (15 min) para cada documento
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

/**
 * POST /api/patients/:id/docs?category=anamnese|orcamento|prescricao
 * Form-Data: files (1..N)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');

    if (!category) {
      return NextResponse.json({ error: 'category é obrigatório' }, { status: 400, headers: CORS_HEADERS });
    }

    const form = await req.formData();
    const entries = form.getAll('files');
    if (!entries.length) {
      return NextResponse.json({ error: 'envie pelo menos 1 arquivo em "files"' }, { status: 400, headers: CORS_HEADERS });
    }

    for (const file of entries) {
      if (!(file instanceof File)) continue;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = '.pdf';
      const safeName = file.name?.replace(/\s+/g, '_') || 'documento.pdf';
      const fileName = safeName.toLowerCase().endsWith(ext) ? safeName : `${safeName}${ext}`;
      const path = `${params.id}/${randomUUID()}${ext}`;

      // upload no Storage
      const upload = await supabaseAdmin
        .storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: 'application/pdf', upsert: false });

      if (upload.error) {
        return NextResponse.json({ error: upload.error.message }, { status: 400, headers: CORS_HEADERS });
      }

      // registro na tabela
      const { error: insertError } = await supabaseAdmin
        .from('documents')
        .insert({
          patient_id: params.id,
          file_name: fileName,
          storage_path: path,
          category,
        });

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400, headers: CORS_HEADERS });
      }
    }

    return NextResponse.json({ ok: true }, { status: 200, headers: CORS_HEADERS });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'POST failed' }, { status: 500, headers: CORS_HEADERS });
  }
}

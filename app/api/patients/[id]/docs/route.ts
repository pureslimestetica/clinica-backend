import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Pré-flight
export async function OPTIONS() { return NextResponse.json({}, { status: 200 }); }

// POST /api/patients/:id/docs?category=anamnese|orcamento|prescricao
// Content-Type: multipart/form-data; field name: "files" (pode mandar vários)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const patientId = params.id;
    const url = new URL(req.url);
    const category = url.searchParams.get('category') as 'anamnese' | 'orcamento' | 'prescricao' | null;
    if (!category) return NextResponse.json({ error: 'category é obrigatório' }, { status: 400 });

    const form = await req.formData();
    const entries = form.getAll('files'); // input name="files"
    if (entries.length === 0) return NextResponse.json({ error: 'envie pelo menos 1 arquivo em "files"' }, { status: 400 });

    const uploadedDocs: any[] = [];

    for (const entry of entries) {
      if (!(entry instanceof File)) continue;
      const arrayBuffer = await entry.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = '.pdf';
      const fileName = entry.name || 'documento.pdf';
      const path = `${patientId}/${category}/${crypto.randomUUID()}${ext}`;

      const up = await supabaseAdmin
        .storage
        .from('docs')
        .upload(path, buffer, { contentType: 'application/pdf', upsert: false });

      if (up.error) return NextResponse.json({ error: up.error.message }, { status: 400 });

      const ins = await supabaseAdmin
        .from('documents')
        .insert({
          patient_id: patientId,
          category,
          file_name: fileName,
          storage_path: path
        })
        .select()
        .single();

      if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 400 });
      uploadedDocs.push(ins.data);
    }

    return NextResponse.json({ uploaded: uploadedDocs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

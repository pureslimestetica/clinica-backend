import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs'; // garantir Node runtime
export const dynamic = 'force-dynamic';

// Pré-flight CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

// POST /api/patients  { full_name?, age?, birth_date?, contact?, email? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, error } = await supabaseAdmin
      .from('patients')
      .insert({
        full_name: body.full_name ?? null,
        age: body.age ?? null,
        birth_date: body.birth_date ?? null,
        contact: body.contact ?? null,
        email: body.email ?? null
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/patients?q=nome
export async function GET(req: NextRequest) {
  try {
    const q = new URL(req.url).searchParams.get('q') || '';
    const query = supabaseAdmin
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    const { data, error } = q
      ? await query.ilike('full_name', `%${q}%`)
      : await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

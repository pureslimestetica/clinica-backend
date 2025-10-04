// app/api/patients/[id]/applications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const patientId = params.id
  const { data, error } = await supabaseAdmin
    .from('treatments')
    .select('id, next_date')
    .eq('patient_id', patientId)
    .not('next_date', 'is', null)
    .order('next_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ applications: data ?? [] }, { status: 200 })
}

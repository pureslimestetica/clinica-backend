// lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,           // ex.: https://xxxx.supabase.co
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Chave service_role (NUNCA no front)
);

import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,              // https://xxxx.supabase.co
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // service_role (NUNCA no frontend)
);

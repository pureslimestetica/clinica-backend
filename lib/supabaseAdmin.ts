import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Exporta das duas formas (default e nomeado)
export { supabaseAdmin };
export default supabaseAdmin;

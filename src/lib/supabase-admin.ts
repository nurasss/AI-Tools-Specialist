import { createClient } from "@supabase/supabase-js";
import { requireSupabaseEnv } from "@/lib/env";

export function createSupabaseAdmin() {
  const env = requireSupabaseEnv();

  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

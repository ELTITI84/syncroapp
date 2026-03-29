import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// SUPABASE_SERVICE_ROLE_KEY: obtenerla desde Supabase Dashboard > Settings > API
// NUNCA exponerla al cliente (no usar NEXT_PUBLIC_)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

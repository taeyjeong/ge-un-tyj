// Server-only Supabase client using the project's secret key (bypasses RLS). Import it only from
// API routes, never from client components. Returns null when SUPABASE_SECRET_KEY isn't
// configured, so features that only log data keep working without it.
import {createClient, type SupabaseClient} from '@supabase/supabase-js';

let admin: SupabaseClient | null | undefined;
export function serverSupabase(): SupabaseClient | null {
  if (admin !== undefined) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  admin = url && key ? createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}}) : null;
  return admin;
}

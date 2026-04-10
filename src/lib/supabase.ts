import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _checked = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (_checked) return _supabase;
  _checked = true;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (url.startsWith('http') && key) {
      _supabase = createClient(url, key);
    }
  } catch {
    _supabase = null;
  }

  return _supabase;
}

export const isSupabaseConfigured = () => !!getSupabaseClient();

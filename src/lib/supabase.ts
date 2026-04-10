import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _checked = false;

export function getSupabaseClient(): SupabaseClient | null {
  if (_checked) return _supabase;
  _checked = true;

  try {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']|["']$/g, '');
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim().replace(/^["']|["']$/g, '');
    if (url.startsWith('http') && key.length > 0) {
      _supabase = createClient(url, key);
    } else {
      console.warn('Supabase not configured. URL:', url ? 'set' : 'missing', 'Key:', key ? 'set' : 'missing');
    }
  } catch (err) {
    console.error('Supabase init error:', err);
    _supabase = null;
  }

  return _supabase;
}

export const isSupabaseConfigured = () => !!getSupabaseClient();

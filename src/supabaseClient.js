import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Error: Supabase URL and Anon Key must be defined in your environment variables (.env file)'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

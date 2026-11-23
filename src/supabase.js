
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// The planner remains fully usable on-device while cloud credentials are absent.
export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey)
  : null;

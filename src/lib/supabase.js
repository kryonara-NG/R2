import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../config.js';

const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.Pub_key || SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfig = {
  url,
  publishableKey,
  missing: [
    !url ? 'Supabase URL' : null,
    !publishableKey ? 'Supabase publishable key' : null,
  ].filter(Boolean),
};

export const supabase = createClient(url, publishableKey);

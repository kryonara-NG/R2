import { createClient } from '@supabase/supabase-js';

// Support the environment variable names already configured on Vercel.
const url = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.Pub_key || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfig = {
  url: url || '',
  publishableKey: publishableKey || '',
  missing: [
    !url ? 'SUPABASE_URL (or VITE_SUPABASE_URL)' : null,
    !publishableKey ? 'Pub_key (or VITE_SUPABASE_PUBLISHABLE_KEY)' : null,
  ].filter(Boolean),
};

// Keep the app renderable even if Vercel has not injected a variable yet.
// API calls will fail visibly rather than causing a completely blank page.
export const supabase = createClient(
  supabaseConfig.url || 'https://invalid.supabase.co',
  supabaseConfig.publishableKey || 'missing-publishable-key'
);

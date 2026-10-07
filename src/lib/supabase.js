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

if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
  // Keep the failure explicit instead of silently rendering a blank application.
  throw new Error('Missing Supabase configuration: ' + supabaseConfig.missing.join(', '));
}

export const supabase = createClient(supabaseConfig.url, supabaseConfig.publishableKey);

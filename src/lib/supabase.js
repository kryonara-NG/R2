import { createClient } from '@supabase/supabase-js';

// Keep compatibility with the environment variable names configured on Vercel.
const url = import.meta.env.SUPABASE_URL;
const publishableKey = import.meta.env.Pub_key;

if (!url || !publishableKey) {
  throw new Error(
    'Missing Supabase configuration. Set SUPABASE_URL and Pub_key.'
  );
}

export const supabase = createClient(url, publishableKey);

import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client, used inside Client Components. Mirrors
// the anon-key setup in the static site's sx-supabase-config.js — same
// Supabase project, just wired through @supabase/ssr so auth state is
// shared with the server via cookies instead of localStorage.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

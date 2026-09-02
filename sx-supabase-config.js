// Strategic X — Supabase project configuration
//
// IMPORTANT: This file is intentionally separate from the main site's
// supabase-config.js. The Strategic X portal will eventually be extracted
// out of this repo and shipped as its own project, so nothing in this
// folder should depend on files outside strategic-x/. For now it points
// at the SAME Supabase project (same URL + anon key) as the rest of the
// site, since there is only one backend today — but all portal-specific
// tables/policies/Edge Functions should be namespaced (e.g. `sx_` prefixed
// tables, separate Edge Functions under supabase/functions/sx-*) so they
// can be cleanly split off later without touching the storefront's data.

const SX_SUPABASE_URL = 'https://dehvyonajwgiqpowpdnu.supabase.co';
const SX_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHZ5b25handnaXFwb3dwZG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNTY5MTcsImV4cCI6MjEwMjczMjkxN30.XPH2_aZ2TzpN7IAO25oKb0j-uvAPF1kLDRNKoCgI490';

const sxSupabaseClient = window.supabase.createClient(SX_SUPABASE_URL, SX_SUPABASE_ANON_KEY);
window.sxSupabaseClient = sxSupabaseClient;

// Where Supabase should send users back to after email confirmation /
// OAuth sign-in. The site (both locally on port 5501 and in production at
// strategicxltd.com) is served from the domain root — there is no
// /strategic-x/ path segment in the live URL — so this is just
// window.location.origin + '/sign-in.html'. This MUST also be added to the
// Supabase project's Authentication > URL Configuration > Redirect URLs
// allow-list (e.g. https://www.strategicxltd.com/**), otherwise Supabase
// silently falls back to the configured Site URL instead of honoring this
// value.
const SX_AUTH_REDIRECT_URL = window.location.origin + '/sign-in.html';

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
// OAuth sign-in. Hardcoded to the strategic-x/sign-in.html path (rather
// than derived from window.location.pathname) because deriving it from
// the current URL breaks if the page is opened without a trailing slash
// or explicit sign-in.html (e.g. ".../strategic-x" instead of
// ".../strategic-x/sign-in.html") — the old regex would then treat
// "strategic-x" itself as the file to replace, redirecting users back to
// the SITE ROOT instead of the Strategic X portal. Update this if/when the
// strategic-x folder is ever extracted into its own separate project (it
// would then just be '/sign-in.html').
const SX_AUTH_REDIRECT_URL = window.location.origin + '/strategic-x/sign-in.html';

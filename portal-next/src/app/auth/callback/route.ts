import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Exchanges the OAuth `code` param (Google sign-in redirect) for a session,
// storing it in cookies via the server client, then sends the user on to
// the dashboard. Mirrors what sign-in.html's watchAuthAndRoute did
// client-side, but as a server Route Handler so the cookie is set before
// any page renders.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

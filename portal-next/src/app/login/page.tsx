'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import BrandPanel from '@/components/brand-panel';

// Sign-in page, ported 1:1 (layout/copy/assets) from the static site's
// sign-in.html so the new stack doesn't feel like a different product,
// wired to the SSR-aware browser client so the session lands in a cookie
// the server can read on the very next request.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message || 'Unable to sign in. Please check your details.');
      return;
    }
    window.location.href = '/dashboard';
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex min-h-screen">
      <BrandPanel />

      <section className="flex flex-1 items-center justify-center bg-white px-5 py-8 sm:px-8 sm:py-10">
        <div className="w-full max-w-[360px]">
          <div className="mb-2 flex flex-col items-center gap-2.5">
            <Image src="/assets/sxlogo.png" alt="Strategic X logo" width={220} height={56} className="h-auto w-45 object-contain sm:w-[220px]" />
          </div>

          <div className="mb-7 text-center">
            <h2 className="text-[1.25rem] font-extrabold">
              Welcome to Strategic<span className="text-[#8a8d91]"> X</span>
            </h2>
            <p className="mt-1 text-[0.82rem] text-[#6b6f76]">Sign in to continue to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-3.5 rounded-lg border border-[#f3b9b9] bg-[#fdecec] px-3 py-2.5 text-[0.78rem] font-semibold text-[#9c2b2b]">
                {error}
              </div>
            )}

            <div className="relative mb-3.5">
              <span className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2">
                <Image src="/assets/email.png" alt="" width={18} height={18} className="h-full w-full object-contain opacity-55" />
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] border border-[#dcdde0] bg-[#fbfbfc] py-3.5 pl-[42px] pr-4 text-[0.88rem] text-[#111113] outline-none transition-colors focus:border-[#8a8d91] focus:bg-white"
              />
            </div>

            <div className="relative mb-3.5">
              <span className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2">
                <Image src="/assets/lock.png" alt="" width={18} height={18} className="h-full w-full object-contain opacity-55" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] border border-[#dcdde0] bg-[#fbfbfc] py-3.5 pl-[42px] pr-[42px] text-[0.88rem] text-[#111113] outline-none transition-colors focus:border-[#8a8d91] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2"
              >
                <Image src="/assets/visible.png" alt="" width={18} height={18} className="h-full w-full object-contain opacity-60" />
              </button>
            </div>

            <div className="mb-4.5 mt-1 flex items-center justify-between text-[0.78rem]">
              <label className="flex items-center gap-1.5 text-[#6b6f76]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-black"
                />
                Remember me
              </label>
              <a href="#" className="font-bold text-[#111113]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[10px] bg-gradient-to-b from-[#2b2b2d] to-black py-3.5 text-[0.9rem] font-extrabold tracking-wide text-white hover:from-[#3a3a3c] hover:to-[#0a0a0a] disabled:opacity-60"
            >
              {submitting ? 'Please wait…' : 'Sign In'}
            </button>
          </form>

          <div className="my-5.5 flex items-center gap-3 text-[0.72rem] text-[#6b6f76] before:h-px before:flex-1 before:bg-[#dcdde0] after:h-px after:flex-1 after:bg-[#dcdde0]">
            or continue with
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="mb-2.5 flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#dcdde0] bg-white py-2.75 text-[0.85rem] font-bold text-[#111113] hover:bg-[#f5f5f6]"
          >
            <Image src="/assets/google.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
            Continue with Google
          </button>

          <p className="mt-5.5 text-center text-[0.82rem] text-[#6b6f76]">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-extrabold text-[#0a0a0a]">
              Sign up
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}

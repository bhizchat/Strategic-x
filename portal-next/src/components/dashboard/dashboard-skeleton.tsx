// Shown instantly by Next.js (via each route's loading.tsx) the moment a
// user clicks a sidebar nav link, while the real page's Server Component
// is still awaiting Supabase auth/data on the server. Without this, the
// browser tab appears frozen/blank for the full round-trip — this makes
// navigation feel instant, matching the real page's sidebar width/colors
// so there's no layout shift once the real content streams in.
export default function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <div className="hidden w-[230px] shrink-0 bg-[#1c1c1e] md:block" />

      <div className="flex min-w-0 flex-1 flex-col bg-[#f5f5f6]">
        <div className="h-[64px] shrink-0 border-b border-[#e2e3e6] bg-white" />

        <div className="min-w-0 flex-1 px-8 pb-12 pt-7 max-md:px-4.5 max-md:pb-24 max-md:pt-5.5">
          <div className="h-7 w-52 animate-pulse rounded-md bg-[#e2e3e6]" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded-md bg-[#e2e3e6]" />

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[14px] border border-[#e2e3e6] bg-white" />
            ))}
          </div>

          <div className="mt-5 h-64 animate-pulse rounded-[14px] border border-[#e2e3e6] bg-white" />
        </div>
      </div>
    </div>
  );
}

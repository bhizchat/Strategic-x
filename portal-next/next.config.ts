import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dashboard pages (dashboard/my-shop/products/reviews/etc.) are
    // dynamic (they read cookies for auth), so by default the client
    // Router Cache treats them as instantly stale and Next.js re-fetches
    // everything from the server on every single navigation — even
    // switching straight back to a tab visited seconds ago. This keeps a
    // recently-visited dynamic page's cached RSC payload around for 30s,
    // so quick tab-switching feels instant instead of re-running the
    // full auth+data waterfall every click. Data can still lag up to 30s
    // behind the DB, which is fine for a vendor's own dashboard view.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;

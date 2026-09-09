'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/shop';

// Client Component: ported from products.html's stats/search/filter/table
// script logic. Products are fetched server-side (page.tsx) and passed in
// as a prop; all filtering below happens client-side against that same
// array, matching the static site's getFilteredProducts()/
// renderProductsTable() behavior exactly.
export default function ProductsClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [stock, setStock] = useState('');

  const total = products.length;
  const inStock = products.filter((p) => p.stockQuantity > 5).length;
  const lowStock = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 5).length;
  const outOfStock = products.filter((p) => p.stockQuantity <= 0).length;

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((p) => {
      if (query) {
        const haystack = (p.productName + ' ' + p.category).toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      if (category && p.category !== category) return false;
      if (status && p.status !== status) return false;
      if (stock) {
        const qty = p.stockQuantity;
        if (stock === 'in-stock' && !(qty > 5)) return false;
        if (stock === 'low-stock' && !(qty > 0 && qty <= 5)) return false;
        if (stock === 'out-of-stock' && !(qty <= 0)) return false;
      }
      return true;
    });
  }, [products, search, category, status, stock]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 max-md:flex-col">
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 max-md:w-full lg:grid-cols-4">
          <StatCard icon={<Image src="/assets/parcel.png" alt="" width={17} height={17} className="h-[17px] w-[17px] object-contain" />} label="Total Products" value={total} sub="Active Listings" />
          <StatCard icon={<span className="h-3.25 w-3.25 rounded-full bg-[#34d16b] shadow-[0_0_0_3px_rgba(52,209,107,0.18),0_0_10px_2px_rgba(52,209,107,0.7)]" />} label="In Stock" value={inStock} sub="Products available" />
          <StatCard icon={<span className="h-3.25 w-3.25 rounded-full bg-[#f4b740] shadow-[0_0_0_3px_rgba(244,183,64,0.18),0_0_10px_2px_rgba(244,183,64,0.7)]" />} label="Low Stock" value={lowStock} sub="Products" />
          <StatCard icon={<span className="h-3.25 w-3.25 rounded-full bg-[#e04b4b] shadow-[0_0_0_3px_rgba(224,75,75,0.18),0_0_10px_2px_rgba(224,75,75,0.7)]" />} label="Out of Stock" value={outOfStock} sub="Products" />
        </div>

        <a
          href="/add-product"
          className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border border-[#e2e3e6] bg-white px-4 py-2.5 text-[0.82rem] font-extrabold text-[#0a0a0a] hover:bg-[#e5e6e8] max-md:w-full"
        >
          + Add New Product
        </a>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative min-w-55 flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[0.82rem] text-[#6b6f76]">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name, SKU or category..."
            className="w-full rounded-[10px] border border-[#e2e3e6] bg-white py-2.5 pl-9 pr-3.5 text-[0.82rem] text-[#111113] outline-none focus:border-[#8a8d91]"
          />
        </div>
      </div>

      <div className="mb-4.5 flex flex-wrap items-center gap-3 max-md:flex-nowrap max-md:gap-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="min-w-35 flex-1 cursor-pointer rounded-[10px] border border-[#e2e3e6] bg-white px-3.5 py-2.5 text-[0.8rem] font-semibold text-[#6b6f76] max-md:min-w-0 max-md:px-2 max-md:py-2.5 max-md:text-[0.72rem]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="min-w-35 flex-1 cursor-pointer rounded-[10px] border border-[#e2e3e6] bg-white px-3.5 py-2.5 text-[0.8rem] font-semibold text-[#6b6f76] max-md:min-w-0 max-md:px-2 max-md:py-2.5 max-md:text-[0.72rem]"
        >
          <option value="">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="min-w-35 flex-1 cursor-pointer rounded-[10px] border border-[#e2e3e6] bg-white px-3.5 py-2.5 text-[0.8rem] font-semibold text-[#6b6f76] max-md:min-w-0 max-md:px-2 max-md:py-2.5 max-md:text-[0.72rem]"
        >
          <option value="">Stock Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-[#e2e3e6] bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <div className="text-[2rem]">🛍</div>
            <h3 className="text-[1rem] font-bold">{total === 0 ? 'No products yet' : 'No matching products'}</h3>
            <p className="max-w-[360px] text-[0.82rem] text-[#6b6f76]">
              {total === 0
                ? 'Start building your catalog by adding your first product. Your listings will appear here.'
                : 'Try adjusting your search or filters.'}
            </p>
            {total === 0 && (
              <a href="/add-product" className="mt-2 rounded-[10px] border border-[#e2e3e6] bg-white px-4 py-2.5 text-[0.82rem] font-extrabold text-[#0a0a0a] hover:bg-[#e5e6e8]">
                + Add New Product
              </a>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse">
              <thead>
                <tr>
                  {['Product', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
                    <th key={h} className="border-b border-[#e2e3e6] px-5 py-3.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-[#6b6f76]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td className={`px-5 py-4 text-[0.84rem] ${i < filtered.length - 1 ? 'border-b border-[#e2e3e6]' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e2e3e6] bg-[#e5e6e8] text-[0.9rem]">
                          {p.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                          ) : (
                            '🛍'
                          )}
                        </div>
                        <span className="font-bold">{p.productName}</span>
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-[0.84rem] ${i < filtered.length - 1 ? 'border-b border-[#e2e3e6]' : ''}`}>{p.category || '—'}</td>
                    <td className={`px-5 py-4 text-[0.84rem] ${i < filtered.length - 1 ? 'border-b border-[#e2e3e6]' : ''}`}>
                      ₦{p.sellingPrice.toLocaleString()}
                    </td>
                    <td className={`px-5 py-4 text-[0.84rem] ${i < filtered.length - 1 ? 'border-b border-[#e2e3e6]' : ''}`}>{p.stockQuantity}</td>
                    <td className={`px-5 py-4 text-[0.84rem] ${i < filtered.length - 1 ? 'border-b border-[#e2e3e6]' : ''}`}>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.75 text-[0.7rem] font-bold ${
                          p.status === 'published' ? 'bg-[#1e8b4a]/[0.14] text-[#1e8b4a]' : 'bg-[#c7c9cc]/30 text-[#6b6f76]'
                        }`}
                      >
                        {p.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-[0.84rem] ${i < filtered.length - 1 ? 'border-b border-[#e2e3e6]' : ''}`}>
                      <button
                        type="button"
                        title="Edit product"
                        className="flex h-7.5 w-7.5 items-center justify-center rounded-lg border border-[#e2e3e6] bg-[#e5e6e8] text-[0.86rem] text-[#6b6f76] hover:border-[#8a8d91] hover:bg-white hover:text-[#111113]"
                      >
                        ✎
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="rounded-[14px] border border-[#e2e3e6] bg-white p-4">
      <div className="mb-2.5 flex h-8.5 w-8.5 items-center justify-center rounded-full border border-[#e2e3e6] bg-[#e5e6e8] text-[0.9rem]">
        {icon}
      </div>
      <div className="text-[0.72rem] text-[#6b6f76]">{label}</div>
      <div className="mt-0.5 text-[1.3rem] font-extrabold">{value}</div>
      <div className="mt-1 text-[0.68rem] text-[#6b6f76]">{sub}</div>
    </div>
  );
}

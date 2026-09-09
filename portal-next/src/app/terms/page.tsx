import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Strategic X - Terms of Service',
};

// Ported 1:1 (layout/copy) from terms.html — simple dark header with back
// link, numbered sections, footer. Public static page, no auth required.
export default function TermsPage() {
  return (
    <div className="min-h-full bg-[#f5f5f6] text-[#111113]">
      <header className="flex items-center justify-between bg-[#0a0a0a] px-8 py-4.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg">
            <Image src="/assets/sxlogo.png" alt="Strategic X logo" width={36} height={36} className="h-full w-full object-contain" />
          </div>
          <div className="text-[1.05rem] font-extrabold text-white">
            Strategic<span className="text-[#c7c9cc]">X</span>
          </div>
        </div>
        <Link href="/signup" className="flex items-center gap-1.5 text-[0.82rem] font-bold text-[#c7c9cc] hover:text-white">
          ← Back to Sign Up
        </Link>
      </header>

      <main className="mx-auto max-w-190 px-6 pt-14 pb-20">
        <h1 className="mb-2 text-[1.9rem] font-black tracking-[-0.01em]">Terms of Service</h1>
        <p className="mb-9 text-[0.82rem] text-[#6b6f76]">Last updated: August 27, 2026</p>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">1. Acceptance of Terms</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            By creating an account or otherwise accessing Strategic X, you agree to be bound by these Terms of Service. If you do not
            agree to these terms, do not use the platform.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">2. Who Can Use Strategic X</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            Strategic X connects local vendors and shoppers. You must be at least 18 years old and able to form a binding contract to
            create an account, whether as a vendor or a shopper.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">3. Vendor Accounts</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            Vendors are responsible for the accuracy of their shop listings, product information, and pricing. Strategic X may review,
            suspend, or remove any listing or account that violates these terms or applicable law.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">4. Acceptable Use</h2>
          <ul className="ml-5 list-disc space-y-1.5 text-[0.92rem] text-[#6b6f76]">
            <li>Do not list counterfeit, stolen, or illegal goods.</li>
            <li>Do not misrepresent your identity, products, or business.</li>
            <li>Do not attempt to interfere with the security or normal operation of the platform.</li>
          </ul>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">5. Payments and Fees</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            Any applicable fees for using Strategic X will be disclosed to you before you incur them. Vendors are responsible for their
            own applicable taxes.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">6. Termination</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            We may suspend or terminate your access to Strategic X at any time if we believe you have violated these terms.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">7. Disclaimers</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            Strategic X is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted or error-free
            service.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">8. Changes to These Terms</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            We may update these Terms of Service from time to time. Continued use of Strategic X after changes take effect constitutes
            acceptance of the revised terms.
          </p>
        </section>

        <section className="mb-7">
          <h2 className="mb-2.5 text-[1.05rem] font-extrabold text-[#0a0a0a]">9. Contact</h2>
          <p className="text-[0.92rem] text-[#6b6f76]">
            Questions about these terms can be directed to the Strategic X team through the contact options provided on the platform.
          </p>
        </section>
      </main>

      <footer className="px-6 py-6 text-center text-[0.78rem] text-[#6b6f76]">© 2026 Strategic X. All rights reserved.</footer>
    </div>
  );
}

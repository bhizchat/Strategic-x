// WhatsApp deep links (wa.me / api.whatsapp.com) require the number in
// full international format — digits only, no leading "+", no leading
// "0", country code included (e.g. "2349134333745"). Vendors naturally
// type their number in local format (e.g. "09134333745" or with spaces/
// dashes), which WhatsApp then rejects with "isn't on WhatsApp" / "link
// couldn't be opened". Normalizing at the point of capture means every
// downstream consumer (this portal, the separate storefront codebase
// that builds the actual wa.me link) gets a working number.
//
// Nigeria-specific (country code 234), matching this codebase's market
// (Naira pricing, Lagos/Nigeria market platforms).
export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  return '234' + digits;
}

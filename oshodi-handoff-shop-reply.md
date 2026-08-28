# Task: Display vendor replies on product review cards

## Context
Reviews are stored in the shared Supabase `reviews` table (same project
this storefront already reads from/writes to). The Strategic X vendor
dashboard now lets shop owners reply to a customer's review, and writes
that reply directly onto the same review row. Two new columns were added:

- `shop_reply` (`text`, nullable) — the vendor's reply text. `null` or
  empty string means no reply has been posted yet.
- `shop_reply_at` (`timestamptz`, nullable) — when the reply was posted.

No other columns changed. Existing columns (`id`, `shop_key`,
`product_index`, `reviewer_name`, `rating`, `comment`, `created_at`) are
untouched.

## What to build
Wherever this storefront renders a review (e.g. on the product detail
page's reviews/ratings section), check if `shop_reply` is present and
non-empty. If so, render it directly beneath that review's comment,
visually distinguished from the customer's own text — e.g. indented,
placed in a bordered/shaded box, prefixed with something like "Reply from
[Shop Name]:" and optionally the `shop_reply_at` date formatted the same
way `created_at` already is.

If `shop_reply` is `null`/empty, render nothing extra (current behavior
unchanged).

## Implementation notes
- If the review query explicitly lists columns (e.g.
  `.select('id, reviewer_name, rating, comment, created_at')`) instead of
  `select('*')`, add `shop_reply` and `shop_reply_at` to that list —
  otherwise the new columns won't come back in the response.
- No RLS/permissions changes needed on this side — `anon`/`authenticated`
  read access to `reviews` already includes these new columns since they
  live on the same row.
- This is read-only for the storefront; only the vendor dashboard writes
  to `shop_reply`/`shop_reply_at`. Do not add write/update logic for
  these columns here.

## Example rendering (adjust to match existing review card markup/styles)
```
Fumi Adeyemi  ★★★★★
"This is very comfortable, love it!"

  ┌─────────────────────────────────────────┐
  │ Reply from [Shop Name] · Aug 28, 2026    │
  │ that's so good to hear !!!               │
  └─────────────────────────────────────────┘
```

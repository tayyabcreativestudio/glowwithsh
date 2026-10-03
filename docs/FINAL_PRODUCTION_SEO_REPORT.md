# GlowWithSH production, commerce and SEO report

Date: 2026-10-03. Scope: repository implementation and isolated local production testing, plus unauthenticated live HTTP checks. Live commerce/customer data was not overwritten. No real payment, refund, order or message was sent during this audit.

## Executive summary

The live homepage and `/api/health` returned 200. The older live build still has generic initial HTML with no H1 and a homepage canonical on Shop. New code corrects that locally. Checkout/admin/media safeguards, safer storage, public rendering, metadata, navigation, copy and responsive images are implemented. Deployment remains separate because the actual Hostinger persistent path and production backup have not been confirmed. This is not a claim that the commercial store is fully production-ready or legally compliant.

The latest live audit also confirms that `/api/products` exposes the internal costPrice field and `includeDrafts=true` accepts unauthenticated requests (there were no extra draft items in this snapshot). These security issues remain LIVE until the prepared changes are deployed. Unauthenticated `/api/admin/media` returns 401; authorized login/media listing return 200 with four media entries. No new live upload/persistence test was performed in this audit.

## Build and verification

Baseline: `npm ci` installed dependencies with zero audit vulnerabilities; `npm run lint`, 30 tests and production build passed. `npm run typecheck` was missing and is now provided. Exact final checks/results are recorded in `VALIDATION_RESULTS.md` after the last verification run. Existing older commerce tests include simulations; new HTTP tests exercise the actual built Express routes and temporary files. Node 24.21.0 was used locally. Hostinger Node 22's exact minor/SQLite support remains unverified.

## Security

- Unknown admin username cannot authenticate through a password fallback. Scrypt password hashes, signed expiring tokens, HttpOnly/Secure/SameSite cookies and token-version invalidation retained.
- Exact origin validation replaces the localhost-substring bypass; login/logout/password-change now receive CSRF origin checks. CORS uses explicit origins. Requests without Origin remain accepted for CLI clients; authorization still applies.
- Server role allowlist restricts Editor/Support and reserves credentials/settings/database reset for Super Admin. Manager can manage commerce but cannot reset storage or change master settings. One existing Super Admin remains; no new user credentials are created.
- Draft product/blog and unmoderated review/award endpoints require admin sessions. Public product responses exclude internal cost/source fields. Real admin media/upload APIs require authentication.
- Uploads have bounded request/file sizes, accepted image formats and existing magic-byte validation; files now receive security headers before static delivery. Error middleware returns generic JSON instead of stacks. No frontend API secret is introduced.
- User-submitted reviews no longer claim a verified purchase automatically. The server derives the product name from a published product; moderation remains required.
- CSP adds base-uri/object restrictions; existing inline-script allowance remains for compatibility. External fonts/images/video and Razorpay browser behavior still require production verification. In-memory rate limiting is one-process protection, not distributed protection.

## Commerce / payments / inventory

Server prices, shipping, discounts, quantities and stock determine the final total. Duplicate cart lines are rejected. Failed transactions roll back the in-memory state; datastore write failures fail closed. Last-unit contention is checked against the actual HTTP server. Cart/checkout share shipping settings; discounts are revalidated when subtotal changes. Fake frontend coupon success fallback is removed.

Checkout retries with the same idempotency key and normalized request return the same persisted order without a second stock reservation. The client retains a request key in session storage while a failed network attempt is retried. Coupon mutations reject duplicate codes, percentages over 100 and invalid dates; calculated discounts cannot erase shipping by exceeding merchandise subtotal. Shipping configuration rejects invalid/negative numbers.

COD works without GSTIN or Razorpay keys. Online payments are unavailable in the UI/API when credentials are absent or preview is enabled. No missing-key mock gateway can run in production. Production enabled payments require live mode and a webhook secret. GSTIN, when supplied, must pass format validation; no dummy registration is supplied and no legal/tax conclusion is made.

Payment verification checks the signature and gateway order, amount, currency and captured state. Payment IDs and raw-body webhook events are idempotent. Captures for released/cancelled orders require manual reconciliation. Existing payment intents are reused; uncertain creation requests are not automatically repeated. Gateway network calls are outside datastore locks. Full refunds persist a request reservation first; duplicate/partial requests are denied, pending gateway refunds remain pending, and inventory is restored only for eligible pre-fulfilment/returned states. Uncertain refund outcomes require gateway reconciliation, not blind retries.

Unpaid online inventory reservations expire after 30 minutes during the next successful checkout/intent transaction; late captures cannot automatically fulfil released stock. This is a lazy sweep rather than an external scheduler. COD switching is blocked once a gateway attempt exists to avoid conflicting payment methods. Invalid order states, unverified online fulfilment and manual fake refund statuses are denied; released inventory cannot be reopened automatically.

Actual HTTP fake-gateway tests cover intent reuse, wrong/zero amount, wrong currency/order, authorized-not-captured, success, duplicate verification, raw webhook replay, closed-browser webhook recovery, full/partial/duplicate refunds. These prove local route behavior only; actual Razorpay SDK/network, bank settlement and live refunds remain unverified.

## Storage and media

Media is functional: upload writes a real image, returns its public URL, and the URL plus order survive process restart with the same directories. This is not merely UI decoration. These tests do not prove Hostinger redeploy durability or a complete production media-gallery/admin CRUD browser audit.

JSON mode remains the default for compatibility. Optional SQLite uses transactional snapshot storage, WAL and durable synchronous commits; imports existing JSON non-destructively when the SQLite database is empty. Actual HTTP order/media tests run against both drivers. It requires one application process and a persistent private directory; it is not a normalized multi-worker database. See `STORAGE_MIGRATION.md` for backup/import/export/rollback. The PostgreSQL export script is not a live PostgreSQL runtime adapter.

## SEO, keywords and content

Canonical domain is www HTTPS. Public static, product, four category, three article and published custom pages receive individual metadata, useful initial HTML and genuine stored-price schema. There are 41 indexable routes in the local snapshot and 20 published visible products. Public sitemap excludes utility/private/draft pages and invents no modification dates. Utilities noindex; missing pages/assets return real 404; aliases/trailing slashes/index.html redirect. Product/Offer, BreadcrumbList, Organization/WebSite and Article markup omit invented ratings/certification/GTIN. Initial HTML is a content fallback replaced by React, not complete React SSR/hydration.

`docs/seo/` contains all requested keyword research, keyword map, page audit, competitor research, content gap analysis, internal linking, technical SEO and content changelog. Fifty keyword candidates are qualitative hypotheses; search volumes, CPC, numeric competition, rankings and traffic are explicitly unverified. Priorities: GlowWithSH brand/founder searches → exact product names/prices → category comparison → fact-reviewed educational guides. Broad category competitiveness is a qualitative inference from established brand/marketplace examples.

Exactly rewritten: About brand introduction/values; Shop/category headings and comparison guidance; all 20 product metadata and common purchase/shipping/support sections; Contact/Checkout support/payment text; homepage metadata/entity presentation and navigation. Existing product ingredients/benefits, journal prose, founder CMS and awards facts were not independently substantiated or rewritten into invented facts. Exact affected URLs and limits are in `content-changelog.md`. Duplicate Tinted day cream/Anti acne gel names use SKU disambiguation; merging variants requires owner confirmation.

## UX / accessibility / performance

Optional measurement instrumentation covers the nine requested commerce events, requires explicit analytics consent, excludes customer PII and deduplicates purchases within the browser. No external tracker/measurement ID or consent provider was fabricated. External delivery and dashboards remain unverified; see `seo/analytics.md`.

Header/footer/cards and category pills use crawlable anchors. Tablet header navigation switches to the mobile layout below 1280px to prevent crowding. Category grids checked at 320/360/375/390/412/430/768/1280px had no document overflow. Checkout has a real H1, associated field labels, section headings and error alerts; Contact fields are associated with labels. Search/cart have dialog semantics and keyboard focus containment/restoration. Visible keyboard focus and reduced-motion rules added. This is an improvement, not WCAG certification; full screen-reader/contrast/keyboard coverage across every admin modal is unverified.

Hero uses the existing mobile video where available, metadata preload, reduced-motion/Save-Data handling, image fallback and a high-priority responsive WebP poster. New poster sizes: 35,846 bytes at 640px, 151,772 at 1280px, 298,038 at 1920px versus the old 569,541-byte JPEG. Four SHA-256-identical legacy image/video duplicates removed (7,923,318 bytes) with URL aliases preserved. Videos were not re-encoded; retained mobile video is roughly 1.85 MB. Other owner uploads remain untouched.

Baseline main JS 188.66 kB / 41.29 kB gzip; final main/API chunks are listed in validation. A shared API chunk was split out, so compare combined startup bytes rather than claiming all main-chunk savings as a page-load improvement. Vendor 241.32 / 77.01 kB unchanged. CSS grew slightly for focus/motion rules. No before/after Lighthouse, real mobile-network benchmark, LCP/INP/CLS or field conversion result is available; byte reductions do not establish those outcomes.

## Remaining external requirements

`OWNER_ACTIONS.md` gives WHAT / WHY / WHO / HOW / PRIORITY for production backups/storage, Razorpay onboarding/staging/live verification, secret rotation, labels/claim evidence/accountant/legal facts, duplicate SKU/photo confirmation, Search Console/analytics and operational promises. No owner action substitutes for repository implementation.

## Unverified and release limitations

Current changes are not deployed. Actual persistent paths, redeploy survival, backups/restore on Hostinger, exact Node minor, multiple-worker behavior, real gateway transactions/refunds/settlement, courier/email/WhatsApp automation, product efficacy/ingredient/SPF evidence, legal requirements, full policy adequacy, all admin browser flows, Rich Results Test eligibility, Google indexing, analytics consent/tracking IDs, rankings and field CWV remain unverified. Existing stored marketing claims require review before promoting them. Reports do not invent business evidence or mark these checks passed.


## Image authenticity correction

Known Unsplash product photos are visibly labelled Illustrative stock photo in cards and product galleries. They are omitted from Product schema and product social image metadata. Merchant photos uploaded from other sources still require owner authenticity checks. Merchant SEO field edits are honored when they differ from legacy seed defaults. Missing genuine product images may limit merchant rich-result eligibility; no Google eligibility claim is made.

Unsubstantiated bestseller/new/limited badge wording is replaced by Featured, and review moderation is distinguished from actual purchase verification. Product labels such as Skin whitening capsule require packaging/route-of-use confirmation; no oral/topical or efficacy assumption is verified by this audit.

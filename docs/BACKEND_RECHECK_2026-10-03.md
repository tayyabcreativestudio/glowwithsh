# Backend recheck — 2026-10-03

Rechecked the build containing commit `ed2061d` (logo plus production audit changes).

## Local verification

- `npm run typecheck`: passed.
- `npm test`: 42 passed, zero failures.
- `npm run test:integration`: 160 actual HTTP assertions passed using isolated JSON storage.
- `$env:TEST_DB_DRIVER='sqlite'; npm run test:integration`: 160 actual HTTP assertions passed using isolated SQLite storage.
- `node tests/payment-http.mjs`: 15 assertions passed using a local fake gateway. No real payment or refund occurred.

HTTP coverage includes authentication and role restrictions, checkout/stock/coupon validation, media upload/retrieval and persistence across process restart. Tests use temporary storage and do not create production orders. This coverage is not a guarantee against all backend failures or a complete security audit.

## Live read-only verification

Homepage, shop, admin HTML, health API, products, robots and sitemap returned HTTP 200. The product API returned 20 items. Anonymous admin media access returned HTTP 401 as expected. Evidence is in `seo/live-readonly-check.json`.

The deployed API still exposes `costPrice` and accepts unauthenticated `includeDrafts=true`; both fixes are present in the review branch but not deployed. No hidden draft entries were observed in this snapshot. Live availability does not prove every administration or commerce operation works.

## Release limitations

The GitHub review branch has not been deployed. Obtain a private production database/media backup and confirm durable Hostinger paths outside deployment-version directories before deployment. Process restart persistence is tested; Hostinger redeployment persistence and backup restoration are not verified. Real Razorpay sandbox/live transactions, callbacks, webhooks and refunds remain unverified; keep online payments disabled until onboarding and real gateway testing are complete. See `OWNER_ACTIONS.md` and `STORAGE_MIGRATION.md`.

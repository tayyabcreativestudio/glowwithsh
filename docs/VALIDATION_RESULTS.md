# Validation results — 2026-10-03

Environment: Windows, Node 24.21.0. All commerce write tests used isolated temporary storage and local servers. No real customer order, gateway payment or refund was created.

| Exact command | Result / scope |
|---|---|
| `npm ci` | Pass, 187 packages installed, 188 audited; zero reported vulnerabilities at baseline |
| `npm run typecheck` | Pass, TypeScript noEmit |
| `npm run lint` | Pass earlier; same TypeScript noEmit command, not a separate ESLint/security scanner |
| `npm test` | 42 tests pass, zero failures. Existing baseline 30 include simulations; additions check actual datastore rollback/SQLite import/reopen, role policy, reservation expiry, duplicate-line/CSRF regression, metadata/schema and consent/purchase deduplication. |
| `npm run build` | Pass: Vite frontend + bundled Express `dist/server.cjs`; Node server bundle 207.9 kB |
| `npm run test:integration` | 160 actual HTTP assertions pass: private endpoints, login, public fields, every sitemap route's initial HTML, noindex/404, COD/authoritative price, failed-coupon rollback, duplicate items, checkout retry, illegal status, reviews, invalid/real uploads, last-stock contention and restart persistence. JSON driver. |
| `$env:TEST_DB_DRIVER='sqlite'; npm run test:integration` | Same 160 assertions pass with SQLite, including actual order/media restart persistence. |
| `node tests/payment-http.mjs` | 15 actual HTTP assertions pass using a local fake gateway. Signature/amount/currency/capture/order matching, intent reuse, idempotent verification/webhook replay, closed-browser webhook recovery, partial/full/duplicate refund handling. NOT a Razorpay sandbox/live transaction. |
| `npx tsx scripts/seo-audit.ts` | Generated 41 public URL rows, 20 products and 50 qualitative keyword candidates, without modifying merchant data |
| `node scripts/live-readonly-audit.mjs` | Live home/shop/admin/health/products/robots/sitemap 200; anonymous admin media 401. Live product cost field exposure and unguarded draft flag confirmed. Snapshot stored without private cost values. |
| `node .audit-runtime/auth-media-readonly.mjs` | Authorized live admin login/media listing 200; four entries. No new live upload or persistence test. Private credentials/cookies never printed or committed. |
| `git diff --check` with configured safe.directory | Pass; Windows CRLF conversion warnings only |

## Browser checks

Codex in-app browser, isolated local production preview. Category DOM widths at 320/360/375/390/412/430/768/1280px were respectively 317/354/369/384/406/424/762/1274px: no document overflow. Mobile screenshot checked at 375px. Checkout shows labelled fields, H1, COD selected, online disabled without keys and ₹250 + ₹99 shipping = ₹349. Product/category links and canonical path verified. This is not comprehensive testing of every viewport, every browser or every admin flow.

## Performance evidence

| Artifact | Baseline | Final |
|---|---:|---:|
| Main entry JS | 188.66 kB / gzip 41.29 | 179.22 kB / gzip 40.56 |
| Shared API chunk | Included in baseline entry | 15.62 kB / gzip 2.74 |
| Combined main + API | 188.66 kB / gzip 41.29 | 194.84 kB / gzip 43.30 |
| React vendor | 241.32 kB / gzip 77.01 | 241.32 kB / gzip 77.01 |
| CSS | 84.96 kB / gzip 15.44 | 85.20 kB / gzip 15.56 |
| Hero poster JPEG | 569,541 bytes | Responsive WebP: 35,846 / 151,772 / 298,038 bytes at 640/1280/1920px |
| Duplicate media removed | Four redundant files | 7,923,318 bytes removed, legacy URLs redirected |

The new functionality slightly increases combined startup JS. Main-chunk splitting alone is not a measured performance win. Poster bytes and duplicate repository media reductions are real; Lighthouse score, field LCP/INP/CLS, TTFB, bandwidth savings for every visitor and conversion improvements were not measured. Videos retained; no claim of re-encoding.

## Reproduction

Build before running HTTP tests; tests start their own server on 5199 (payment fixture uses 5200/5201). Do not run JSON and SQLite HTTP suites simultaneously on the same port. Clear TEST_DB_DRIVER or set it explicitly for the desired driver. Avoid running production tests against live DATA_DIR: the scripts create temporary private directories and override credentials/storage.

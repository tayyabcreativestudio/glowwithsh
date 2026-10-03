# PageSpeed fixes — 3 October 2026

## Measured baseline

Read the supplied [mobile report](https://pagespeed.web.dev/analysis/https-www-glowwithsh-com/h9pcybesr2?form_factor=mobile) and [desktop report](https://pagespeed.web.dev/analysis/https-www-glowwithsh-com/h9pcybesr2?form_factor=desktop), dated 3 October 2026 at 22:55:54 IST.

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 45 | 71 |
| Accessibility | 96 | 96 |
| Best practices / SEO | 100 / 100 | 100 / 100 |
| FCP | 2.9 s | 0.8 s |
| LCP | 5.9 s | 1.2 s |
| Total blocking time | 30 ms | 0 ms |
| CLS | 0.899 | 0.573 |
| Speed index | 5.4 s | 2.1 s |

No CrUX field data was available. These numbers describe the existing deployed site; they are not scores for this branch.

## Implemented changes

- Render the full homepage on the Express server, with the same public product/CMS data supplied to the first React render. Previously the homepage body started empty while nine API requests completed, moving the footer from the initial viewport to the end of the page. React still mounts with createRoot; this change does not introduce hydration. The existing API refresh keeps public data current.
- Serialize only public storefront data, excluding draft products/pages/posts, unverified awards, cost prices, supplier details, admin accounts and orders. Escape script delimiters in JSON. Regression tests cover this boundary.
- Render a high-priority, responsive hero poster immediately. The background video downloads only after Play; it stays muted and respects reduced-motion/data-saving preferences. This deliberately replaces automatic background playback to avoid the reported 4.3 MB initial video transfer.
- Select the existing 35,846-byte mobile poster instead of the reported approximately 381 KiB legacy poster; retain larger 1280/1920 variants for larger screens.
- Serve Manrope and Cormorant Garamond fonts locally with font-display: optional, removing the render-blocking Google Fonts stylesheet. A slow cold visit can retain its fallback font instead of swapping later and shifting text.
- Add responsive Unsplash image variants and image dimensions to storefront cards/sections. Merchant upload and other CDN URLs are preserved unchanged.
- Load product detail, cart, checkout and confirmation code on demand. The Vite main entry shrank from 182.19 kB (gzip 41.42 kB) to approximately 110.95 kB (gzip 28.08 kB). Shared React/API files still load, so this is a main-entry comparison, not a claim that all JavaScript shrank by the same percentage.
- Cache public images/videos for seven days. Hashed assets, including the new fonts, keep one-year immutable caching. HTML retains revalidation. Replace an asset's URL when changing its bytes to avoid serving an old cached version.
- Darken pale-purple storefront labels and sale/low-stock badges to improve contrast. Replace the oversized stock-photo support avatar with the existing brand mark and remove its unsupported online/verified indicators.

## Validation completed

- Production build and TypeScript check passed.
- 45 unit tests passed, including new public-snapshot security and responsive-image tests.
- Production HTTP regression suite: 175 assertions passed with JSON and another 175 with SQLite. These cover admin authentication, public/private API boundaries, media upload and persistence, categories/pages and order/inventory behaviour in isolated temporary storage.
- Browser preview at desktop size and 390 × 844 mobile: one H1, full homepage/footer, no horizontal overflow and no video element before Play. Mobile selected hero-poster-640.webp; desktop selected hero-poster-1920.webp. Play mounted and played the muted mobile video; Pause worked. No browser warning/error logs were observed during these checks.
- HTTP HEAD checks returned 200 with public, max-age=604800 for the poster/video, and public, max-age=31536000, immutable for the hashed Manrope font.
- No live orders, credentials, Hostinger settings or production storage were changed.

## Deployment and remaining measurement

These changes are uploaded to codex/production-seo-audit-2026-10-03. Hostinger currently builds main; pushing this review branch does not update the live site.

Before switching production to this branch, back up the current product/order database and media, and confirm DATA_DIR and UPLOADS_DIR refer to real persistent directories outside versioned hbuilds deployment folders. Earlier screenshots contained a literal placeholder path, and current durable storage/redeployment behaviour has not been verified. See the existing deployment/readiness reports for the full release checklist.

After deployment, run new mobile and desktop PageSpeed audits. Verify CLS below 0.1 and LCP below 2.5 s under the audit conditions, then inspect any remaining largest-contentful element, CSS delivery and contrast findings. The structural fixes and local checks do not establish a new Lighthouse score or guarantee that every accessibility issue is resolved. Server-side rendering also increases server bundle size and rendering work; monitor actual response times after deployment.

References: [layout-shift guidance](https://web.dev/articles/optimize-cls), [LCP guidance](https://web.dev/articles/optimize-lcp).

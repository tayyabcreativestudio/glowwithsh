# Technical SEO implementation and verification

Canonical origin: `https://www.glowwithsh.com`. All indexable public pages receive one title, description, canonical, robots directive, social metadata and page-specific initial HTML. SPA navigation retrieves the same public metadata from `/api/seo`. Private/draft catalog information is excluded. Unknown pages/assets/API endpoints return 404. Trailing slashes, `/index.html` and supported old aliases redirect to canonical routes. Query filters are not independent sitemap pages; canonical points to the underlying path.

This is a server-generated content fallback replaced by React after loading, not full React SSR/hydration. The fallback is served to all visitors, not selected by crawler user agent. Product text, prices, links and schema are available before JavaScript. Policies currently have an initial summary and their complete client page; this does not claim full policy SSR.

Sitemap uses published visible products, real categories, published journal/custom pages and public static routes. No invented `lastmod` dates. Cart, checkout, wishlist, quiz, tracking and admin pages have noindex. Robots excludes admin/API crawling; robots alone is not access control. API authorization remains server-side.

Structured data: Product/Offer from stored name/SKU/price/availability/image with INR; no invented aggregate ratings/reviews. Organization/WebSite only factual brand/founder names; BreadcrumbList on public detail pages; Article from published article data. No invented GTIN, certifications, return eligibility, shipping promises or FAQ rich-result guarantee. Existing ingredient/benefit prose needs independent merchant substantiation.

Verified locally: sitemap routes return 200 and contain H1, title and canonical; unknown route 404, utilities noindex, structured JSON parsed/escaped by unit tests. Live read-only snapshot is recorded separately; it still runs the older build with generic initial HTML. Google Rich Results Test, URL Inspection and indexing outcomes have NOT been independently verified.

## Official references consulted

- [Search Essentials](https://developers.google.com/search/docs/essentials): useful content, descriptive words and crawlable links; eligibility does not guarantee indexing.
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): rendering, links and page metadata.
- [Structured data generated with JavaScript](https://developers.google.com/search/docs/appearance/structured-data/generate-structured-data-with-javascript): initial markup reduces dependency on delayed product rendering.
- [E-commerce URL structure](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites): consistent canonical URLs.
- [Site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure): category-to-product discovery.
- [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap): canonical public URLs and accurate modification dates.
- [Product snippets](https://developers.google.com/search/docs/appearance/structured-data/product-snippet), [merchant listings](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing), [variants](https://developers.google.com/search/docs/appearance/structured-data/product-variants): truthful product attributes; richer eligibility remains unverified.
- [Breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization): appropriate page/entity markup.
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals): field experience cannot be inferred from bundle size alone.

Business copy review should also consider the official [consumer protection materials](https://consumeraffairs.nic.in/acts-and-rules/consumer-protection/consumer-protection), [2022 misleading advertisement guidelines](https://consumeraffairs.nic.in/sites/default/files/CCPA_Notification.pdf) and [2023 dark-pattern guidelines](https://consumeraffairs.nic.in/sites/default/files/The%20Guidelines%20for%20Prevention%20and%20Regulation%20of%20Dark%20Patterns%2C%202023.pdf). This audit is not a legal certification.

Known Unsplash stock photos are omitted from Product schema and product OG/Twitter image metadata and labelled visibly in cards/galleries. Genuine product photos must be provided for fully representative product markup.

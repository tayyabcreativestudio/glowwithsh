# Readiness follow-up and Google integration

## Bugs found and fixed

- Native URL inputs rejected root-relative uploaded media paths, preventing page/award/homepage saves. Image fields now accept those paths as well as external URLs.
- Page preview links hardcoded development port 5173. They now preserve the current port.
- Category save errors were swallowed in App, which could close the form despite failure. Errors now propagate and appear inline while keeping the form open.
- Creating a category ignored its chosen slug. The API now respects and normalizes it; updates whitelist fields and preserve immutable category IDs.
- Page title-only updates could unexpectedly change a custom URL. They retain the existing slug unless explicitly changed. API/static directory names are reserved against custom-page collisions.
- FAQ existed in sitemap/routing but rendered an empty policy body. It now contains FAQs. Policy content follows incoming route changes.
- Review moderation accepted arbitrary status values. It now accepts only pending, approved and rejected. The optional SQL export schema no longer defaults every review to a verified purchase; this does not retroactively change existing reviews.
- Removed blanket independent-award-audit and legal-compliance assertions, automatic email/WhatsApp tracking promises and guaranteed GST-invoice wording. Added optional Google Analytics disclosure. Shipping/refund timelines, named courier relationships, seller address/contact/mailboxes, legal policy terms and product efficacy claims still require owner verification; they are not certified by this review.

## Google integration

The owner's GA4 ID and Search Console token are wired into the source. CSP permits tag loading and GA4 requests. Analytics loads after a visitor opts in, sends gtag commerce events and excludes private routes from explicit page views. See `seo/analytics.md` for DNS verification and GA4 Enhanced Measurement settings. This is on the GitHub review branch, not deployed. Google verification and receipt of live events remain unverified.

## Validation

Production build and TypeScript checks passed. Final unit checks: 43 tests passed. Expanded actual HTTP regression checks: 175 assertions with JSON and 175 with SQLite. Payment fixture: 15 assertions with a local fake gateway, no actual transaction. Local browser confirmed visible FAQ, SPA policy navigation, loaded logo, exact verification meta content, denied-consent suppression and single tag creation after consent. No console errors observed in that check. This is targeted coverage, not a guarantee that every interface, edge case or security issue is resolved.

## Live and external blockers

Latest live read-only checks still show the older build: homepage/shop/admin/health/products respond, but costPrice remains public and anonymous includeDrafts=true remains accepted. Confirm private database/uploads backups and durable Hostinger paths before deploying the fixes. Confirm Node compatibility and one app instance, then check restoration and upload survival after redeployment. Keep online payments disabled until real Razorpay onboarding/testing. Rotate exposed credentials privately. Verify genuine photos, ingredient/efficacy/SPF claims, duplicate SKUs, operational policies, support mailboxes and legal/tax details. Automatic courier/email/WhatsApp delivery is not integrated. See `OWNER_ACTIONS.md`.

# Measurement status

No verified analytics account/measurement ID was present, so no tracker or external data transmission was enabled. Optional first-party dataLayer instrumentation is prepared in `src/utils/analytics.ts` for view_item, view_item_list, select_item, add_to_cart, remove_from_cart, view_cart, begin_checkout, add_payment_info and purchase.

Events are suppressed unless an explicit consent integration calls `setAnalyticsConsent(true)`. That function is not called automatically. No consent is inferred from browsing, checkout or newsletter subscription. A real consent UI/provider and the owner's authorized analytics account must be connected before external measurement. No fictitious ID or privacy-compliance claim is supplied.

Payloads contain product names/SKUs/categories/prices/quantities, currency and transaction reference; never customer names, contact details, address, credential, cost price or payment signature. Purchase value is merchandise subtotal minus discount, excluding delivery fee. COD purchase means a submitted COD order, not settled revenue. WhatsApp enquiries and unverified online intents do not emit purchase. Repeated purchase for the same order is suppressed in that browser's local storage; cross-device deduplication requires the actual analytics system. Measurement errors never interrupt checkout.

External GA/GTM delivery, dashboards, consent jurisdiction, attribution and conversion metrics remain unverified. When authorized tracking is configured, review its CSP destinations and privacy wording instead of simply pasting an arbitrary third-party script.

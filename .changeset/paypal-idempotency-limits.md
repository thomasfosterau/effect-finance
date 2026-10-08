---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-paypal": patch
---

Document PayPal's `PayPal-Request-Id` limits as its published OpenAPI specifications state them, replacing the unverified figures (#93).

- `PayPalRequest.requestId` and the `IdempotencyKey` module docs give the limits per API: Orders takes 1 to 108 characters and keeps an id for 6 hours by default (up to 72 on request to PayPal); Catalog Products and Subscriptions state no length limit and keep it for 72 hours; Payments (refunds) takes 1 to 10 000 characters and states no retention.
- The replay-window guidance is now "a few hours": on PayPal a `PaymentIntent.create` / `confirm` retry is deduplicated only within the Orders API's 6 hours.
- The 1 to 64 character `IdempotencyKey` shape is unchanged; it fits every PayPal limit. Stripe's and Airwallex's figures remain unverified.

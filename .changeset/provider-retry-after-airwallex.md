---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Airwallex no longer drops a customer `description` or a 429's `Retry-After` header without a word:

- `Customer.create` and `Customer.update` with a `description` now fail with `PaymentInvalidRequestError` before anything is sent, instead of sending the rest and dropping the description. This provider maps no Airwallex field to it.
- A 429 now fails with `PaymentRateLimitError` carrying `retryAfter` (seconds) when Airwallex sends a `Retry-After` header in whole seconds, as Stripe's does.

The core's semver-exempt `./internal` subpath supports this: `send`'s `Reply` now carries the response `headers`, and `errorFromStatus` takes the raw `Retry-After` header for a 429.

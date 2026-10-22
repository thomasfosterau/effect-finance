---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-paypal": patch
---

PayPal no longer silently drops product and price options, or a 429's `Retry-After` header:

- `Product.create` / `Product.update` with `active: false` or a non-empty `metadata`, and `Product.update` with a `name`, now fail with `PaymentInvalidRequestError` before anything is sent. A PayPal product is always active, keeps no metadata, and its name cannot be patched. Previously the update sent only the `description` and dropped the rest.
- `Price.create` with `active: false` now creates the plan in PayPal's not-yet-active `CREATED` state, read back as `active: false`. Previously it created an active plan. `Price.create` / `Price.update` with a non-empty `metadata` now fail with `PaymentInvalidRequestError`.
- A 429 now fails with `PaymentRateLimitError` carrying `retryAfter` (seconds) when PayPal sends a `Retry-After` header in whole seconds, on the login and on every capability call.

The core's semver-exempt `./internal` subpath supports this: `send`'s `Reply` now carries the response `headers`, and `errorFromStatus` takes the raw `Retry-After` header for a 429.

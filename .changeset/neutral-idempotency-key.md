---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

A neutral, branded `idempotencyKey` on the create and confirm operations, so a caller's retry of a timed-out write is one logical write on every provider (closes #55 and #66).

- **Core.** New `IdempotencyKey` module (`@thomasfosterau/effect-payments/IdempotencyKey`, also exported from the barrel): a branded `Schema` for a key of 1 to 64 characters from `A-Z a-z 0-9 _ -`, `IdempotencyKey.generate` (a random UUID, as an `Effect`) and `IdempotencyKey.validate`. The optional `idempotencyKey?: IdempotencyKey` is added to `Customer.CreateParams`, `Product.CreateParams`, `Price.CreateParams`, `PaymentIntent.CreateParams` / `ConfirmParams`, `Subscription.CreateParams`, `Refund.CreateParams` and `CheckoutSession.CreateParams` (every create / confirm that each provider implementing it can honour). It is not on updates, `Subscription.cancel`, `PaymentIntent.cancel` or `BillingPortal.create`. The key is optional.
- **Stripe, PayPal, Airwallex.** Each maps the key onto its vendor mechanism: `Idempotency-Key`, `PayPal-Request-Id`, and the body's `request_id` (in place of the fresh per-call id). A key that is not a valid `IdempotencyKey` (a raw string from untyped code) fails with `PaymentInvalidRequestError` before anything is sent.
- **The pattern.** Create one key per logical write before the first attempt and reuse it on every retry; retry only when the outcome is unknown or the write was not applied (`PaymentNetworkError`, `PaymentProviderError` with `statusCode >= 500`, `PaymentRateLimitError`). A key reused with different parameters is a `PaymentProviderError` on Stripe (`StripeIdempotencyError`); PayPal's and Airwallex's behaviour is unverified. See "Retrying a write safely" in the core README.
- Stripe's and Airwallex's key-length limits and replay windows could not be checked against their documentation and are documented as unverified (PayPal's: see its own entry).

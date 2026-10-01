---
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

Per-call idempotency keys at each provider's request layer, so a caller's retry of a timed-out write can be recognised by the vendor (#55, part of #66).

- **Stripe.** Every resource-module operation takes a trailing `options?: { idempotencyKey?, stripeAccount? }` (`StripeHttp.RequestOptions`, also exported as `RequestOptions`), forwarded to the transport as `Idempotency-Key` and `Stripe-Account`. The change is additive. Create one key per logical write and reuse it on every retry. An empty `idempotencyKey` or `stripeAccount` fails with `PaymentInvalidRequestError` before anything is sent.
  - **Point-free use.** The trailing parameter means an operation passed point-free to an iterator that supplies an index now binds the index to `options` and fails to type-check, e.g. `Effect.forEach(ids, Customer.del)` (TS2769). Wrap it: `(id) => Customer.del(id)`. No change of semver level.
- **PayPal.** `PayPalRequest.requestId` is sent as the `PayPal-Request-Id` header on a `POST`.
- **Airwallex.** `AirwallexRequest.requestId` is written into the body as `request_id`, replacing the fresh id the capability layers generate.
- An empty `requestId`, or one on a method that cannot honour it, fails with `PaymentInvalidRequestError` before anything is sent, rather than being silently dropped.
- The vendors' key-length limits and replay windows could not be checked against their documentation and are documented as unverified.

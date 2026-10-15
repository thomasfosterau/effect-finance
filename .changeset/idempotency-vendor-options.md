---
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

Per-call idempotency keys at the Stripe and Airwallex request layers, so a caller's retry of a timed-out write can be recognised by the vendor (#55, part of #66).

- **Stripe.** Every resource-module operation takes a trailing `options?: RequestOptions` (`StripeHttp.RequestOptions`, also exported from the package root) whose `idempotencyKey` is sent as `Idempotency-Key` and `stripeAccount` as `Stripe-Account`. Create one key per logical write and reuse it on every retry. An empty `idempotencyKey` or `stripeAccount` fails with `PaymentInvalidRequestError` before anything is sent.
- **Airwallex.** `AirwallexRequest.requestId` is written into the body as `request_id`, replacing the fresh id the capability layers generate. An empty `requestId`, or one on a request that is not a `POST` with a JSON object body, fails with `PaymentInvalidRequestError` before anything is sent, rather than being silently dropped.
- The vendors' key-length limits and replay windows could not be checked against their documentation and are documented as unverified.

---
"@thomasfosterau/effect-payments-stripe": minor
---

`Webhook.verify` is now the default webhook verifier: a Workers-safe WebCrypto implementation that needs neither the `stripe` SDK nor any Node API (#41).

- **`Webhook.verify({ payload, header, secret, tolerance? })`** checks the `Stripe-Signature` header (HMAC-SHA256 over `${t}.${rawBody}`, every `v1` digest compared in constant time, so secret rotation works), refuses a timestamp more than `tolerance` seconds either side of now (default `DEFAULT_TOLERANCE`, 300 s; "now" comes from Effect's `Clock`), and then decodes the event envelope. The secret is a `Redacted<string>`; the payload is the raw body as a string or bytes. A refusal is a `SignatureVerificationError` whose `message` is one of the exported constants (`MALFORMED_HEADER_MESSAGE`, `OUTSIDE_TOLERANCE_MESSAGE`, `SIGNATURE_MISMATCH_MESSAGE`, `INVALID_TOLERANCE_MESSAGE`) and which never carries the secret or the payload; a signed body that is not an event fails with `Schema.SchemaError`.
- **`Webhook.verifySignature`** (the check alone), **`Webhook.signatureHeader`** (sign a payload as Stripe does, for tests, without the SDK) and **`Webhook.SIGNATURE_HEADER`**.
- **Lenient event decoders**: `WebhookEvent` / `decodeEvent`, `handledEventTypes` / `isHandledEventType`, `HandledEvent` / `decodeHandledEvent` (a `type`-discriminated union, `none` for unhandled types), and `CheckoutSessionObject`, `SubscriptionObject`, `InvoiceObject` with `decodeCheckoutSession`, `decodeSubscription`, `decodeInvoice`.

The SDK-based `Webhook.constructEvent` / `constructEventAsync` / `generateTestHeaderString*` are unchanged and remain available as the optional alternative (they need `Stripe.layer` and the `stripe` peer). No existing export changed signature, so there is no breaking change to `Webhook`.

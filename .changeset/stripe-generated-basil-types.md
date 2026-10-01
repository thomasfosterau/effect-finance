---
"@thomasfosterau/effect-payments-stripe": minor
---

The default Stripe API version is `2025-08-27.basil`, and `CheckoutSession` and the `BillingPortal.Session` resource module are typed by Schemas generated from Stripe's OpenAPI spec, with their responses decoded.

A consumer that does not set `apiVersion` sends `Stripe-Version: 2025-08-27.basil` (for example, an invoice's subscription sits under `parent.subscription_details`, and a subscription's period fields sit on its items); set `apiVersion` to pin another version. The optional `stripe` peer is `^18.5.0`, the release for the same API version, so the peer, the default and the generated types stay in lockstep (the SDK transport's `Stripe-Version` follows `DEFAULT_API_VERSION`).

- **Generated types.** `src/internal/generated/schemas.ts` is written by `scripts/generate-stripe-schemas.ts` (`vp run --filter ./packages/payments-stripe generate:schemas`) with `@effect/openapi-generator` from `stripe/openapi` at a pinned tag (`v1928`) whose `spec3.json` SHA-256 the script verifies. The pin is `scripts/stripe-spec.json`.
- **`CheckoutSession`** (`create`, `retrieve`, `expire`, `list`) and **`BillingPortal.Session`** (`create`; also exported from the barrel as `BillingPortalSession`) export their Schema (`Session`, `SessionList`) and parameter types (`SessionCreateParams`, …). Every response is decoded, and a 2xx body that does not match fails with `PaymentProviderError` instead of being cast. Their emitted `.d.ts` files do not import `stripe`, so a consumer of only these modules needs no `stripe` types. An expandable field (`customer`, `payment_intent`, …) decodes as its id or, when expanded, an open JSON object; response enumerations are lenient (a value Stripe adds later decodes as `Enumeration.Other`) while request enumerations stay closed to the pinned spec.
- The other resource modules use the `stripe` package's types at 18.5. They migrate one by one.

---
"@thomasfosterau/effect-payments-stripe": minor
---

**Breaking:** the default Stripe API version is now `2025-08-27.basil` (it was `2025-02-24.acacia`), and `CheckoutSession` and the new `BillingPortal.Session` resource module are typed by Schemas generated from Stripe's OpenAPI spec, with their responses decoded.

This is `minor` rather than `patch` because the package is pre-1.0 and the same release already carries other breaking changes (the convention in this repository's changesets): a consumer that did not set `apiVersion` now sends `Stripe-Version: 2025-08-27.basil`, which reshapes some responses (for example, an invoice's subscription moves under `parent.subscription_details`, and a subscription's period fields move onto its items). Set `apiVersion` to keep a previous version. The optional `stripe` peer moves to `^18.5.0`, the release for the same API version, so the peer, the default and the generated types stay in lockstep (the SDK transport's `Stripe-Version` follows `DEFAULT_API_VERSION`).

- **Generated types.** `src/internal/generated/schemas.ts` is written by `scripts/generate-stripe-schemas.ts` (`vp run --filter ./packages/payments-stripe generate:schemas`) with `@effect/openapi-generator` from `stripe/openapi` at a pinned tag (`v1928`) whose `spec3.json` SHA-256 the script verifies. The pin is `scripts/stripe-spec.json`.
- **`CheckoutSession`** (`create`, `retrieve`, `expire`, `list`) and **`BillingPortal.Session`** (`create`, new; also exported from the barrel as `BillingPortalSession`) export their Schema (`Session`, `SessionList`) and parameter types (`SessionCreateParams`, …). Every response is decoded, and a 2xx body that does not match fails with `PaymentProviderError` instead of being cast. Their emitted `.d.ts` files no longer import `stripe`, so a consumer of only these modules needs no `stripe` types. An expandable field (`customer`, `payment_intent`, …) decodes as its id or, when expanded, an open JSON object; enumerations are closed to the pinned spec.
- The other resource modules keep the `stripe` package's types, now at 18.5 (`ExternalAccount` and `Person` use its renamed parameter types). They migrate one by one.

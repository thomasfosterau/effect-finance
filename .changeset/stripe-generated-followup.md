---
"@thomasfosterau/effect-payments-stripe": patch
---

Harden the generated `CheckoutSession` / `BillingPortal.Session` types (follow-up to the generated-types change).

- **Response enumerations are lenient.** A value Stripe adds to an enumeration later (`payment_status`, `mode`, `locale`, …) decodes as `Enumeration.Other` carrying the raw string instead of failing the whole response, which mattered because the failure came after a non-idempotent create or expire had already taken effect. Known values stay bare strings; the `object` discriminator and request parameters stay closed. A response is also no longer checked against Stripe's documented `maxLength` or integer constraints. Code that exhaustively matches a response enumeration must now also handle `Other`.
- **Parameter types use `?: T | undefined`** for every optional member at any depth (the generator's open index signature on request objects is dropped, since it could not accept a nested `undefined`), the repository convention under `exactOptionalPropertyTypes`, so a caller forwarding an optional of its own compiles.
- **Tree-shaking.** The generated schemas are marked pure, so a bundle that imports one resource module no longer carries the schemas of the others.
- **Fallout of the earlier default-version change** (`Stripe-Version` `2025-08-27.basil`, `stripe` peer `^18.5.0`): a consumer type-checking the unmigrated modules against `stripe@17` must move to 18.5 (`ExternalAccount` / `Person` now use the SDK's renamed parameter types), and `apiVersion` governs only what this transport sends, since webhook events are delivered at the receiving endpoint's API version (or the account default).

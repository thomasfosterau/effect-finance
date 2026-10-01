---
"@thomasfosterau/effect-payments-stripe": patch
---

Harden the generated `CheckoutSession` / `BillingPortal.Session` types (follow-up to the generated-types change).

- **Response enumerations are lenient.** A value Stripe adds to an enumeration later (`payment_status`, `mode`, `locale`, …) decodes as `Enumeration.Other` carrying the raw string instead of failing the whole response, which mattered because the failure came after a non-idempotent create or expire had already taken effect. Known values stay bare strings; the `object` discriminator and request parameters stay closed. A response is also no longer checked against Stripe's documented `maxLength` or integer constraints. Code that exhaustively matches a response enumeration must now also handle `Other`.
- **Parameter types use `?: T | undefined`** for every optional member, the repository convention under `exactOptionalPropertyTypes`, so a caller forwarding an optional of its own compiles.
- **Tree-shaking.** The generated schemas are marked pure, so a bundle that imports one resource module no longer carries the schemas of the others.
- **Reminder of the earlier default-version change.** `StripeHttp`'s default `Stripe-Version` is `2025-08-27.basil`, so a consumer that does not set `apiVersion` now sends it. The optional `stripe` peer is `^18.5.0` (it was `^17.6.0`), and the resource modules not yet migrated take their types from it: a consumer type-checking against `stripe@17` must move to 18.5, and `ExternalAccount` / `Person` now use the SDK's renamed parameter types (`AccountCreateExternalAccountParams`, `AccountCreatePersonParams`, …). The default governs what this transport sends only: webhook events are delivered at the API version of the receiving endpoint (or the account default), whatever `apiVersion` is set here, so a handler may still see the older shapes (for example an invoice's top-level `subscription`) until the endpoint's version is changed in the Stripe dashboard.

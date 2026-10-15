---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

"Not configured ≡ down": a Stripe layer that builds without a key and fails each call with a typed `PaymentsUnavailable` while the key is absent.

- **Core:** a new `PaymentsUnavailable` error (`message`, optional `provider`): no provider can serve the call, typically because its credential is not configured. It is raised at call time, never while a layer is built, and it is part of the `PaymentsError` union, so an exhaustive matcher (`Match.exhaustive`, `Effect.catchTags` covering every tag, a `switch` on `_tag` with a `never` default) handles it.
- **Core:** a new `Stub` subpath (`@thomasfosterau/effect-payments/Stub`): capability layers whose every call fails with one given `Effect` — `Stub.layer(failure)` for every capability, one constructor per capability (`Stub.customers`, …, `Stub.checkoutSessions`, `Stub.billingPortalSessions`), and `Stub.unavailable(provider?)`, every capability failing with `PaymentsUnavailable`. Building a stub never fails and requires nothing.
- **Stripe:** `StripePayments.layerConfig(options?)` and `StripeHttp.layerConfig(options?)`. The key is read as a `Redacted` from a configuration variable (`STRIPE_API_KEY` by default, `envVar` to change it) through the current `ConfigProvider` on every call, never at layer construction, so the layer's error type is `never` and a Worker without billing configured still boots. While the key is absent (or empty, or unreadable) every call — every neutral capability, and every raw resource module over `StripeHttp.layerConfig` — fails with `PaymentsUnavailable` (`provider: "stripe"`) before anything is sent; once it is present, calls go to Stripe with that key. The other client options (`apiVersion`, `maxNetworkRetries`, `timeout`, `stripeAccount`, `baseUrl`, `uploadsBaseUrl`) are accepted as in `layer`. `layer` / `layerFromEnv` still fail the build without a key.
- **PayPal / Airwallex:** the unsupported `checkoutSessionsLayer` / `billingPortalSessionsLayer` stubs are built with the core's `Stub`.

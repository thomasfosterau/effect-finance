---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

First release of the `@thomasfosterau/effect-payments` family: a vendor-neutral payments core for Effect 4 and its provider implementations. A program is written against the core's capabilities and runs on any provider by changing only the layer it provides — the payments analogue of Effect's AI modules.

- **`@thomasfosterau/effect-payments`** — the vendor-neutral core: provider-agnostic capabilities (`Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`) as `Context.Service` classes with module-level accessors (`Customer.create`, …), neutral domain entities (`Customer`, `Product`, `Price`, `PaymentIntent`, `Subscription`, `Refund`, `Money`) and a neutral error channel (`PaymentsError`) of `Schema.TaggedError` classes, so errors work with `catchTag` and `instanceof` and are schema-encodable.
- **`@thomasfosterau/effect-payments-stripe`** — the Stripe implementation: `Layer`s that implement the neutral capabilities over Distilled's Stripe operations (`@distilled.cloud/stripe`), plus a Stripe-specific resource module per Stripe API resource as a provider escape hatch.
- **`@thomasfosterau/effect-payments-paypal`** and **`@thomasfosterau/effect-payments-airwallex`** — the PayPal (over Distilled's PayPal operations, `@distilled.cloud/paypal`) and Airwallex implementations of the capabilities each vendor supports.
- **Effect 4.** The core and the Airwallex provider require `effect` `>=4.0.0-rc.118` as a peer; the Stripe and PayPal providers require `^4.0.0`, the peer range of the Distilled packages they depend on. The emitted declarations name the rc.118 module paths (`effect/http`, not `effect/unstable/http`). Code that provides the HTTP client imports `FetchHttpClient` from `effect/http`.
- **HTTP through `effect/http`.** Every provider's layers require an `HttpClient`: provide `FetchHttpClient.layer`, and stub `FetchHttpClient.Fetch` or the `HttpClient` in tests. Token and error responses are decoded, so a malformed token response fails with `PaymentProviderError`.
- **Configuration through `Config`.** `layerFromEnv` reads through `Config`, so a custom `ConfigProvider` applies, and a missing or empty variable fails with `PaymentConfigError`. Effect's `ConfigProvider` reads a literal empty string as a missing value.
- **Endpoint selection.** PayPal's and Airwallex's `layerFromEnv` require `PAYPAL_ENV` / `AIRWALLEX_ENV` (`live` | `sandbox`) to select the endpoint, so neither selects live by default (#90). A configured `baseUrl` that is blank or not an absolute http(s) URL fails with `PaymentConfigError`.
- **Request caching.** The Stripe resource modules do not cache `retrieve` or `list`; a consumer that wants caching adds it per resolver (`RequestResolver.withCache`) or with `Cache`.
- The Stripe SDK client the `Webhook.constructEvent*` verifier runs on is provided as `Webhook.StripeService`, whose context key is `"@effect-payments-stripe/StripeService"`.

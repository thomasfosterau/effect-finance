---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

**Breaking:** move to Effect 4. The `effect` peer range is now `>=4.0.0-rc.115` (it was `^3.10.0`), in lockstep with the applications that consume these packages.

- The capabilities (`Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`) and the provider clients (`StripeService`, `PayPalClient`, `AirwallexClient`) are `Context.Service` classes. The module-level accessors (`Customer.create`, …) are unchanged.
- The errors are `Schema.TaggedError` classes with the same tags and fields, so `catchTag` and `instanceof` keep working and they are now schema-encodable.
- The PayPal and Airwallex clients use `effect/unstable/http`. Their layers require an `HttpClient` (provide `FetchHttpClient.layer`), and the `fetch` config option is gone: stub `FetchHttpClient.Fetch` or the `HttpClient` in tests. Token and error responses are decoded, so a malformed token response fails with `PaymentProviderError` rather than yielding an `undefined` token.
- `layerFromEnv` reads through `Config`, so a custom `ConfigProvider` applies. A missing variable still fails with `PaymentConfigError`.
- The Stripe resource modules call the SDK directly. Effect 4 removed `Effect.withRequestCaching` and the global request cache it read from, so `retrieve` and `list` are no longer served from that process-wide cache (entries up to an hour old under Effect 3). Caching is still available per resolver (`RequestResolver.withCache`) or with `Cache`, if a consumer wants it.
- `StripeService`'s context key changed from `"Stripe"` to `"@effect-payments-stripe/StripeService"`. Code that provides or reads the service through the class (`Layer.succeed(StripeService, …)`, `yield* StripeService`) is unaffected; only code that looked the service up by its key string must change.

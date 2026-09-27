---
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

**Breaking:** redacted secrets and decoded responses in the PayPal and Airwallex providers.

- `PayPalConfig.clientSecret` and `AirwallexConfig.apiKey` are now `Redacted<string>`. Wrap the value with `Redacted.make(...)` when you call `layer`. `layerFromEnv` reads it with `Config.Redacted`, and a missing or empty variable still fails with `PaymentConfigError`. The client id stays a plain string.
- Every vendor response a capability reads is now decoded with a `Schema` narrowed to the fields it maps. A 2xx body that does not match (a missing id, a non-numeric amount, a list without its collection) fails with `PaymentProviderError` (`"PayPal returned a malformed … response"`) instead of producing an entity built from `undefined`. Unknown fields are still ignored and statuses keep their lenient mapping. A PayPal list page with no collection reads as empty. Airwallex metadata keeps only its string values instead of failing on the others. Two checks are new and stricter: a PayPal plan's `interval_count` must be a positive integer, and a subscription `quantity` must be a whole number. A PayPal partial refund whose capture has no amount now fails instead of assuming USD.
- `PayPalClient.request` / `AirwallexClient.request` lose their unchecked type parameter and return `unknown`. A custom client that implements the service must return the body as-is.
- A transport failure's `PaymentNetworkError` no longer carries the `HttpClientError` as its cause, because that error's request holds the credential headers. It carries only the underlying failure.

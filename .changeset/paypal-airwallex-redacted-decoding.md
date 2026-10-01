---
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

Redacted secrets and decoded responses in the PayPal and Airwallex providers.

- `PayPalConfig.clientSecret` and `AirwallexConfig.apiKey` are `Redacted<string>`: wrap the value with `Redacted.make(...)` when you call `layer`. `layerFromEnv` reads it with `Config.Redacted`, and a missing or empty variable fails with `PaymentConfigError`. The client id is a plain string.
- Every vendor response a capability reads is decoded with a `Schema` narrowed to the fields it maps. A 2xx body that does not match (a missing id, a non-numeric amount, a list without its collection) fails with `PaymentProviderError` (`"PayPal returned a malformed … response"`) instead of producing an entity built from `undefined`. Unknown fields are ignored and statuses keep their lenient mapping. A PayPal list page with no collection reads as empty. Airwallex metadata keeps only its string values. A PayPal plan's `interval_count` must be a positive integer, a subscription `quantity` a whole number, and a PayPal partial refund whose capture has no amount fails rather than assuming USD.
- `PayPalClient.request` / `AirwallexClient.request` return `unknown`; a custom client that implements the service returns the body as-is.
- A transport failure's `PaymentNetworkError` carries only the underlying failure, never the `HttpClientError`, whose request holds the credential headers.

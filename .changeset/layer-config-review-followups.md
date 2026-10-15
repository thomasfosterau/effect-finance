---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
---

How the Stripe `layerConfig` (#42) reads its key and reports its absence, and the core's `Stub` failures.

- **Stripe:** `StripeHttp.layerConfig` / `StripePayments.layerConfig` read the key from the calling fiber's `ConfigProvider` first and fall back to the `ConfigProvider` the layer was built under, so a provider attached to the layer (`layerConfig().pipe(Layer.provide(ConfigProvider.layer(…)))`) is honoured, as it is for `layerFromEnv`. The `PaymentsUnavailable` message says the variable "is not set or is empty"; an unreadable variable is logged at debug level (its name only) and treated as absent; the call, including the unavailable path, runs in a `StripeHttp.call` span; and each failure is a fresh error instance.
- **Core:** `Stub.Failure` (the type of the failure a stub's calls run) is exported, and `Stub.unavailable` constructs a fresh `PaymentsUnavailable` per call.

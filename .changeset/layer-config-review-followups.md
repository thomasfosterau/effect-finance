---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
---

Follow-ups to the "not configured ≡ down" `layerConfig` (#42).

- **Stripe:** `StripeHttp.layerConfig` / `StripePayments.layerConfig` now read the key from the calling fiber's `ConfigProvider` first and fall back to the `ConfigProvider` the layer was built under, so a provider attached to the layer (`layerConfig().pipe(Layer.provide(ConfigProvider.layer(…)))`) is honoured, as it is for `layerFromEnv`. Before, such a provider was ignored and every call failed with `PaymentsUnavailable`. The `PaymentsUnavailable` message now says the variable "is not set or is empty"; an unreadable variable is logged at debug level (its name only) before being treated as absent; the call, including the unavailable path, runs in a `StripeHttp.layerConfig.request` span; and each failure is a fresh error instance.
- **Core:** `Stub.Failure` (the type of the failure a stub's calls run) is exported, and `Stub.unavailable` constructs a fresh `PaymentsUnavailable` per call.

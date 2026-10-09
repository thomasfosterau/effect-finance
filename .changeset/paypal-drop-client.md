---
"@thomasfosterau/effect-payments-paypal": minor
---

**Breaking: the `./PayPal` subpath is removed** (#146). Since `PayPalPayments` runs on Distilled's PayPal operations, the hand-written REST client is no longer used inside the package, so it is no longer published.

- **Removed:** the `PayPalClient` service, `PayPal.make`, `PayPal.layer`, `PayPal.layerFromEnv` and the `PayPalRequest` type, and the `PayPal` namespace and `PayPalRequest` type re-export of the package root.
- **For calls the capabilities do not cover**, use `@distilled.cloud/paypal`'s operations directly, with an access token of your own in its `Credentials` (e.g. `fromApiKey({ apiKey, apiBaseUrl })`), and depend on `@distilled.cloud/paypal` at exactly this package's version of it. Its failures are Distilled's error classes rather than `PaymentsError`, and it retries 5xx and 429 responses by default. The OAuth login and token cache stay inside `PayPalPayments.layer` / `layerFromEnv`.
- **Moved:** `PayPalConfig` and `PayPalEnvironment` are now exported from `./PayPalPayments`. The package root still re-exports both as types, so `import type { PayPalConfig } from "@thomasfosterau/effect-payments-paypal"` keeps working.
- **Unchanged:** `PayPalPayments.layer` / `layerFromEnv`, the capability layers and `capabilities` keep their signatures and behaviour: the same login, token cache and timeouts, the same `PAYPAL_ENV` / `PAYPAL_BASE_URL` resolution, and the neutral `idempotencyKey` still sent as `PayPal-Request-Id`.

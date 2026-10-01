---
"@thomasfosterau/effect-payments": minor
"@thomasfosterau/effect-payments-stripe": minor
"@thomasfosterau/effect-payments-paypal": minor
"@thomasfosterau/effect-payments-airwallex": minor
---

**Breaking, deployers read this first: an empty or unset `PAYPAL_BASE_URL` / `AIRWALLEX_BASE_URL` selects the LIVE endpoint.** There is no sandbox/live switch (an explicit one is tracked in #90). Under rc.118 a blank variable is read as unset, where it used to give an unusable request URL, so a sandbox deployment that blanks the override instead of setting it now talks to production. Set the sandbox URL explicitly (`https://api-m.sandbox.paypal.com`, `https://api-demo.airwallex.com`). `make` now also refuses a `baseUrl` that is blank or not an absolute http(s) URL with `PaymentConfigError`, so a programmatic `make({ baseUrl: "" })` fails instead of passing `""` through.

**Breaking:** move to Effect 4.0.0-rc.118. The `effect` peer range is now `>=4.0.0-rc.118` (it was `>=4.0.0-rc.115`), so a consumer must be on rc.118 or later. rc.118 moved every `effect/unstable/<x>` module to `effect/<x>` (and `httpapi` to `http-api`), and the emitted declarations of these packages name the new paths, so they no longer load against rc.117 or earlier.

- Import paths: code that names the HTTP client types these packages require now imports them from `effect/http` (it was `effect/unstable/http`), for example `FetchHttpClient` and `HttpClient`.
- **Empty configuration variables are missing.** rc.118's `ConfigProvider` treats a literal empty string as a missing value (it was a present `""` through rc.117). For the credentials nothing observable changes: an empty `STRIPE_API_KEY`, `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` or `AIRWALLEX_CLIENT_ID` / `AIRWALLEX_API_KEY` is still refused (`PaymentConfigError` from `layerFromEnv`, `PaymentsUnavailable` from `StripePayments.layerConfig`). For the base URL it does: an empty `PAYPAL_BASE_URL` or `AIRWALLEX_BASE_URL` now selects the default (live) endpoint instead of producing an unusable request URL (see the warning above).
- The generated Stripe schemas are regenerated with `@effect/openapi-generator` 4.0.0-rc.118; the output is unchanged apart from its header.

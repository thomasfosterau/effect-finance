---
"@thomasfosterau/effect-payments": patch
"@thomasfosterau/effect-payments-stripe": patch
"@thomasfosterau/effect-payments-paypal": patch
"@thomasfosterau/effect-payments-airwallex": patch
---

Correct and tighten the doc comments shipped in the declarations.

- The PayPal and Airwallex entry-point examples now provide `FetchHttpClient.layer`, so they compile; `layer` / `layerFromEnv` say they require an `HttpClient`.
- The PayPal and Airwallex `loginTimeout` docs describe the shared login: callers that arrive while a login is in flight share its outcome and wait at most about one `loginTimeout`.
- The neutral accessors and the PayPal / Airwallex capability layers say which operations fail with `PaymentInvalidRequestError` on a provider without them; `amount`, `unitAmount` and `currency` on the create / update params state their unit and case.
- The Stripe entry point lists `CheckoutSessions`, `BillingPortalSessions` and `layerConfig`, and says which raw resource modules are generated and decoded.
- The vendor idempotency-key limits and windows are marked unverified with a link to #93.

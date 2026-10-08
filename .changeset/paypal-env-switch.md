---
"@thomasfosterau/effect-payments-paypal": minor
---

PayPal's `layerFromEnv` selects the live or sandbox endpoint from `PAYPAL_ENV` (#90).

- Set `PAYPAL_ENV=live` for production, which selects `https://api-m.paypal.com`, or `PAYPAL_ENV=sandbox` with sandbox credentials, which selects `https://api-m.sandbox.paypal.com`. `PAYPAL_ENV` is required: a missing, empty or unrecognised value fails the layer with `PaymentConfigError` naming `PAYPAL_ENV`, before any request is sent.
- `PAYPAL_BASE_URL` is an optional override: when set it wins over the endpoint `PAYPAL_ENV` selects. `PAYPAL_ENV` is required either way.
- `make` and `layer` take an optional `environment: "live" | "sandbox"` in `PayPalConfig`, which selects the endpoint the same way (`baseUrl` wins) and defaults to `live`. The `PayPalEnvironment` type is exported from the package index.

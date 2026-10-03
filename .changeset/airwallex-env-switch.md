---
"@thomasfosterau/effect-payments-airwallex": minor
---

Airwallex's `layerFromEnv` selects the live or sandbox endpoint from `AIRWALLEX_ENV` (#90).

- Set `AIRWALLEX_ENV=live` for production, which selects `https://api.airwallex.com`, or `AIRWALLEX_ENV=sandbox` with sandbox credentials, which selects `https://api.sandbox.airwallex.com` (the request paths carry `/api/v1/`). `AIRWALLEX_ENV` is required: a missing, empty or unrecognised value fails the layer with `PaymentConfigError` naming `AIRWALLEX_ENV`, before any request is sent.
- `AIRWALLEX_BASE_URL` is an optional override: when set it wins over the endpoint `AIRWALLEX_ENV` selects. `AIRWALLEX_ENV` is required either way.
- `make` and `layer` take an optional `environment: "live" | "sandbox"` in `AirwallexConfig`, which selects the endpoint the same way (`baseUrl` wins) and defaults to `live`. The `AirwallexEnvironment` type is exported from the package index.

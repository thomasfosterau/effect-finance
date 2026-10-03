---
"@thomasfosterau/effect-payments-airwallex": minor
---

**BREAKING:** `layerFromEnv` now requires `AIRWALLEX_ENV` (`live` | `sandbox`) and no longer selects the live endpoint by default (#90).

- `AIRWALLEX_ENV=live` selects `https://api.airwallex.com`, `AIRWALLEX_ENV=sandbox` selects `https://api.sandbox.airwallex.com` (the request paths carry `/api/v1/`). A missing, empty or unrecognised value fails the layer with `PaymentConfigError` naming `AIRWALLEX_ENV`, before any request is sent. Before this change an unset or empty `AIRWALLEX_BASE_URL` silently meant live.
- `AIRWALLEX_BASE_URL` is still an explicit override: when set it wins over the endpoint `AIRWALLEX_ENV` selects. `AIRWALLEX_ENV` is required either way.
- `AirwallexConfig` gains an optional `environment: "live" | "sandbox"` for `make` / `layer`, which selects the endpoint the same way (`baseUrl` wins). It defaults to `live` there, so programmatic callers are unaffected.

**Migrating:** set `AIRWALLEX_ENV=live` wherever `layerFromEnv` runs against production today, and `AIRWALLEX_ENV=sandbox` (with sandbox credentials) for test deployments.

# packages/payments-paypal — `@thomasfosterau/effect-payments-paypal`

PayPal REST: `Products`, `Prices` (billing plans), `PaymentIntents` (orders), `Subscriptions` and `Refunds`. Peer: `effect`. Dependency: the core. No vendor SDK. Requires `HttpClient` (`effect/unstable/http`).

## Terms

- **Client** — `PayPalClient` (`PayPal.ts`): an OAuth client-credentials handshake whose access token is cached in a `Ref` and refreshed a minute before expiry, plus one `request` function every capability goes through. `PayPal.layer` / `layerFromEnv` (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, optional `PAYPAL_BASE_URL`; live by default, `https://api-m.sandbox.paypal.com` for sandbox).
- **Capability layers** — `PayPalPayments.*Layer`, `capabilities`, `layer` / `layerFromEnv`.

## Local invariants

- **Every call goes through `HttpClient`**, never `globalThis.fetch`: the layers require `HttpClient.HttpClient`, so a consumer provides `FetchHttpClient.layer` and a test stubs `FetchHttpClient.Fetch`. Token and error bodies are decoded with `Schema`; `request<A>` returns the vendor JSON unchecked (a `SAFETY:` comment marks it).
- **Configuration from the environment is read through `Config`** in `layerFromEnv`, and a missing or empty variable still fails with `PaymentConfigError`.

- **No `Customers`.** PayPal has no first-class customer resource; the provider deliberately implements a subset of the core's capabilities, and a program needing `Customers` fails to type-check against this layer.
- **Money crosses the boundary as major-unit decimal strings** (`internal/money.ts`, zero-decimal currencies included); the core stays in minor units.
- **Vendor error bodies become neutral errors in `internal/error.ts`.** The client secret and the bearer token never appear in one.

## Boundary

Imports only `@thomasfosterau/effect-payments` from this workspace (`.fallowrc.json` zone `paypal`, allow `core`).

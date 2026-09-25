# packages/payments-airwallex — `@thomasfosterau/effect-payments-airwallex`

Airwallex payment acceptance: `Customers`, `PaymentIntents` and `Refunds`. Peer: `effect`. Dependency: the core. No vendor SDK. Requires `HttpClient` (`effect/unstable/http`).

## Terms

- **Client** — `AirwallexClient` (`Airwallex.ts`): the client-id + API-key login handshake whose token is cached in a `Ref` and refreshed a minute before expiry, plus one `request` function every capability goes through. `Airwallex.layer` / `layerFromEnv` (`AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, optional `AIRWALLEX_BASE_URL`; production by default).
- **Capability layers** — `AirwallexPayments.*Layer`, `capabilities`, `layer` / `layerFromEnv`.

## Local invariants

- **Every call goes through `HttpClient`**, never `globalThis.fetch`: the layers require `HttpClient.HttpClient`, so a consumer provides `FetchHttpClient.layer` and a test stubs `FetchHttpClient.Fetch`. Token and error bodies are decoded with `Schema`; `request<A>` returns the vendor JSON unchecked (a `SAFETY:` comment marks it).
- **Configuration from the environment is read through `Config`** in `layerFromEnv`, and a missing or empty variable still fails with `PaymentConfigError`.

- **Only the capabilities Airwallex supports.** A program using just customers, payment intents and refunds runs unchanged on Stripe or Airwallex; one needing products or prices does not type-check against this layer.
- **Money crosses the boundary as major-unit decimals** (`internal/money.ts`, zero-decimal currencies included); the core stays in minor units.
- **Vendor error bodies become neutral errors in `internal/error.ts`.** The API key and the bearer token never appear in one.

## Boundary

Imports only `@thomasfosterau/effect-payments` from this workspace (`.fallowrc.json` zone `airwallex`, allow `core`).

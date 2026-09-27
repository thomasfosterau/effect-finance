# packages/payments-airwallex — `@thomasfosterau/effect-payments-airwallex`

Airwallex payment acceptance: `Customers`, `PaymentIntents` and `Refunds`. Peer: `effect`. Dependency: the core. No vendor SDK. Requires `HttpClient` (`effect/unstable/http`).

## Terms

- **Client** — `AirwallexClient` (`Airwallex.ts`): the client-id + API-key login handshake whose token is cached in a `Ref` and refreshed a minute before expiry, plus one `request` function every capability goes through. `Airwallex.layer` / `layerFromEnv` (`AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, optional `AIRWALLEX_BASE_URL`; production by default).
- **Capability layers** — `AirwallexPayments.*Layer`, `capabilities`, `layer` / `layerFromEnv`.

## Local invariants

- **Every call goes through `HttpClient`**, never `globalThis.fetch`: the layers require `HttpClient.HttpClient`, so a consumer provides `FetchHttpClient.layer` and a test stubs `FetchHttpClient.Fetch`. Token and error bodies are decoded with `Schema`; `request<A>` returns the vendor JSON unchecked (a `SAFETY:` comment marks it).
- **One login at a time, and a 401 forgets the token.** `getToken` runs under a one-permit `Semaphore`, so concurrent callers share one handshake; a 401 on a resource request clears the cached token — only if it is still the token that request used — so the next call logs in again.
- **Every exchange is time-boxed.** The login is bounded by `loginTimeout` (default 30 s) and each resource request by `timeout` (default 80 s, the Stripe transport's per-attempt default), both covering the response body too. A timeout interrupts the fetch (aborting it) and fails with `PaymentNetworkError`; for the login that also releases the token lock, so the next queued caller logs in afresh instead of stalling behind a hung handshake (#54). `timeout` excludes token acquisition, and each queued caller runs its own login attempt, so the k-th waits up to about k × `loginTimeout` (#65). A timed-out non-GET has an unknown outcome; there are no idempotency keys yet (#66). A timeout is positive and finite, or `Infinity` for none; anything else is a `PaymentConfigError` from `make`.
- **`Content-Type: application/json` on every request**, body or not: the pre-HttpClient behaviour, kept consistent with the PayPal client.
- **Configuration from the environment is read through `Config`** in `layerFromEnv`, and a missing or empty variable still fails with `PaymentConfigError`.

- **Only the capabilities Airwallex supports.** A program using just customers, payment intents and refunds runs unchanged on Stripe or Airwallex; one needing products or prices does not type-check against this layer.
- **Money crosses the boundary as major-unit decimals** (`internal/money.ts`, zero-decimal currencies included); the core stays in minor units.
- **Vendor error bodies become neutral errors in `internal/error.ts`.** The API key and the bearer token never appear in one.

## Boundary

Imports only `@thomasfosterau/effect-payments` from this workspace (`.fallowrc.json` zone `airwallex`, allow `core`).

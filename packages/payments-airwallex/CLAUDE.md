# packages/payments-airwallex — `@thomasfosterau/effect-payments-airwallex`

Airwallex payment acceptance: `Customers`, `PaymentIntents` and `Refunds`. Peer: `effect`. Dependency: the core. No vendor SDK. Requires `HttpClient` (`effect/unstable/http`).

## Terms

- **Client** — `AirwallexClient` (`Airwallex.ts`): the client-id + API-key login handshake whose token is cached in a `Ref` and refreshed a minute before expiry, plus one `request` function every capability goes through. `Airwallex.layer` / `layerFromEnv` (`AIRWALLEX_CLIENT_ID`, `AIRWALLEX_API_KEY`, optional `AIRWALLEX_BASE_URL`; production by default).
- **Capability layers** — `AirwallexPayments.*Layer`, `capabilities`, `layer` / `layerFromEnv`.

## Local invariants

- **Every call goes through `HttpClient`**, never `globalThis.fetch`: the layers require `HttpClient.HttpClient`, so a consumer provides `FetchHttpClient.layer` and a test stubs `FetchHttpClient.Fetch`. Every body is decoded with `Schema`: token and error bodies in the client, resource bodies in the capability layers — `request` returns `unknown`, and each layer pipes it through a `decode*` from `internal/mapping.ts` (a wire `Schema` narrowed to the fields the mapping reads), so a 2xx that does not decode fails with `PaymentProviderError`. Statuses decode as strings and keep their lenient `to*Status` fallbacks.
- **One login at a time, and a 401 forgets the token.** `getToken` goes through `internal/sharedLogin.ts`: the first caller without a usable token runs the login and publishes its outcome through a `Deferred`, and callers arriving meanwhile await that same outcome (token or error, #65). The slot is cleared before the outcome is published, so the next call after a failure logs in afresh, and if the caller running the login is interrupted the waiters retry rather than being stranded; a 401 on a resource request clears the cached token — only if it is still the token that request used — so the next call logs in again.
- **Every exchange is time-boxed.** The login is bounded by `loginTimeout` (default 30 s) and each resource request by `timeout` (default 80 s, the Stripe transport's per-attempt default), both covering the response body too. A timeout interrupts the fetch (aborting it) and fails with `PaymentNetworkError`; for the login, every caller waiting on it fails with that same error after one `loginTimeout` instead of stalling behind a hung handshake (#54, #65). `timeout` excludes token acquisition. A timed-out non-GET has an unknown outcome; there are no idempotency keys yet (#66). A timeout is positive and finite, or `Infinity` for none; anything else is a `PaymentConfigError` from `make`.
- **`Content-Type: application/json` on every request**, body or not: the pre-HttpClient behaviour, kept consistent with the PayPal client.
- **Configuration from the environment is read through `Config`** in `layerFromEnv`, and a missing or empty variable still fails with `PaymentConfigError`.

- **Only the capabilities Airwallex supports.** A program using just customers, payment intents and refunds runs unchanged on Stripe or Airwallex; one needing products or prices does not type-check against this layer.
- **Money crosses the boundary as major-unit decimals** (`internal/money.ts`, zero-decimal currencies included); the core stays in minor units. Both directions are exact (#68): a response amount is parsed from `String(n)` with `BigInt` scaling and checked against its currency inside the wire `Schema` (excess decimals or an unsafe minor-unit amount fail the decode); a request amount goes through `toMajorNumber`, which refuses a negative, non-safe-integer or not-exactly-representable amount with `PaymentInvalidRequestError`. The exponent table is still Stripe's, unverified against Airwallex.
- **Vendor error bodies become neutral errors in `internal/error.ts`.** The API key and the bearer token never appear in one: the API key is `Redacted<string>` in the config (read with `Config.Redacted` in `layerFromEnv`) and unwrapped only where the login request is built, and a transport failure keeps only the underlying cause — never the `HttpClientError`, whose request carries the credential headers.

## Boundary

Imports only `@thomasfosterau/effect-payments` from this workspace (`.fallowrc.json` zone `airwallex`, allow `core`).

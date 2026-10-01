# packages/payments-paypal — `@thomasfosterau/effect-payments-paypal`

PayPal REST: `Products`, `Prices` (billing plans), `PaymentIntents` (orders), `Subscriptions` and `Refunds`. Peer: `effect`. Dependency: the core. No vendor SDK. Requires `HttpClient` (`effect/unstable/http`).

## Terms

- **Client** — `PayPalClient` (`PayPal.ts`): an OAuth client-credentials handshake whose access token is cached in a `Ref` and refreshed a minute before expiry, plus one `request` function every capability goes through. `PayPal.layer` / `layerFromEnv` (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, optional `PAYPAL_BASE_URL`; live by default, `https://api-m.sandbox.paypal.com` for sandbox).
- **Capability layers** — `PayPalPayments.*Layer`, `capabilities`, `layer` / `layerFromEnv`.

## Local invariants

- **Every call goes through `HttpClient`**, never `globalThis.fetch`: the layers require `HttpClient.HttpClient`, so a consumer provides `FetchHttpClient.layer` and a test stubs `FetchHttpClient.Fetch`. Every body is decoded with `Schema`: token and error bodies in the client, resource bodies in the capability layers — `request` returns `unknown`, and each layer pipes it through a `decode*` from `internal/mapping.ts` (a wire `Schema` narrowed to the fields the mapping reads), so a 2xx that does not decode fails with `PaymentProviderError`. Statuses decode as strings; the `to*Status` functions map a recognised one onto the neutral literal and an unrecognised one onto `Enumeration.Other` carrying the raw string (never a silent neutral fallback, never a decode failure).
- **One login at a time, and a 401 forgets the token.** `getToken` goes through `internal/sharedLogin.ts`: the first caller without a usable token runs the login and publishes its outcome through a `Deferred`, and callers arriving meanwhile await that same outcome (token or error, #65). The slot is cleared before the outcome is published, so the next call after a failure logs in afresh, and if the caller running the login is interrupted the waiters retry rather than being stranded; a 401 on a resource request clears the cached token — only if it is still the token that request used — so the next call logs in again.
- **Every exchange is time-boxed.** The login is bounded by `loginTimeout` (default 30 s) and each resource request by `timeout` (default 80 s, the Stripe transport's per-attempt default), both covering the response body too. A timeout interrupts the fetch (aborting it) and fails with `PaymentNetworkError`; for the login, every caller waiting on it fails with that same error after one `loginTimeout` instead of stalling behind a hung handshake (#54, #65). `timeout` excludes token acquisition. A timed-out non-GET has an unknown outcome; there are no idempotency keys yet (#66). A timeout is positive and finite, or `Infinity` for none; anything else is a `PaymentConfigError` from `make`.
- **`Content-Type: application/json` on every request**, body or not (PayPal answers a bodyless POST without it with 415).
- **Configuration from the environment is read through `Config`** in `layerFromEnv`, and a missing or empty variable still fails with `PaymentConfigError`.

- **No `Customers`.** PayPal has no first-class customer resource; the provider deliberately implements a subset of the core's capabilities, and a program needing `Customers` fails to type-check against this layer.
- **Money crosses the boundary as major-unit decimal strings** (`internal/money.ts`); the core stays in minor units. Conversion is integer arithmetic, never a float, and the per-currency exponent follows PayPal's currency-codes reference (HUF, JPY, TWD zero-decimal), not Stripe's list. The response decoders reject an amount with excess decimals rather than round it. Request amounts must be non-negative safe integers and fail with `PaymentInvalidRequestError` before any request.
- **Vendor error bodies become neutral errors in `internal/error.ts`.** The client secret and the bearer token never appear in one: the client secret is `Redacted<string>` in the config (read with `Config.Redacted` in `layerFromEnv`) and unwrapped only where the login request is built, and a transport failure keeps only the underlying cause — never the `HttpClientError`, whose request carries the credential headers.

## Boundary

Imports only `@thomasfosterau/effect-payments` from this workspace (`.fallowrc.json` zone `paypal`, allow `core`).

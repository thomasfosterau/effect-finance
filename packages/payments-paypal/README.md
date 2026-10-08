# @thomasfosterau/effect-payments-paypal

A PayPal implementation of the vendor-neutral effect-payments core.

It implements the capabilities PayPal supports from [`@thomasfosterau/effect-payments`](https://www.npmjs.com/package/@thomasfosterau/effect-payments) over PayPal's REST API, through `effect/http` with no vendor SDK.

The same neutral program runs on PayPal, Stripe or Airwallex — only the layer you provide changes.

## Install

```bash
pnpm add @thomasfosterau/effect-payments @thomasfosterau/effect-payments-paypal effect
```

`effect` is a peer dependency.

## Usage

```typescript
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as PayPalPayments from "@thomasfosterau/effect-payments-paypal/PayPalPayments";

const program = Product.create({ name: "Premium" });

// The PayPal layer speaks `effect/http`: it requires an `HttpClient`,
// which `FetchHttpClient.layer` supplies on Node, Bun, Deno and Workers alike.
const layer = PayPalPayments.layer({
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: Redacted.make(process.env.PAYPAL_CLIENT_SECRET!),
  environment: "sandbox", // or "live" (the default)
}).pipe(Layer.provide(FetchHttpClient.layer));
// from PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET / PAYPAL_ENV (required: live | sandbox):
// const layer = PayPalPayments.layerFromEnv().pipe(Layer.provide(FetchHttpClient.layer));

const product = await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## Supported capabilities

PayPal's billing suite and checkout APIs map onto a subset of the core capabilities — a different subset from Airwallex, which makes it a good test of the abstraction:

| Capability | Maps to | Notes |
| --- | --- | --- |
| `Products` | Catalog Products | no `del` |
| `Prices` | Billing Plans | recurring only; `update` toggles active via activate/deactivate |
| `PaymentIntents` | Orders | `confirm` = capture; no `update` / `cancel` / `list` |
| `Subscriptions` | Subscriptions | no `update` / `list` |
| `Refunds` | Capture refunds | refund a `charge` (capture id) or a captured `paymentIntent`; no `update` / `list` |
| `Customers` | — | **not provided** (PayPal has no first-class customer resource) |
| `CheckoutSessions` / `BillingPortalSessions` | — | not in `capabilities`; `checkoutSessionsLayer` / `billingPortalSessionsLayer` stubs fail every call with `PaymentInvalidRequestError` |

Because each capability is an independent Effect service, a program that only uses the supported capabilities is fully satisfied; one that needs `Customers` will not type-check against the PayPal layer. Individual operations without a PayPal equivalent fail with a neutral `PaymentInvalidRequestError`.

## Notes

- **Money** — the core uses minor units (e.g. cents); PayPal uses major-unit decimal _strings_ (e.g. `"10.00"`). This provider converts in both directions with integer arithmetic, using PayPal's own currency table (`HUF`, `JPY` and `TWD` take no decimals; `KWD`, `TND` and the other ISO 4217 three-decimal currencies take three). A response amount with more decimals than its currency allows, or beyond the safe-integer range in minor units, fails with `PaymentProviderError` instead of being rounded; a request amount that is negative or not a safe integer fails with `PaymentInvalidRequestError` before anything is sent.
- **`PayPal`** — the client service performs the OAuth client-credentials handshake and caches the access token. Every request goes through `effect/http`'s `HttpClient`, which the layer requires — provide `FetchHttpClient.layer` in production, or a stub `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests; set `environment: "sandbox"` (or `PAYPAL_ENV=sandbox`) for testing against PayPal sandbox.
- **Timeouts** — the token login fails with `PaymentNetworkError` after `loginTimeout` ms (default 30 000) and any other request after `timeout` ms (default 80 000, as in the Stripe transport). Logins are serialised, so without a bound one hung login would stall every request on the client; after a timeout the next caller logs in afresh. `layerFromEnv` uses the defaults; pass `loginTimeout` / `timeout` to `layer` to change them (`Infinity` disables one; `0`, a negative number or `NaN` fails with `PaymentConfigError`). Two things to know:
  - `timeout` covers the resource request only, not getting a token. Callers that arrive while a login is in flight share its outcome: they get its token, or they all fail with its error after about one `loginTimeout`. The next call after a failure starts a fresh login.
  - A **non-GET that times out has an unknown outcome**: the vendor may have applied the write. Don't blindly retry a create, capture or refund without a key: the client's `requestId` (below) is what lets the vendor recognise the repeat.
- **Neutral `idempotencyKey`** — `PaymentIntent.create` / `confirm` (capture), `Product.create`, `Price.create`, `Subscription.create` and `Refund.create` accept the core's `idempotencyKey` and send it as `PayPal-Request-Id` (see "Retrying a write safely" in the core package's README). With no key none is sent. `PaymentIntent.cancel`, `Subscription.cancel` and the plan activate / deactivate calls take none.
- **`requestId`** — `PayPalClient.request({ method: "POST", …, requestId })` sends it as the `PayPal-Request-Id` header. Create one id per logical write, before the first attempt, and send the same one on every retry; PayPal then returns the original outcome. It is `POST` only, and not every PayPal endpoint honours the header (activate / deactivate / cancel-style calls are not documented as idempotent), so a `POST` to one of those is simply not deduplicated. An empty id, or one on a `GET`, `PATCH` or `DELETE`, fails with `PaymentInvalidRequestError` before anything is sent. The vendor's length limit (about 108 characters) and retention (which differs per API) are unverified ([#93](https://github.com/thomasfosterau/effect-payments/issues/93)); stay within 1–64 characters of `[A-Za-z0-9_-]` and retry within hours, not days.
- **Environment** — `PAYPAL_ENV` is **required** by `layerFromEnv` and must be `live` or `sandbox`; a missing, empty or misspelt value fails with `PaymentConfigError`, so a deployment never reaches the live endpoint by default. `live` selects `https://api-m.paypal.com`, `sandbox` selects `https://api-m.sandbox.paypal.com`. `PAYPAL_BASE_URL`, when set, overrides the endpoint `PAYPAL_ENV` selects (a proxy or a mock server); `PAYPAL_ENV` is still required. With `layer` / `make`, pass `environment: "live" | "sandbox"` (it defaults to `live` there) and optionally `baseUrl`, which wins.
- **Empty variables** — `layerFromEnv` reads `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` and the optional `PAYPAL_BASE_URL` through `Config`. Effect treats a literal empty string as a missing value, so an empty id, secret or `PAYPAL_ENV` fails with `PaymentConfigError`, and an empty `PAYPAL_BASE_URL` means the `PAYPAL_ENV` endpoint, not a blank URL. `make` refuses a `baseUrl` that is blank or not an absolute http(s) URL with `PaymentConfigError`.
- **Secrets** — `clientSecret` is a `Redacted<string>` (`Redacted.make(...)`; `layerFromEnv` reads it with `Config.Redacted`), so the client secret never reaches a log line or an error.
- **Decoded responses** — every PayPal response the capabilities read is decoded with a `Schema` at the boundary; a response that does not match fails with `PaymentProviderError` instead of producing a half-built entity. `PayPalClient.request` returns `unknown`.

## API

| Module | Purpose |
| --- | --- |
| `PayPalPayments` | `layer` / `layerFromEnv` (client + every supported capability; need an `HttpClient`), `capabilities` (over an existing `PayPalClient`), the individual capability layers, and the `checkoutSessionsLayer` / `billingPortalSessionsLayer` stubs. |
| `PayPal` | The `PayPalClient` service (OAuth handshake, cached token, `request`), `layer` / `layerFromEnv` / `make`, and the `PayPalConfig` / `PayPalEnvironment` / `PayPalRequest` types. |

The root entry re-exports both as namespaces, plus the core as `Payments`.

## License

MIT © Thomas Foster

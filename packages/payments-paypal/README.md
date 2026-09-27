# @thomasfosterau/effect-payments-paypal

A **PayPal implementation** of the vendor-neutral [`@thomasfosterau/effect-payments`](../payments) core.

The same neutral program runs on PayPal, Stripe or Airwallex — only the layer you provide changes.

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-paypal effect
```

## Usage

```typescript
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as PayPalPayments from "@thomasfosterau/effect-payments-paypal/PayPalPayments";

const program = Product.create({ name: "Premium" });

// The PayPal layer speaks `effect/unstable/http`: it requires an `HttpClient`,
// which `FetchHttpClient.layer` supplies on Node, Bun, Deno and Workers alike.
const layer = PayPalPayments.layer({
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: Redacted.make(process.env.PAYPAL_CLIENT_SECRET!),
  // baseUrl: "https://api-m.sandbox.paypal.com", // for sandbox
}).pipe(Layer.provide(FetchHttpClient.layer));
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

- **Money** — the core uses minor units (e.g. cents); PayPal uses major-unit decimal _strings_ (e.g. `"10.00"`). This provider converts in both directions with integer arithmetic, using PayPal's own currency table (`HUF`, `JPY` and `TWD` take no decimals; `KWD`, `TND` and the other ISO 4217 three-decimal currencies take three). A response amount with more decimals than its currency allows, or beyond the safe-integer range in minor units, fails with `PaymentProviderError` instead of being rounded; a request amount that is not a safe integer fails with `PaymentInvalidRequestError` before anything is sent.
- **`PayPal`** — the client service performs the OAuth client-credentials handshake and caches the access token. Every request goes through `effect/unstable/http`'s `HttpClient`, which the layer requires — provide `FetchHttpClient.layer` in production, or a stub `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests; set `baseUrl` to the sandbox host for testing against PayPal sandbox.
- **Timeouts** — the token login fails with `PaymentNetworkError` after `loginTimeout` ms (default 30 000) and any other request after `timeout` ms (default 80 000, as in the Stripe transport). Logins are serialised, so without a bound one hung login would stall every request on the client; after a timeout the next caller logs in afresh. `layerFromEnv` uses the defaults; pass `loginTimeout` / `timeout` to `layer` to change them (`Infinity` disables one; `0`, a negative number or `NaN` fails with `PaymentConfigError`). Two things to know:
  - `timeout` covers the resource request only, not getting a token. Callers that arrive while a login is in flight share its outcome: they get its token, or they all fail with its error after about one `loginTimeout`. The next call after a failure starts a fresh login.
  - A **non-GET that times out has an unknown outcome**: the vendor may have applied the write. Don't blindly retry a create, capture or refund. Idempotency keys that make that safe are #66.
- **Secrets** — `clientSecret` is a `Redacted<string>` (`Redacted.make(...)`; `layerFromEnv` reads it with `Config.Redacted`), so the client secret never reaches a log line or an error.
- **Decoded responses** — every PayPal response the capabilities read is decoded with a `Schema` at the boundary; a response that does not match fails with `PaymentProviderError` instead of producing a half-built entity. `PayPalClient.request` returns `unknown`.

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

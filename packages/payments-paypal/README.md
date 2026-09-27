# @thomasfosterau/effect-payments-paypal

A **PayPal implementation** of the vendor-neutral [`@thomasfosterau/effect-payments`](../payments) core.

The same neutral program runs on PayPal, Stripe or Airwallex — only the layer you provide changes.

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-paypal effect
```

## Usage

```typescript
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as Product from "@thomasfosterau/effect-payments/Product";
import * as PayPalPayments from "@thomasfosterau/effect-payments-paypal/PayPalPayments";

const program = Product.create({ name: "Premium" });

// The PayPal layer speaks `effect/unstable/http`: it requires an `HttpClient`,
// which `FetchHttpClient.layer` supplies on Node, Bun, Deno and Workers alike.
const layer = PayPalPayments.layer({
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
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

- **Money** — the core uses minor units (e.g. cents); PayPal uses major-unit decimal _strings_ (e.g. `"10.00"`). This provider converts in both directions, currency-aware.
- **`PayPal`** — the client service performs the OAuth client-credentials handshake and caches the access token. Every request goes through `effect/unstable/http`'s `HttpClient`, which the layer requires — provide `FetchHttpClient.layer` in production, or a stub `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests; set `baseUrl` to the sandbox host for testing against PayPal sandbox.
- **Timeouts** — the token login fails with `PaymentNetworkError` after `loginTimeout` ms (default 30 000) and any other request after `timeout` ms (default 80 000, as in the Stripe transport). Logins are serialised, so without a bound one hung login would stall every request on the client; after a timeout the next caller logs in afresh. `layerFromEnv` uses the defaults; pass `loginTimeout` / `timeout` to `layer` to change them (`Infinity` disables one; `0`, a negative number or `NaN` fails with `PaymentConfigError`). Two things to know:
  - `timeout` covers the resource request only, not getting a token. Callers queued behind a failing login each make their own login attempt, so the k-th queued caller can wait about k × `loginTimeout` in the worst case (sharing one login's failure with the whole queue is #65).
  - A **non-GET that times out has an unknown outcome**: the vendor may have applied the write. Don't blindly retry a create, capture or refund. Idempotency keys that make that safe are #66.

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

# @thomasfosterau/effect-payments-airwallex

An **Airwallex implementation** of the vendor-neutral [`@thomasfosterau/effect-payments`](../payments) core.

The same neutral program runs on Airwallex or Stripe — only the layer you provide changes.

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-airwallex effect
```

## Usage

```typescript
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as AirwallexPayments from "@thomasfosterau/effect-payments-airwallex/AirwallexPayments";

const program = Customer.create({ email: "jane@example.com" });

// The Airwallex layer speaks `effect/unstable/http`: it requires an
// `HttpClient`, which `FetchHttpClient.layer` supplies on any fetch runtime.
const layer = AirwallexPayments.layer({
  clientId: process.env.AIRWALLEX_CLIENT_ID!,
  apiKey: Redacted.make(process.env.AIRWALLEX_API_KEY!),
}).pipe(Layer.provide(FetchHttpClient.layer));
// from AIRWALLEX_CLIENT_ID / AIRWALLEX_API_KEY:
// const layer = AirwallexPayments.layerFromEnv().pipe(Layer.provide(FetchHttpClient.layer));

const customer = await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## Supported capabilities

Airwallex's payment-acceptance API maps onto a subset of the core capabilities:

| Capability | Status |
| --- | --- |
| `Customers` | ✅ (no `del` — Airwallex has no delete-customer endpoint) |
| `PaymentIntents` | ✅ (no `update` — confirm/cancel instead) |
| `Refunds` | ✅ (no `update`; refunds reference a payment intent, not a charge) |
| `Products` / `Prices` / `Subscriptions` | ❌ not provided |
| `CheckoutSessions` / `BillingPortalSessions` | ❌ not in `capabilities`; `checkoutSessionsLayer` / `billingPortalSessionsLayer` stubs fail every call with `PaymentInvalidRequestError` |

Because each capability is an independent Effect service, this provider simply doesn't supply layers for the capabilities Airwallex lacks. A program that only uses the supported capabilities is fully satisfied; one that needs, say, `Subscriptions` will not type-check against the Airwallex layer alone. The few individual operations without an Airwallex equivalent fail with a neutral `PaymentInvalidRequestError` rather than pretending to succeed.

## Notes

- **Money** — the core uses minor units (e.g. cents); Airwallex uses major-unit decimals. This provider converts in both directions based on each currency's number of decimal places.
- **`Airwallex`** — the client service performs the token handshake and caches the bearer token. Every request goes through `effect/unstable/http`'s `HttpClient`, which the layer requires — provide `FetchHttpClient.layer` in production, or a stub `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests.
- **Timeouts** — the token login fails with `PaymentNetworkError` after `loginTimeout` ms (default 30 000) and any other request after `timeout` ms (default 80 000, as in the Stripe transport). Logins are serialised, so without a bound one hung login would stall every request on the client; after a timeout the next caller logs in afresh. `layerFromEnv` uses the defaults; pass `loginTimeout` / `timeout` to `layer` to change them (`Infinity` disables one; `0`, a negative number or `NaN` fails with `PaymentConfigError`). Two things to know:
  - `timeout` covers the resource request only, not getting a token. Callers that arrive while a login is in flight share its outcome: they get its token, or they all fail with its error after about one `loginTimeout`. The next call after a failure starts a fresh login.
  - A **non-GET that times out has an unknown outcome**: the vendor may have applied the write. Don't blindly retry a create, capture or refund. Idempotency keys that make that safe are #66.
- **Secrets** — `apiKey` is a `Redacted<string>` (`Redacted.make(...)`; `layerFromEnv` reads it with `Config.Redacted`), so the API key never reaches a log line or an error.
- **Decoded responses** — every Airwallex response the capabilities read is decoded with a `Schema` at the boundary; a response that does not match fails with `PaymentProviderError` instead of producing a half-built entity. `AirwallexClient.request` returns `unknown`.

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

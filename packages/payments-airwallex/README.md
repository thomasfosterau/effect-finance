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

- **Money** — the core uses minor units (e.g. cents); Airwallex uses major-unit decimals sent as JSON numbers (e.g. `20.5`). This provider scales in both directions with integer arithmetic, based on each currency's number of decimal places. `JSON.parse` has already rounded a response amount to a double, so the amount is read from that double's shortest decimal form (exponent notation included). It fails with `PaymentProviderError` instead of being rounded when it has more decimals than its currency allows, when it is beyond the safe-integer range in minor units, or when the double is ambiguous: a different amount, or one with excess decimals, parses to the same double. The guarantee is: **an accepted amount is the wire value rounded to the nearest minor unit, and exact when the wire text has at most `exponent` decimals.** Excess decimals are not always caught: `10721136062241.369` shares a double with `10721136062241.37` and is accepted as `.37`. Amounts are rejected as ambiguous from about 2^45 major units (about 35 trillion) for two-decimal currencies (e.g. `35184372088832.01` USD), 2^42 for three-decimal ones, and 2^52 for zero-decimal ones (even integers only). A request amount is held to the same rule: one that is negative or not a safe integer, or whose JSON number the parser would refuse to read back (the thresholds above, or more significant digits than a double keeps), fails with `PaymentInvalidRequestError` before anything is sent, so Airwallex is never asked to create something whose response cannot be decoded. The currency table (zero-decimal `JPY`, `KRW` and others; three-decimal `KWD`, `BHD` and others) has not yet been checked against Airwallex's own currency reference (#74).
- **`Airwallex`** — the client service performs the token handshake and caches the bearer token. Every request goes through `effect/unstable/http`'s `HttpClient`, which the layer requires — provide `FetchHttpClient.layer` in production, or a stub `HttpClient` (or a stub `FetchHttpClient.Fetch`) in tests.
- **Timeouts** — the token login fails with `PaymentNetworkError` after `loginTimeout` ms (default 30 000) and any other request after `timeout` ms (default 80 000, as in the Stripe transport). Logins are serialised, so without a bound one hung login would stall every request on the client; after a timeout the next caller logs in afresh. `layerFromEnv` uses the defaults; pass `loginTimeout` / `timeout` to `layer` to change them (`Infinity` disables one; `0`, a negative number or `NaN` fails with `PaymentConfigError`). Two things to know:
  - `timeout` covers the resource request only, not getting a token. Callers that arrive while a login is in flight share its outcome: they get its token, or they all fail with its error after about one `loginTimeout`. The next call after a failure starts a fresh login.
  - A **non-GET that times out has an unknown outcome**: the vendor may have applied the write. Don't blindly retry a create, capture or refund without a key: the client's `requestId` (below) is what lets the vendor recognise the repeat.
- **`requestId`** — `AirwallexClient.request({ method: "POST", …, requestId })` writes `requestId` into the JSON body as `request_id`, replacing the fresh id the capability layers put there. Create one id per logical write, before the first attempt, and send the same one on every retry; Airwallex then returns the original result for the same parameters (and, unverified, rejects the id with different ones). An empty id, a non-`POST` request or a non-object body fails with `PaymentInvalidRequestError` before anything is sent. The vendor's length limit (about 64 characters) and how long it remembers an id are **unverified** here (the vendor documentation was unreachable); stay within 1–64 characters of `[A-Za-z0-9_-]` and retry within hours, not days.
- **Secrets** — `apiKey` is a `Redacted<string>` (`Redacted.make(...)`; `layerFromEnv` reads it with `Config.Redacted`), so the API key never reaches a log line or an error.
- **Decoded responses** — every Airwallex response the capabilities read is decoded with a `Schema` at the boundary; a response that does not match fails with `PaymentProviderError` instead of producing a half-built entity. `AirwallexClient.request` returns `unknown`.

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

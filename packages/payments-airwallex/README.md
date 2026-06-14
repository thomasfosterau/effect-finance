# @thomasfosterau/effect-payments-airwallex

An **Airwallex implementation** of the vendor-neutral
[`@thomasfosterau/effect-payments`](../payments) core.

The same neutral program runs on Airwallex or Stripe — only the layer you
provide changes.

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-airwallex effect
```

## Usage

```typescript
import { Effect } from "effect";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as AirwallexPayments from "@thomasfosterau/effect-payments-airwallex/AirwallexPayments";

const program = Customer.create({ email: "jane@example.com" });

const layer = AirwallexPayments.layer({
  clientId: process.env.AIRWALLEX_CLIENT_ID!,
  apiKey: process.env.AIRWALLEX_API_KEY!,
});
// const layer = AirwallexPayments.layerFromEnv(); // from AIRWALLEX_CLIENT_ID / AIRWALLEX_API_KEY

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

Because each capability is an independent Effect service, this provider simply
doesn't supply layers for the capabilities Airwallex lacks. A program that only
uses the supported capabilities is fully satisfied; one that needs, say,
`Subscriptions` will not type-check against the Airwallex layer alone. The few
individual operations without an Airwallex equivalent fail with a neutral
`PaymentInvalidRequestError` rather than pretending to succeed.

## Notes

- **Money** — the core uses minor units (e.g. cents); Airwallex uses major-unit
  decimals. This provider converts in both directions based on each currency's
  number of decimal places.
- **`Airwallex`** — the client service performs the token handshake and caches
  the bearer token. Inject a custom `fetch` via `AirwallexConfig` for testing.

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

# @thomasfosterau/effect-payments-stripe

The **Stripe implementation** of the vendor-neutral
[`@thomasfosterau/effect-payments`](../payments) core.

It provides `Layer`s that satisfy the neutral capabilities on top of the Stripe
SDK, and continues to expose the full set of Stripe-specific resource modules as
a provider escape hatch.

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-stripe effect stripe
```

## Usage

Write your program against the neutral core, then provide a Stripe layer:

```typescript
import { Effect } from "effect";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const program = Customer.create({ email: "jane@example.com" });

const layer = StripePayments.layer({ apiKey: "sk_test_..." });
// const layer = StripePayments.layerFromEnv(); // from STRIPE_API_KEY

const customer = await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## What's included

- **`StripePayments`** — `layer` / `layerFromEnv` (client + every capability),
  `capabilities` (every capability, requires a `Stripe` client), and individual
  capability layers (`customersLayer`, `productsLayer`, …).
- **`Stripe`** — the Stripe client service and its `layer` / `layerFromEnv` /
  `make` constructors.
- **Raw resource modules** — full-fidelity Stripe coverage returning Stripe SDK
  types, for resources with no vendor-neutral equivalent (`Treasury`, `Issuing.*`,
  `Terminal.*`, `Identity.*`, `Invoice`, `Charge`, `Payout`, `CheckoutSession`,
  and many more).
- **`Webhook`** — signature verification and event construction.

See the [repository README](../../README.md) and
[`examples`](examples) for the full guide.

## License

MIT © Thomas Foster

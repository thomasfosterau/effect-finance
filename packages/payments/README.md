# @thomasfosterau/effect-payments

A **vendor-neutral payments core for Effect**. Define your payment workflows
against provider-agnostic capabilities and choose a concrete provider (such as
[`@thomasfosterau/effect-payments-stripe`](../payments-stripe)) at the edge of
your application.

This is the payments analogue of [`@effect/ai`](https://effect.website/docs/ai/introduction/):
this package is the abstraction; provider packages are the implementations.

## Installation

```bash
npm install @thomasfosterau/effect-payments effect
```

## Usage

```typescript
import { Effect } from "effect";
import * as Customer from "@thomasfosterau/effect-payments/Customer";

// Effect<Customer, PaymentsError, Customers>
const program = Customer.create({ email: "jane@example.com" });
```

The program above depends only on the `Customers` capability — it does not
import any provider. Provide a provider layer (e.g. `StripePayments.layer`) to
run it.

## What's included

- **Capabilities** (`Context.Tag` services): `Customers`, `Products`, `Prices`,
  `PaymentIntents`, `Subscriptions`, `Refunds`. Each module also exports
  accessor functions (`create`, `retrieve`, `update`, `del`, `list`, …).
- **Domain types** (`effect/Schema` classes): `Customer`, `Product`, `Price`,
  `PaymentIntent`, `Subscription`, `Refund`, `Money`, plus `Page` / `Deleted`.
- **Errors**: the neutral `PaymentsError` union and friends
  (`PaymentProviderError`, `PaymentAuthenticationError`,
  `PaymentRateLimitError`, `PaymentInvalidRequestError`, `PaymentNetworkError`,
  `PaymentConfigError`, `SignatureVerificationError`).

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

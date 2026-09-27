# @thomasfosterau/effect-payments

A **vendor-neutral payments core for Effect**. Define your payment workflows against provider-agnostic capabilities and choose a concrete provider (such as [`@thomasfosterau/effect-payments-stripe`](../payments-stripe)) at the edge of your application.

This is the payments analogue of [`@effect/ai`](https://effect.website/docs/ai/introduction/): this package is the abstraction; provider packages are the implementations.

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

The program above depends only on the `Customers` capability — it does not import any provider. Provide a provider layer (e.g. `StripePayments.layer`) to run it.

## What's included

- **Capabilities** (`Context.Service` services): `Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`, `CheckoutSessions` (hosted checkout → URL), `BillingPortalSessions` (hosted billing portal → URL). Each module also exports accessor functions (`create`, `retrieve`, `update`, `del`, `list`, …).
- **Domain types** (`effect/Schema` classes): `Customer`, `Product`, `Price`, `PaymentIntent`, `Subscription`, `Refund`, `CheckoutSession`, `BillingPortalSession`, `Money`, plus `Page` / `Deleted`.
- **Errors**: the neutral `PaymentsError` union and friends (`PaymentProviderError`, `PaymentAuthenticationError`, `PaymentRateLimitError`, `PaymentInvalidRequestError`, `PaymentNetworkError`, `PaymentsUnavailable`, `PaymentConfigError`, `SignatureVerificationError`). `PaymentsUnavailable` is the "not configured ≡ down" failure: no provider is available to serve the call (typically, its credential is absent), raised at call time.
- **Stubs** (`Stub`): capability layers whose every call fails with one given error — `Stub.layer(failure)` for every capability, one constructor per capability (`Stub.customers`, …, `Stub.billingPortalSessions`), and `Stub.unavailable(provider?)`, every capability failing with `PaymentsUnavailable`, for an environment with no provider configured.

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

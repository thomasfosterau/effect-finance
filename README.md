# effect-payments

A **vendor-neutral payments core for Effect**, with a **Stripe implementation** —
the payments analogue of Effect's AI packages, where [`@effect/ai`](https://effect.website/docs/ai/introduction/)
defines a provider-agnostic abstraction and `@effect/ai-openai` supplies a
concrete implementation.

[![CI](https://github.com/thomasfosterau/effect-stripe/actions/workflows/ci.yml/badge.svg)](https://github.com/thomasfosterau/effect-stripe/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

| Package | Description |
| --- | --- |
| [`@thomasfosterau/effect-payments`](packages/payments) | The vendor-neutral core: abstract capabilities, neutral domain types, and a neutral error channel. Depend on this in your application code. |
| [`@thomasfosterau/effect-payments-stripe`](packages/payments-stripe) | The Stripe implementation. Provides `Layer`s that satisfy the core's capabilities, plus the full set of Stripe-specific resource modules. |

## The idea

Your program depends only on **capabilities** defined by the core — it never
imports Stripe:

```typescript
import { Effect } from "effect";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as Subscription from "@thomasfosterau/effect-payments/Subscription";

// Effect<{ customer, subscription }, PaymentsError, Customers | Subscriptions>
const onboard = (email: string, priceId: string) =>
  Effect.gen(function* () {
    const customer = yield* Customer.create({ email });
    const subscription = yield* Subscription.create({
      customer: customer.id,
      items: [{ price: priceId }],
    });
    return { customer, subscription };
  });
```

The **provider** is chosen at the edge of your application by providing a layer.
Swapping providers means swapping the layer, not the program:

```typescript
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const layer = StripePayments.layer({ apiKey: "sk_test_..." });

const result = await Effect.runPromise(
  onboard("jane@example.com", "price_123").pipe(Effect.provide(layer))
);
```

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-stripe effect stripe
```

`effect` is a peer dependency of both packages; `stripe` is required by the
Stripe provider.

## The vendor-neutral core

### Capabilities

Each resource is an abstract Effect service (a `Context.Tag`). A program that
calls `Customer.create(...)` requires the `Customers` capability in its
environment; nothing more.

| Module | Capability | Operations |
| --- | --- | --- |
| `Customer` | `Customers` | `create`, `retrieve`, `update`, `del`, `list` |
| `Product` | `Products` | `create`, `retrieve`, `update`, `del`, `list` |
| `Price` | `Prices` | `create`, `retrieve`, `update`, `list` |
| `PaymentIntent` | `PaymentIntents` | `create`, `retrieve`, `update`, `confirm`, `cancel`, `list` |
| `Subscription` | `Subscriptions` | `create`, `retrieve`, `update`, `cancel`, `list` |
| `Refund` | `Refunds` | `create`, `retrieve`, `update`, `list` |

Every operation returns `Effect<Entity, PaymentsError, Capability>`. List
operations return a neutral `Page<Entity>` (`{ data, hasMore }`); deletions
return `Deleted` (`{ id, deleted: true }`).

### Domain types

Entities are provider-agnostic [`effect/Schema`](https://effect.website/docs/schema/introduction/)
classes — e.g. `Customer`, `Product`, `Price`, `PaymentIntent`, `Subscription`,
`Refund`, and `Money` (amounts are always in the smallest currency unit). They
contain only fields that are meaningful across providers, in a normalized shape
(`camelCase`, neutral status enums).

### Errors

The failure channel is the neutral `PaymentsError` union:

- `PaymentProviderError` — a provider rejected the request (carries `provider`, `code`, `statusCode`)
- `PaymentAuthenticationError` — authentication failed
- `PaymentRateLimitError` — too many requests (carries `retryAfter`)
- `PaymentInvalidRequestError` — invalid parameters
- `PaymentNetworkError` — transport-level failure

Plus `PaymentConfigError` (raised while building a provider layer) and
`SignatureVerificationError` (webhook verification).

```typescript
import * as Customer from "@thomasfosterau/effect-payments/Customer";

const program = Customer.create({ email: "jane@example.com" }).pipe(
  Effect.catchTag("PaymentAuthenticationError", (e) =>
    Effect.logError(`Auth failed: ${e.message}`)
  ),
  Effect.catchTag("PaymentRateLimitError", (e) =>
    Effect.logError(`Rate limited; retry after ${e.retryAfter}s`)
  )
);
```

## The Stripe provider

### Providing the capabilities

`StripePayments.layer` bundles the Stripe client and every capability so a
neutral program can be satisfied with a single `Effect.provide`:

```typescript
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const layer = StripePayments.layer({
  apiKey: "sk_test_...",
  maxNetworkRetries: 3,
  timeout: 10_000,
});

// Or from an environment variable (STRIPE_API_KEY by default):
const layer = StripePayments.layerFromEnv();
```

For finer control, `StripePayments.capabilities` provides every capability but
requires a `StripeService`, and individual layers
(`StripePayments.customersLayer`, etc.) are exported too. The `Stripe` module
provides just the client (`Stripe.layer` / `Stripe.layerFromEnv` / `Stripe.make`).

### The Stripe escape hatch

The neutral core deliberately covers only concepts common to payment providers.
Stripe-specific resources — Treasury, Issuing, Terminal, Identity, Connect,
Invoices, Checkout, and many more — remain available as full-fidelity modules
that return Stripe SDK types directly:

```typescript
import * as Treasury from "@thomasfosterau/effect-payments-stripe/Treasury";
import * as Invoice from "@thomasfosterau/effect-payments-stripe/Invoice";
```

These require the `Stripe` service (provided by any of the layers above) and
fail with the neutral `PaymentsError` channel.

### Webhooks

```typescript
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";

const handle = (body: string | Buffer, signature: string, secret: string) =>
  Effect.gen(function* () {
    const event = yield* Webhook.constructEvent(body, signature, secret);
    // event is a typed Stripe.Event
    return event;
  }).pipe(
    Effect.catchTag("SignatureVerificationError", (e) =>
      Effect.logError(`Invalid webhook signature: ${e.message}`)
    )
  );
```

See [`packages/payments-stripe/examples`](packages/payments-stripe/examples) for
runnable examples.

## Development

This is a [Bun](https://bun.sh) workspace.

```bash
bun install         # install all workspace dependencies
bun run build       # build the core, then the Stripe provider
bun run test        # run the full test suite (Vitest)
bun run typecheck   # type-check the whole workspace
bun run lint        # lint
bun run format      # format with Prettier
```

## License

MIT © Thomas Foster

## Acknowledgments

Built with [Effect](https://effect.website/) and the
[Stripe Node.js SDK](https://github.com/stripe/stripe-node). The two-package
shape is inspired by [`@effect/ai`](https://effect.website/docs/ai/introduction/).

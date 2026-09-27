# effect-payments

A **vendor-neutral payments core for Effect**, with a **Stripe implementation** — the payments analogue of Effect's AI packages, where [`@effect/ai`](https://effect.website/docs/ai/introduction/) defines a provider-agnostic abstraction and `@effect/ai-openai` supplies a concrete implementation.

[![CI](https://github.com/thomasfosterau/effect-stripe/actions/workflows/ci.yml/badge.svg)](https://github.com/thomasfosterau/effect-stripe/actions/workflows/ci.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

| Package | Description |
| --- | --- |
| [`@thomasfosterau/effect-payments`](packages/payments) | The vendor-neutral core: abstract capabilities, neutral domain types, and a neutral error channel. Depend on this in your application code. |
| [`@thomasfosterau/effect-payments-stripe`](packages/payments-stripe) | The Stripe implementation. Provides `Layer`s that satisfy the core's capabilities, plus the full set of Stripe-specific resource modules. |
| [`@thomasfosterau/effect-payments-airwallex`](packages/payments-airwallex) | The Airwallex implementation. Provides `Layer`s for the `Customers`, `PaymentIntents` and `Refunds` capabilities. |
| [`@thomasfosterau/effect-payments-paypal`](packages/payments-paypal) | The PayPal implementation. Provides `Layer`s for the `Products`, `Prices`, `PaymentIntents`, `Subscriptions` and `Refunds` capabilities. |

## The idea

Your program depends only on **capabilities** defined by the core — it never imports Stripe:

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

The **provider** is chosen at the edge of your application by providing a layer. Swapping providers means swapping the layer, not the program:

```typescript
import { Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const layer = StripePayments.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
  Layer.provide(FetchHttpClient.layer), // every provider speaks effect/unstable/http
);

const result = await Effect.runPromise(
  onboard("jane@example.com", "price_123").pipe(Effect.provide(layer)),
);
```

The same program runs on a different provider by changing only the layer:

```typescript
import { Layer } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as AirwallexPayments from "@thomasfosterau/effect-payments-airwallex/AirwallexPayments";

const layer = AirwallexPayments.layer({ clientId: "...", apiKey: "..." }).pipe(
  Layer.provide(FetchHttpClient.layer),
);
```

Providers may implement only the capabilities they support, and different providers cover different subsets — Airwallex covers customers, payment intents and refunds; PayPal covers products, prices, subscriptions, payment intents and refunds but has no customers. The type system enforces this: a program that needs a capability the provided layer doesn't supply simply won't type-check.

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-stripe effect
```

`effect` is a peer dependency of every package. The Stripe provider talks to the API over `fetch` (through `effect/unstable/http`), with no Node API and no SDK, so it runs in a Cloudflare Worker. The official `stripe` package is an **optional** peer: install it (a dev dependency is enough) for the types the Stripe resource modules return, and as a runtime dependency only to use the SDK transport (`@thomasfosterau/effect-payments-stripe/Stripe`) or the SDK-based `Webhook` verifier.

## The vendor-neutral core

### Capabilities

Each resource is an abstract Effect service (a `Context.Service`). A program that calls `Customer.create(...)` requires the `Customers` capability in its environment; nothing more.

| Module | Capability | Operations |
| --- | --- | --- |
| `Customer` | `Customers` | `create`, `retrieve`, `update`, `del`, `list` |
| `Product` | `Products` | `create`, `retrieve`, `update`, `del`, `list` |
| `Price` | `Prices` | `create`, `retrieve`, `update`, `list` |
| `PaymentIntent` | `PaymentIntents` | `create`, `retrieve`, `update`, `confirm`, `cancel`, `list` |
| `Subscription` | `Subscriptions` | `create`, `retrieve`, `update`, `cancel`, `list` |
| `Refund` | `Refunds` | `create`, `retrieve`, `update`, `list` |
| `CheckoutSession` | `CheckoutSessions` | `create` (a hosted checkout page → its `url`) |
| `BillingPortal` | `BillingPortalSessions` | `create` (a hosted billing portal page → its `url`) |

Every operation returns `Effect<Entity, PaymentsError, Capability>`. List operations return a neutral `Page<Entity>` (`{ data, hasMore }`); deletions return `Deleted` (`{ id, deleted: true }`).

### Domain types

Entities are provider-agnostic [`effect/Schema`](https://effect.website/docs/schema/introduction/) classes — e.g. `Customer`, `Product`, `Price`, `PaymentIntent`, `Subscription`, `Refund`, and `Money` (amounts are always in the smallest currency unit). They contain only fields that are meaningful across providers, in a normalized shape (`camelCase`, neutral status enums).

### Errors

The failure channel is the neutral `PaymentsError` union:

- `PaymentProviderError` — a provider rejected the request (carries `provider`, `code`, `statusCode`)
- `PaymentAuthenticationError` — authentication failed
- `PaymentRateLimitError` — too many requests (carries `retryAfter`)
- `PaymentInvalidRequestError` — invalid parameters
- `PaymentNetworkError` — transport-level failure
- `PaymentsUnavailable` — no provider can serve the call, typically because its credential is not configured ("not configured ≡ down"; carries `provider`)

Plus `PaymentConfigError` (raised while building a provider layer) and `SignatureVerificationError` (webhook verification).

```typescript
import * as Customer from "@thomasfosterau/effect-payments/Customer";

const program = Customer.create({ email: "jane@example.com" }).pipe(
  Effect.catchTag("PaymentAuthenticationError", (e) =>
    Effect.logError(`Auth failed: ${e.message}`),
  ),
  Effect.catchTag("PaymentRateLimitError", (e) =>
    Effect.logError(`Rate limited; retry after ${e.retryAfter}s`),
  ),
);
```

## The Stripe provider

### Providing the capabilities

`StripePayments.layer` bundles the fetch transport and every capability so a neutral program can be satisfied with a single `Effect.provide` (plus an `HttpClient`):

```typescript
import { Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const layer = StripePayments.layer({
  apiKey: Redacted.make("sk_test_..."),
  apiVersion: "2025-08-27.basil", // pinned in Stripe-Version; defaults to 2025-02-24.acacia
  maxNetworkRetries: 3,
  timeout: 10_000,
}).pipe(Layer.provide(FetchHttpClient.layer));

// Or from a configuration variable (STRIPE_API_KEY by default), read as a Redacted:
const fromEnv = StripePayments.layerFromEnv().pipe(Layer.provide(FetchHttpClient.layer));
```

The transport is `StripeHttp`: form-encoded bodies with Stripe's bracketed nesting, a pinned `Stripe-Version`, the key as a `Redacted` bearer token, redirects refused, the SDK's retry policy (connection failures, `409`, `5xx`, `Stripe-Should-Retry`) with one `Idempotency-Key` across the attempts of a `POST`, and Stripe's error envelope decoded onto the neutral errors. Tests stub `FetchHttpClient.Fetch`.

#### "Not configured ≡ down"

`StripePayments.layerConfig` reads the key (`STRIPE_API_KEY` by default, or `envVar`) through the current `ConfigProvider` on **every call**, never while the layer is built. The layer therefore always builds — a Worker without billing configured still boots and serves everything else — and a call made while the key is absent fails with `PaymentsUnavailable`, exactly as if Stripe were down (answer it with a 503). Once the key is present, calls go over the fetch transport with it.

```typescript
const billing = StripePayments.layerConfig({ envVar: "STRIPE_SECRET_KEY" }).pipe(
  Layer.provide(FetchHttpClient.layer),
);

const checkout = CheckoutSession.create(params).pipe(
  Effect.catchTag("PaymentsUnavailable", () => Effect.succeed(serviceUnavailable)),
);
```

`StripeHttp.layerConfig` is the same posture for the transport alone (so for the raw resource modules too). For a provider-neutral stub with no transport at all — a unit suite, say — `Stub.unavailable("stripe")` from `@thomasfosterau/effect-payments/Stub` fails every capability call the same way.

For finer control, `StripePayments.capabilities` provides every capability over an existing `StripeHttp`, and individual layers (`StripePayments.customersLayer`, etc.) are exported too. To run on the official SDK instead, provide the capabilities with `Stripe.layer` (from `@thomasfosterau/effect-payments-stripe/Stripe`), which builds an SDK client and provides `StripeHttp` over it.

### The Stripe escape hatch

The neutral core deliberately covers only concepts common to payment providers. Stripe-specific resources — Treasury, Issuing, Terminal, Identity, Connect, Invoices, Checkout, and many more — remain available as full-fidelity modules, typed with the `stripe` package's declarations:

```typescript
import * as Treasury from "@thomasfosterau/effect-payments-stripe/Treasury";
import * as Invoice from "@thomasfosterau/effect-payments-stripe/Invoice";
```

These require the `StripeHttp` transport (from `StripeHttp.layer`, or `Stripe.layer` for the SDK) and fail with the neutral `PaymentsError` channel.

### Webhooks

`Webhook` wraps the SDK's verifier today, so it needs the SDK client from `Stripe.layer`; a WebCrypto verifier becomes the default in #41.

```typescript
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";

const handle = (body: string | Buffer, signature: string, secret: string) =>
  Effect.gen(function* () {
    const event = yield* Webhook.constructEvent(body, signature, secret);
    // event is a typed Stripe.Event
    return event;
  }).pipe(
    Effect.catchTag("SignatureVerificationError", (e) =>
      Effect.logError(`Invalid webhook signature: ${e.message}`),
    ),
  );
```

See [`packages/payments-stripe/examples`](packages/payments-stripe/examples) for runnable examples.

## Development

This is a pnpm workspace on the [Vite+](https://viteplus.dev) toolchain (`vp`). Conventions for humans and agents are in [AGENTS.md](AGENTS.md); the pre-PR checklist is in [CONTRIBUTING.md](CONTRIBUTING.md); releases are in [PUBLISHING.md](PUBLISHING.md).

```bash
pnpm install          # dependencies, git hooks, and the Effect-patched tsc / oxlint
vp check              # format + lint (oxfmt + oxlint)
vp run check          # type gate: every package, plus the emitted declarations
vp run -r test:unit   # unit tests (Vitest, every vendor seam stubbed)
vp run -r build       # emit each package's dist/ (vp pack)
```

## License

MIT © Thomas Foster

## Acknowledgments

Built with [Effect](https://effect.website/); the optional SDK transport uses the [Stripe Node.js SDK](https://github.com/stripe/stripe-node). The two-package shape is inspired by [`@effect/ai`](https://effect.website/docs/ai/introduction/).

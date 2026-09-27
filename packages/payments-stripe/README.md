# @thomasfosterau/effect-payments-stripe

The **Stripe implementation** of the vendor-neutral [`@thomasfosterau/effect-payments`](../payments) core.

It provides `Layer`s that satisfy the neutral capabilities over a fetch-only Stripe transport (`StripeHttp`, on `effect/unstable/http` — no Node API, no SDK, so it runs in a Cloudflare Worker), and exposes the full set of Stripe-specific resource modules as a provider escape hatch.

## Installation

```bash
npm install @thomasfosterau/effect-payments @thomasfosterau/effect-payments-stripe effect
```

`stripe` is an optional peer: add it (as a dev dependency) for the types the resource modules return, and at runtime only for the SDK transport (`./Stripe`) or the SDK-based `Webhook` verifier.

## Usage

Write your program against the neutral core, then provide a Stripe layer:

```typescript
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const program = Customer.create({ email: "jane@example.com" });

const layer = StripePayments.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
  Layer.provide(FetchHttpClient.layer),
);
// StripePayments.layerFromEnv() reads STRIPE_API_KEY as a Redacted, failing the build without it.
// StripePayments.layerConfig() reads it on every call instead: the layer always builds, and a
// call made while it is absent fails with PaymentsUnavailable ("not configured ≡ down").

const customer = await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## What's included

- **`StripePayments`** — `layer` / `layerFromEnv` / `layerConfig` (fetch transport + every capability; `layerConfig` reads the key at call time and fails with `PaymentsUnavailable` while it is absent), `capabilities` (every capability over an existing `StripeHttp`), and individual capability layers (`customersLayer`, `productsLayer`, …, `checkoutSessionsLayer`, `billingPortalSessionsLayer`). Responses are decoded with `Schema`; a malformed one fails with `PaymentProviderError`.
- **`StripeHttp`** — the fetch-only transport: form-encoded bodies, pinned `Stripe-Version`, `Redacted` key, redirects refused, the SDK's retry policy with idempotency keys, and Stripe's error envelope decoded onto the neutral errors. `layer` / `layerFromEnv` / `layerConfig` / `make`.
- **`Stripe`** — the optional SDK transport: an SDK client (`StripeService`) and `StripeHttp` over it (`layer` / `layerFromEnv` / `make`). Needs the `stripe` peer.
- **Raw resource modules** — full-fidelity Stripe coverage typed with the `stripe` package's declarations, for resources with no vendor-neutral equivalent (`Treasury`, `Issuing.*`, `Terminal.*`, `Identity.*`, `Invoice`, `Charge`, `Payout`, and many more), and as the full-fidelity alternative where a neutral capability exists: the raw `CheckoutSession` module takes every Stripe Checkout parameter (embedded mode, `setup` mode, discounts, …) where `StripePayments.checkoutSessionsLayer` takes only the neutral ones. Some raw modules share a name with a neutral core module — `@thomasfosterau/effect-payments-stripe/Customer` and `@thomasfosterau/effect-payments/Customer`, `@thomasfosterau/effect-payments-stripe/CheckoutSession` and `@thomasfosterau/effect-payments/CheckoutSession` — so alias one of them when a program imports both.
- **`Webhook`** — signature verification and event construction over the SDK (needs `Stripe.layer`; a WebCrypto default lands in #41).

See the [repository README](../../README.md) and [`examples`](examples) for the full guide.

## License

MIT © Thomas Foster

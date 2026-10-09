# effect-payments

A vendor-neutral payments core for Effect, with Stripe, PayPal and Airwallex providers. Write a program against the core's capabilities; choose the provider by the layer you provide.

| Package | Purpose |
| --- | --- |
| [`@thomasfosterau/effect-payments`](packages/payments) | The core: capability services, neutral entities, `Money`, `Page`, `IdempotencyKey`, `Stub` and the `PaymentsError` channel. Peer: `effect`. |
| [`@thomasfosterau/effect-payments-stripe`](packages/payments-stripe) | Every capability over Distilled's Stripe operations (`@distilled.cloud/stripe`), plus the raw Stripe resource modules over a fetch-only transport and the WebCrypto webhook verifier. Peer: `effect` `^4.0.0` (Distilled's own range); optional peer: `stripe`. |
| [`@thomasfosterau/effect-payments-paypal`](packages/payments-paypal) | `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds` over Distilled's PayPal operations (`@distilled.cloud/paypal`), with the package's own OAuth login, plus a low-level PayPal REST client. Peer: `effect` `^4.0.0` (Distilled's own range). |
| [`@thomasfosterau/effect-payments-airwallex`](packages/payments-airwallex) | `Customers`, `PaymentIntents`, `Refunds` over Airwallex. |

```typescript
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const program = Customer.create({ email: "jane@example.com" }); // needs only `Customers`

const layer = StripePayments.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
  Layer.provide(FetchHttpClient.layer),
);

await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

Each package's README is its API reference. Runnable examples are in [`packages/payments-stripe/examples`](packages/payments-stripe/examples).

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md); conventions for agents are in [AGENTS.md](AGENTS.md).

## License

MIT © Thomas Foster

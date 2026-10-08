# @thomasfosterau/effect-payments-stripe

A Stripe implementation of the vendor-neutral effect-payments core.

It provides `Layer`s that satisfy the neutral capabilities of [`@thomasfosterau/effect-payments`](https://www.npmjs.com/package/@thomasfosterau/effect-payments) over a fetch-only Stripe transport (`StripeHttp`, on `effect/http`: no Node API and no SDK, so it runs in a Cloudflare Worker), the full set of Stripe resource modules as a provider escape hatch, and a WebCrypto webhook verifier.

## Install

```bash
pnpm add @thomasfosterau/effect-payments @thomasfosterau/effect-payments-stripe effect
```

`effect` is a peer dependency. The official `stripe` package is an **optional** peer (`^18.5.0`, the release for the default API version `2025-08-27.basil`):

- **At runtime** it is needed only for the SDK transport (`./Stripe`) or the SDK-based `Webhook.constructEvent*` verifier. The capability layers, `StripeHttp`, `Webhook.verify` and every resource module run without it.
- **For types** it is needed by every entry whose declarations import it: the raw resource modules, `./Webhook` (its `constructEvent` signature names `Stripe.Event`, so `Webhook.verify` users need it too) and the package root, which re-exports them. Add it as a dev dependency when you import any of those; otherwise, with `skipLibCheck: false`, the declarations fail to resolve `stripe`, and with it on, their SDK types silently become `any`. Only `./StripePayments`, `./StripeHttp` and the generated modules (`./CheckoutSession`, `./BillingPortal.Session`, `./Customer`, `./Product`, `./Price`) declare no import of it.

## Usage

Write your program against the neutral core, then provide a Stripe layer:

```typescript
import { Effect, Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import * as Customer from "@thomasfosterau/effect-payments/Customer";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const program = Customer.create({ email: "jane@example.com" });

const layer = StripePayments.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
  Layer.provide(FetchHttpClient.layer), // every provider speaks effect/http
);

const customer = await Effect.runPromise(program.pipe(Effect.provide(layer)));
```

## Providing the capabilities

`StripePayments.layer` bundles the fetch transport and every capability, so a neutral program is satisfied with a single `Effect.provide` (plus an `HttpClient`):

```typescript
import { Layer, Redacted } from "effect";
import { FetchHttpClient } from "effect/http";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const layer = StripePayments.layer({
  apiKey: Redacted.make("sk_test_..."),
  apiVersion: "2025-08-27.basil", // pinned in Stripe-Version; this is also the default
  maxNetworkRetries: 3,
  timeout: 10_000,
}).pipe(Layer.provide(FetchHttpClient.layer));

// Or from a configuration variable (STRIPE_API_KEY by default), read as a Redacted.
// A missing or empty variable fails the layer build with PaymentConfigError.
const fromEnv = StripePayments.layerFromEnv().pipe(Layer.provide(FetchHttpClient.layer));
```

The transport is `StripeHttp`: form-encoded bodies with Stripe's bracketed nesting, a pinned `Stripe-Version`, the key as a `Redacted` bearer token, redirects refused, the SDK's retry policy (connection failures, `409`, `5xx`, `Stripe-Should-Retry`) with one `Idempotency-Key` across the attempts of a `POST`, and Stripe's error envelope decoded onto the neutral errors. Responses the capability layers read are decoded with `Schema`; a malformed one fails with `PaymentProviderError`.

For finer control, `StripePayments.capabilities` provides every capability over an existing `StripeHttp`, and the individual layers (`customersLayer`, `productsLayer`, …, `checkoutSessionsLayer`, `billingPortalSessionsLayer`) are exported too. To run on the official SDK instead, provide the capabilities with `Stripe.layer` (from `@thomasfosterau/effect-payments-stripe/Stripe`), which builds an SDK client and provides `StripeHttp` over it.

### "Not configured ≡ down"

`StripePayments.layerConfig` reads the key (`STRIPE_API_KEY` by default, or `envVar`) on **every call**, never while the layer is built: from the calling fiber's `ConfigProvider` first, then from the one the layer was built under (so `layerConfig().pipe(Layer.provide(ConfigProvider.layer(…)))` works as it does for `layerFromEnv`). The layer therefore always builds — a Worker without billing configured still boots and serves everything else — and a call made while the key is absent or empty fails with `PaymentsUnavailable`, exactly as if Stripe were down (answer it with a 503).

```typescript
import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import * as CheckoutSession from "@thomasfosterau/effect-payments/CheckoutSession";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const billing = StripePayments.layerConfig({ envVar: "STRIPE_SECRET_KEY" }).pipe(
  Layer.provide(FetchHttpClient.layer),
);

const checkout = (params: CheckoutSession.CreateParams) =>
  CheckoutSession.create(params).pipe(
    Effect.map((session) => Response.redirect(session.url, 303)),
    Effect.catchTag("PaymentsUnavailable", () =>
      Effect.succeed(new Response(null, { status: 503 })),
    ),
    Effect.provide(billing),
  );
```

`StripeHttp.layerConfig` is the same posture for the transport alone (so for the raw resource modules too). For a provider-neutral stub with no transport at all, use `Stub.unavailable("stripe")` from `@thomasfosterau/effect-payments/Stub`.

## The Stripe escape hatch

The neutral core deliberately covers only concepts common to payment providers. Stripe-specific resources — Treasury, Issuing, Terminal, Identity, Connect, Invoices and many more — remain available as full-fidelity raw resource modules, one subpath each:

```typescript
import * as Treasury from "@thomasfosterau/effect-payments-stripe/Treasury";
import * as Invoice from "@thomasfosterau/effect-payments-stripe/Invoice";
```

They require the `StripeHttp` transport (from `StripeHttp.layer`, or `Stripe.layer` for the SDK) and fail with the neutral `PaymentsError` channel. Their results are typed with the `stripe` package's declarations and are **not decoded**, except for the generated modules below. A raw module is also the full-fidelity alternative where a neutral capability exists: the raw `CheckoutSession` module takes every Stripe Checkout parameter (embedded mode, `setup` mode, discounts, …) where `StripePayments.checkoutSessionsLayer` takes only the neutral ones. Some raw modules share a name with a neutral core module (`Customer`, `CheckoutSession`, …), so alias one of them when a program imports both.

**Per-call options.** Every raw-module operation takes a trailing `options?: { idempotencyKey?, stripeAccount? }` (`StripeHttp.RequestOptions`): `Customer.create(params, { idempotencyKey })`. Make one `idempotencyKey` per logical write before the first attempt and reuse it on every retry; it is sent verbatim as `Idempotency-Key` on any method. An empty `idempotencyKey` or `stripeAccount` fails with `PaymentInvalidRequestError`. Because of the trailing argument, wrap an operation before passing it to an index-supplying iterator: `Effect.forEach(ids, (id) => Customer.del(id))`. The neutral capabilities take the neutral `idempotencyKey` on their create / confirm operations; the retry rules are in the core package's README ("Retrying a write safely").

### Generated, decoded resource types (`CheckoutSession`, `BillingPortal.Session`, `Customer`, `Product`, `Price`)

Five modules are migrated off the `stripe` package's types: `CheckoutSession`, `BillingPortal.Session`, `Customer`, `Product` and `Price`. Their parameter and result types are `Schema`s generated by `@effect/openapi-generator` from Stripe's OpenAPI spec, pinned to one tag of `stripe/openapi` (API version `2025-08-27.basil`). Each exposes its schemas (`CheckoutSession.Session`, `CheckoutSession.SessionList`, `BillingPortalSession.Session`, `Customer.Customer`, `Customer.DeletedCustomer`, `Customer.CustomerList`, `Product.Product`, `Product.DeletedProduct`, `Product.ProductList`, `Price.Price`, `Price.PriceList`) and the parameter types (`SessionCreateParams`, `CustomerCreateParams`, `PriceListParams`, …); every response is **decoded** with them, and a 2xx body that does not match fails with `PaymentProviderError`. Their emitted `.d.ts` files do not import `stripe`, so a consumer of only these modules needs no `stripe` types installed. The remaining resource modules migrate one by one.

An expandable field (`customer`, `payment_intent`, …) decodes as its id or, when you `expand` it, an open JSON object (a migrated resource is typed in full when you call its own module, `Customer.retrieve(id)`, rather than expand it). Response enumerations are lenient (`Enumeration` from the core): a value Stripe adds later decodes as `Other` carrying the raw string instead of failing a call that has already taken effect, and the known values stay bare strings; request enumerations stay closed to the pinned spec. A response is not checked against the documented `maxLength` or integer constraints.

## Webhooks

`Webhook.verify` is a Workers-safe WebCrypto verifier (HMAC-SHA256, constant-time compare, ±300 s tolerance by default, "now" from `Clock`) that needs neither the SDK nor any Node API. Pass the raw body bytes; nothing is decoded until the signature verifies, and every refusal is a `SignatureVerificationError` that never carries the secret. `decodeHandledEvent` narrows a verified event to the handled event types.

```typescript
import { Effect, Redacted } from "effect";
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";

const handle = (request: Request, secret: Redacted.Redacted<string>) =>
  Effect.gen(function* () {
    const event = yield* Webhook.verify({
      payload: new Uint8Array(yield* Effect.promise(() => request.arrayBuffer())),
      header: request.headers.get(Webhook.SIGNATURE_HEADER),
      secret,
    });
    const handled = yield* Webhook.decodeHandledEvent(event); // Option<HandledEvent>
    return new Response(null, { status: 200 });
  }).pipe(
    Effect.catchTag("SignatureVerificationError", () =>
      Effect.succeed(new Response(null, { status: 400 })),
    ),
  );
```

The SDK-based `Webhook.constructEvent` / `constructEventAsync` remain as an optional alternative; they need the SDK client from `Stripe.layer`.

## API

| Module | Purpose |
| --- | --- |
| `StripePayments` | `layer` / `layerFromEnv` / `layerConfig` (fetch transport + every capability), `capabilities` (every capability over an existing `StripeHttp`), and the individual capability layers. |
| `StripeHttp` | The fetch-only transport: `layer` / `layerFromEnv` / `layerConfig` / `make`, and `RequestOptions`. |
| `Stripe` | The optional SDK transport: an SDK client (`StripeService`) and `StripeHttp` over it (`layer` / `layerFromEnv` / `make`). Needs the `stripe` peer at runtime. |
| `Webhook` | `verify`, `decodeHandledEvent`, `SIGNATURE_HEADER`; the SDK-based `constructEvent` / `constructEventAsync`. |
| `CheckoutSession`, `BillingPortal.Session` | Generated, decoded raw resource modules. |
| `Customer`, `Invoice`, `Treasury`, `Issuing.*`, `Terminal.*`, `Identity.*`, … | Raw resource modules, one per Stripe API resource (see `package.json` `exports` for the full list). |

The root entry re-exports the core (`Payments`), `StripeHttp`, `StripePayments`, `Webhook` and the raw modules as namespaces; it never loads the SDK at runtime.

## License

MIT © Thomas Foster

# @thomasfosterau/effect-payments-stripe

A Stripe implementation of the vendor-neutral effect-payments core.

It provides `Layer`s that satisfy the neutral capabilities of [`@thomasfosterau/effect-payments`](https://www.npmjs.com/package/@thomasfosterau/effect-payments) over [Distilled's Stripe operations](https://www.npmjs.com/package/@distilled.cloud/stripe) (`@distilled.cloud/stripe`, on `effect/http`: no Node API and no SDK), the full set of Stripe resource modules as a provider escape hatch over a fetch-only transport (`StripeHttp`), and a WebCrypto webhook verifier.

## Install

```bash
pnpm add @thomasfosterau/effect-payments @thomasfosterau/effect-payments-stripe effect
```

`effect` is a peer dependency. `@distilled.cloud/stripe` and `@distilled.cloud/core` are dependencies, pinned exactly (they are pre-1.0): about 28 MB installed, of which a bundler keeps only the operations the capabilities you use call. The official `stripe` package is an **optional** peer (`^18.5.0`, the release for the default API version `2025-08-27.basil`):

- **At runtime** it is needed only for the SDK transport (`./Stripe`) or the SDK-based `Webhook.constructEvent*` verifier. The capability layers, `StripeHttp`, `Webhook.verify` and every resource module run without it.
- **For types** it is needed by every entry whose declarations import it: the raw resource modules, `./Webhook` (its `constructEvent` signature names `Stripe.Event`, so `Webhook.verify` users need it too) and the package root, which re-exports them. Add it as a dev dependency when you import any of those; otherwise, with `skipLibCheck: false`, the declarations fail to resolve `stripe`, and with it on, their SDK types silently become `any`. Only `./StripePayments`, `./StripeHttp` and the generated modules (`./CheckoutSession`, `./BillingPortal.Session`, `./Customer`, `./Product`, `./Price`, `./Subscription`, `./SubscriptionSchedule`, `./Invoice`) declare no import of it.

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

`StripePayments.layer` builds every capability from configuration, so a neutral program is satisfied with a single `Effect.provide` (plus an `HttpClient`):

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

Each capability call is one of Distilled's generated operations (`CreateCustomer`, `GetSubscription`, …), which form-encode the request with Stripe's bracketed nesting and send the key as a bearer token. Around every call the layers apply this package's request policy: `Stripe-Version` pinned to `DEFAULT_API_VERSION` (`2025-08-27.basil`) unless configured, since Distilled sends none of its own and the account's dashboard default would otherwise decide the wire shape; the SDK's retry policy (connection failures, `409`, `5xx`, `Stripe-Should-Retry`, `Retry-After`) with one `Idempotency-Key` across the attempts of a `POST`, in place of Distilled's own; a per-attempt timeout; redirects refused; and every failure (Distilled's `CardError`, `InvalidRequestError`, …, an HTTP status error or a connection failure) mapped onto the neutral errors, from the response's status and Stripe's error envelope. Responses are decoded with `Schema` over the fields the layers read; a malformed one fails with `PaymentProviderError`. Distilled's schemas are generated from a newer Stripe API version (`2026-07-29.dahlia` in `1.0.0-rc.13`) than the pinned one, so the layers keep Distilled's response validation lenient even under its `ResponseValidation.strict`.

For finer control, `StripePayments.capabilities` provides every capability over Distilled's `Credentials` and an `HttpClient` in context, at the default policy, and the individual layers (`customersLayer`, `productsLayer`, …, `checkoutSessionsLayer`, `billingPortalSessionsLayer`) are exported too:

```typescript
import { Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import * as Credentials from "@distilled.cloud/stripe/Credentials";
import * as StripePayments from "@thomasfosterau/effect-payments-stripe/StripePayments";

const customers = StripePayments.customersLayer.pipe(
  Layer.provide(Credentials.credentials({ apiKey: "sk_test_..." })),
  Layer.provide(FetchHttpClient.layer),
);
```

Distilled's `DISTILLED_DEBUG_HTTP` environment variable makes it log each request's URL and the first 400 characters of every request and response body to `console.error` (a payment intent's `client_secret` included), and Distilled reads it from `process.env` on every request, so leave it unset outside local debugging.

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

`StripeHttp.layerConfig` is the same posture for the raw resource modules' transport. For a provider-neutral stub with no transport at all, use `Stub.unavailable("stripe")` from `@thomasfosterau/effect-payments/Stub`.

## The Stripe escape hatch

The neutral core deliberately covers only concepts common to payment providers. Stripe-specific resources — Treasury, Issuing, Terminal, Identity, Connect, Invoices and many more — remain available as full-fidelity raw resource modules, one subpath each:

```typescript
import * as Treasury from "@thomasfosterau/effect-payments-stripe/Treasury";
import * as Invoice from "@thomasfosterau/effect-payments-stripe/Invoice";
```

They require the `StripeHttp` transport (from `StripeHttp.layer`, or `Stripe.layer` for the SDK) and fail with the neutral `PaymentsError` channel. Their results are typed with the `stripe` package's declarations and are **not decoded**, except for the generated modules below. A raw module is also the full-fidelity alternative where a neutral capability exists: the raw `CheckoutSession` module takes every Stripe Checkout parameter (embedded mode, `setup` mode, discounts, …) where `StripePayments.checkoutSessionsLayer` takes only the neutral ones. Some raw modules share a name with a neutral core module (`Customer`, `CheckoutSession`, …), so alias one of them when a program imports both.

**Per-call options.** Every raw-module operation takes a trailing `options?: { idempotencyKey?, stripeAccount? }` (`StripeHttp.RequestOptions`): `Customer.create(params, { idempotencyKey })`. Make one `idempotencyKey` per logical write before the first attempt and reuse it on every retry; it is sent verbatim as `Idempotency-Key` on any method. An empty `idempotencyKey` or `stripeAccount` fails with `PaymentInvalidRequestError`. Because of the trailing argument, wrap an operation before passing it to an index-supplying iterator: `Effect.forEach(ids, (id) => Customer.del(id))`. The neutral capabilities take the neutral `idempotencyKey` on their create / confirm operations; the retry rules are in the core package's README ("Retrying a write safely").

### Generated, decoded resource types (`CheckoutSession`, `BillingPortal.Session`, `Customer`, `Product`, `Price`, `Subscription`, `SubscriptionSchedule`, `Invoice`)

Eight modules are migrated off the `stripe` package's types: `CheckoutSession`, `BillingPortal.Session`, `Customer`, `Product`, `Price`, `Subscription`, `SubscriptionSchedule` and `Invoice`. Their parameter and result types are `Schema`s generated by `@effect/openapi-generator` from Stripe's OpenAPI spec, pinned to one tag of `stripe/openapi` (API version `2025-08-27.basil`). Each exposes its schemas (`CheckoutSession.Session`, `CheckoutSession.SessionList`, `BillingPortalSession.Session`, `Customer.Customer`, `Customer.DeletedCustomer`, `Customer.CustomerList`, `Product.Product`, `Product.DeletedProduct`, `Product.ProductList`, `Price.Price`, `Price.PriceList`, `Subscription.Subscription`, `Subscription.SubscriptionList`, `SubscriptionSchedule.SubscriptionSchedule`, `SubscriptionSchedule.SubscriptionScheduleList`, `Invoice.Invoice`, `Invoice.DeletedInvoice`, `Invoice.InvoiceList`) and the parameter types (`SessionCreateParams`, `CustomerCreateParams`, `PriceListParams`, `SubscriptionCancelParams`, …); every response is **decoded** with them, and a 2xx body that does not match fails with `PaymentProviderError`. Their emitted `.d.ts` files do not import `stripe`, so a consumer of only these modules needs no `stripe` types installed. The remaining resource modules migrate one by one.

An expandable field (`customer`, `payment_intent`, …) decodes as its id or, when you `expand` it, an open JSON object (a migrated resource is typed in full when you call its own module, `Customer.retrieve(id)`, rather than expand it). So does each resource a Stripe error object carries (`Invoice`'s `last_finalization_error.payment_intent`, …). Response enumerations are lenient (`Enumeration` from the core): a value Stripe adds later decodes as `Other` carrying the raw string instead of failing a call that has already taken effect, and the known values stay bare strings; request enumerations stay closed to the pinned spec. A response is not checked against the documented `maxLength` or integer constraints.

## Webhooks

`Webhook.verify` is a Workers-safe WebCrypto verifier (HMAC-SHA256, constant-time compare, ±300 s tolerance by default, "now" from `Clock`) that needs neither the SDK nor any Node API. Pass the raw body bytes; nothing is decoded until the signature verifies, and every refusal is a `SignatureVerificationError` that never carries the secret. `decodeHandledEvent` narrows a verified event to the handled event types.

Stripe treats every non-2xx answer as a failed delivery and retries it for a limited period (see [Stripe's webhook docs](https://docs.stripe.com/webhooks)), so the status mostly tells the operator which side is at fault: a 400 for a bad delivery (an unreadable body, a signature refusal, a signed body that is not an event envelope), a 500 for breakage on this side (a handled event that fails to decode, say after a field moved in a new API version). A fix that ships after the retries stop needs the event resent from the Dashboard.

```typescript
import { Effect, Option, Redacted, Schema } from "effect";
import * as Webhook from "@thomasfosterau/effect-payments-stripe/Webhook";

class UnreadableBodyError extends Schema.TaggedError<UnreadableBodyError>()(
  "UnreadableBodyError",
  {},
) {}

const status = (code: number) => Effect.succeed(new Response(null, { status: code }));

const handle = Effect.fn("handleStripeWebhook")(
  function* (request: Request, secret: Redacted.Redacted<string>) {
    const payload = new Uint8Array(
      yield* Effect.tryPromise({
        try: () => request.arrayBuffer(),
        catch: () => new UnreadableBodyError(),
      }),
    );
    const event = yield* Webhook.verify({
      payload,
      header: request.headers.get(Webhook.SIGNATURE_HEADER),
      secret,
    });
    return yield* Webhook.decodeHandledEvent(event).pipe(
      Effect.flatMap((handled) => {
        if (Option.isSome(handled)) {
          // Act on handled.value: its `type` narrows `data.object`.
        }
        // Acknowledge every other type: refusing it makes Stripe retry it.
        return status(200);
      }),
      // Breakage on this side: log the id and type, never the payload.
      Effect.catchTag("SchemaError", () =>
        Effect.logError("Handled Stripe event failed to decode").pipe(
          Effect.annotateLogs({ id: event.id, type: event.type }),
          Effect.andThen(status(500)),
        ),
      ),
    );
  },
  Effect.catchTags({
    SignatureVerificationError: () => status(400), // bare: never say which check failed
    SchemaError: () => status(400), // signed, but not an event envelope
    UnreadableBodyError: () => status(400),
  }),
);
```

[`examples/webhooks.ts`](https://github.com/thomasfosterau/effect-payments/blob/trunk/packages/payments-stripe/examples/webhooks.ts) is the full version: the secret read through `Config`, an exhaustive `Match` over the handled types, and a demo that signs its own test deliveries with `Webhook.signatureHeader`.

The SDK-based `Webhook.constructEvent` / `constructEventAsync` remain as an optional alternative; they need the SDK client from `Stripe.layer`.

## API

| Module | Purpose |
| --- | --- |
| `StripePayments` | `layer` / `layerFromEnv` / `layerConfig` (every capability, from configuration), `capabilities` (every capability over Distilled's `Credentials` and an `HttpClient`), and the individual capability layers. |
| `StripeHttp` | The fetch-only transport of the raw resource modules: `layer` / `layerFromEnv` / `layerConfig` / `make`, `RequestOptions` and `DEFAULT_API_VERSION`. |
| `Stripe` | The optional SDK transport: an SDK client (`StripeService`) and `StripeHttp` over it (`layer` / `layerFromEnv` / `make`). Needs the `stripe` peer at runtime. |
| `Webhook` | `verify`, `decodeHandledEvent`, `SIGNATURE_HEADER`; the SDK-based `constructEvent` / `constructEventAsync`. |
| `CheckoutSession`, `BillingPortal.Session` | Generated, decoded raw resource modules. |
| `Customer`, `Invoice`, `Treasury`, `Issuing.*`, `Terminal.*`, `Identity.*`, … | Raw resource modules, one per Stripe API resource (see `package.json` `exports` for the full list). |

The root entry re-exports the core (`Payments`), `StripeHttp`, `StripePayments`, `Webhook` and the raw modules as namespaces; it never loads the SDK at runtime.

## License

MIT © Thomas Foster

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

## Retrying a write safely

A write that fails with a `PaymentNetworkError` (a timeout, a dropped connection), or a provider 5xx, has an **unknown outcome**: the provider may have applied it. Repeating it blindly can charge, refund or create twice. Pass an `idempotencyKey` and the provider recognises the repeat as the same write and answers with the original outcome instead of applying it again.

```typescript
import { Effect, Schedule } from "effect";
import * as IdempotencyKey from "@thomasfosterau/effect-payments/IdempotencyKey";
import * as Refund from "@thomasfosterau/effect-payments/Refund";
import type { PaymentsError } from "@thomasfosterau/effect-payments";

// The outcome may be unknown (or the write not applied): safe to repeat with the same key.
const isUnknownOutcome = (error: PaymentsError) =>
  error._tag === "PaymentNetworkError" ||
  error._tag === "PaymentRateLimitError" ||
  (error._tag === "PaymentProviderError" && (error.statusCode ?? 0) >= 500);

const refund = (paymentIntent: string) =>
  Effect.gen(function* () {
    const idempotencyKey = yield* IdempotencyKey.generate; // once per logical write
    return yield* Refund.create({ paymentIntent, idempotencyKey }).pipe(
      Effect.retry({
        while: isUnknownOutcome, // see "Retry only when" below
        schedule: Schedule.exponential("200 millis"),
        times: 3,
      }),
    ); // the same key on every attempt
  });
```

The rules:

- **One key per logical write**, created by the caller _before the first attempt_ (`IdempotencyKey.generate`, or your own id for the operation, such as `refund-${orderId}`) and passed unchanged on every retry. A key generated inside the retried effect is a new key per attempt and protects nothing. Never reuse a key for a different write: a provider answers the same key with different parameters with an error rather than the original outcome. Stripe's is `idempotency_error`, which surfaces as `PaymentProviderError` with code `StripeIdempotencyError` (not `PaymentInvalidRequestError`); PayPal's and Airwallex's behaviour here is unverified.
- **Accepted on the create and confirm operations** that every provider implementing them can honour: `Customer.create`, `Product.create`, `Price.create`, `PaymentIntent.create` / `confirm`, `Subscription.create`, `Refund.create`, `CheckoutSession.create`. It is optional, and a program that passes none behaves as before. Updates are set-semantics and repeatable. `Subscription.cancel` and `PaymentIntent.cancel` do **not** take one (PayPal cannot honour a key there), and neither does `BillingPortal.create`: the option is absent from their types, so passing one does not compile.
- **Retry only when the outcome is unknown or the write was not applied**: `PaymentNetworkError` (a timeout, a dropped connection), `PaymentProviderError` with `statusCode >= 500` (a vendor 5xx surfaces as this, not as `PaymentNetworkError`) and `PaymentRateLimitError` (back off for `retryAfter` first). Do not retry `PaymentInvalidRequestError`, `PaymentAuthenticationError`, or a `PaymentProviderError` below 500 (including Stripe's `StripeIdempotencyError`): they fail the same way again.
- **The shape is the lowest common denominator**: 1 to 64 characters from `A-Z a-z 0-9 _ -` (a UUID is 36). `IdempotencyKey` is a branded `Schema`; `IdempotencyKey.make` or `IdempotencyKey.validate` check a value of your own, and a raw string that slips past the types fails with `PaymentInvalidRequestError` before anything is sent.
- **A window, not forever**: providers remember a key for a limited time, differing per provider. Treat a retry within hours as safe, one after days as a new write.
- **Unverified vendor figures.** The vendors' own limits and windows (Stripe: 255 characters, at least 24 hours; PayPal: about 108 characters, retention differing per API; Airwallex: about 64 characters) are from memory, not checked against their documentation, which was unreachable when this was written. The 1 to 64 character shape stays inside the smallest of them; the replay window is not promised by the type.

Mapping: Stripe sends `Idempotency-Key`; PayPal sends `PayPal-Request-Id` (on the `POST`); Airwallex sends `request_id` in place of its fresh per-call id. Without a key, PayPal sends no id, Airwallex keeps a fresh per-call `request_id` and Stripe's transport generates a key of its own per call (for its own internal retries); none of those deduplicates your retry.

## What's included

- **Capabilities** (`Context.Service` services): `Customers`, `Products`, `Prices`, `PaymentIntents`, `Subscriptions`, `Refunds`, `CheckoutSessions` (hosted checkout → URL), `BillingPortalSessions` (hosted billing portal → URL). Each module also exports accessor functions (`create`, `retrieve`, `update`, `del`, `list`, …).
- **Domain types** (`effect/Schema` classes): `Customer`, `Product`, `Price`, `PaymentIntent`, `Subscription`, `Refund`, `CheckoutSession`, `BillingPortalSession`, `Money`, plus `Page` / `Deleted`.
- **`IdempotencyKey`**: the branded key (`generate`, `validate`) that makes a retried create or confirm safe; see [Retrying a write safely](#retrying-a-write-safely).
- **Errors**: the neutral `PaymentsError` union and friends (`PaymentProviderError`, `PaymentAuthenticationError`, `PaymentRateLimitError`, `PaymentInvalidRequestError`, `PaymentNetworkError`, `PaymentsUnavailable`, `PaymentConfigError`, `SignatureVerificationError`). `PaymentsUnavailable` is the "not configured ≡ down" failure: no provider is available to serve the call (typically, its credential is absent), raised at call time.
- **Stubs** (`Stub`): capability layers whose every call fails with one given error — `Stub.layer(failure)` for every capability, one constructor per capability (`Stub.customers`, …, `Stub.billingPortalSessions`), and `Stub.unavailable(provider?)`, every capability failing with `PaymentsUnavailable`, for an environment with no provider configured.

See the [repository README](../../README.md) for the full guide.

## License

MIT © Thomas Foster

/**
 * Stub capability layers: every call fails with one given error.
 *
 * A provider that does not implement a capability exports a stub failing with
 * `PaymentInvalidRequestError` ("… does not support …"); an environment
 * without payments configured runs against {@link unavailable}, whose every
 * call fails with {@link PaymentsUnavailable} — the same failure a provider
 * outage produces, so nothing downstream branches on whether payments are
 * wired. Building a stub layer never fails and requires nothing.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Customer from "@thomasfosterau/effect-payments/Customer";
 * import * as Stub from "@thomasfosterau/effect-payments/Stub";
 *
 * // Fails with PaymentsUnavailable.
 * const program = Customer.create({ email: "reader@example.com" }).pipe(
 *   Effect.provide(Stub.unavailable("stripe")),
 * );
 * ```
 *
 * @module
 */

import { Effect, Layer } from "effect";
import { BillingPortalSessions } from "./BillingPortal.js";
import { CheckoutSessions } from "./CheckoutSession.js";
import { Customers } from "./Customer.js";
import { PaymentIntents } from "./PaymentIntent.js";
import { type PaymentsError, PaymentsUnavailable } from "./PaymentsError.js";
import { Prices } from "./Price.js";
import { Products } from "./Product.js";
import { Refunds } from "./Refund.js";
import { Subscriptions } from "./Subscription.js";

/** The failure every call of a stub fails with (an `Effect` that fails, run on each call). */
export type Failure = Effect.Effect<never, PaymentsError>;

/** A {@link Customers} layer whose every call fails with `failure`. */
export const customers = (failure: Failure): Layer.Layer<Customers> =>
  Layer.succeed(
    Customers,
    Customers.of({
      create: () => failure,
      retrieve: () => failure,
      update: () => failure,
      del: () => failure,
      list: () => failure,
    }),
  );

/** A {@link Products} layer whose every call fails with `failure`. */
export const products = (failure: Failure): Layer.Layer<Products> =>
  Layer.succeed(
    Products,
    Products.of({
      create: () => failure,
      retrieve: () => failure,
      update: () => failure,
      del: () => failure,
      list: () => failure,
    }),
  );

/** A {@link Prices} layer whose every call fails with `failure`. */
export const prices = (failure: Failure): Layer.Layer<Prices> =>
  Layer.succeed(
    Prices,
    Prices.of({
      create: () => failure,
      retrieve: () => failure,
      update: () => failure,
      list: () => failure,
    }),
  );

/** A {@link PaymentIntents} layer whose every call fails with `failure`. */
export const paymentIntents = (failure: Failure): Layer.Layer<PaymentIntents> =>
  Layer.succeed(
    PaymentIntents,
    PaymentIntents.of({
      create: () => failure,
      retrieve: () => failure,
      update: () => failure,
      confirm: () => failure,
      cancel: () => failure,
      list: () => failure,
    }),
  );

/** A {@link Subscriptions} layer whose every call fails with `failure`. */
export const subscriptions = (failure: Failure): Layer.Layer<Subscriptions> =>
  Layer.succeed(
    Subscriptions,
    Subscriptions.of({
      create: () => failure,
      retrieve: () => failure,
      update: () => failure,
      cancel: () => failure,
      list: () => failure,
    }),
  );

/** A {@link Refunds} layer whose every call fails with `failure`. */
export const refunds = (failure: Failure): Layer.Layer<Refunds> =>
  Layer.succeed(
    Refunds,
    Refunds.of({
      create: () => failure,
      retrieve: () => failure,
      update: () => failure,
      list: () => failure,
    }),
  );

/** A {@link CheckoutSessions} layer whose every call fails with `failure`. */
export const checkoutSessions = (failure: Failure): Layer.Layer<CheckoutSessions> =>
  Layer.succeed(CheckoutSessions, CheckoutSessions.of({ create: () => failure }));

/** A {@link BillingPortalSessions} layer whose every call fails with `failure`. */
export const billingPortalSessions = (failure: Failure): Layer.Layer<BillingPortalSessions> =>
  Layer.succeed(BillingPortalSessions, BillingPortalSessions.of({ create: () => failure }));

/** Every capability the core defines. */
export type Capabilities =
  | Customers
  | Products
  | Prices
  | PaymentIntents
  | Subscriptions
  | Refunds
  | CheckoutSessions
  | BillingPortalSessions;

/** Every capability, each call failing with `failure`. */
export const layer = (failure: Failure): Layer.Layer<Capabilities> =>
  Layer.mergeAll(
    customers(failure),
    products(failure),
    prices(failure),
    paymentIntents(failure),
    subscriptions(failure),
    refunds(failure),
    checkoutSessions(failure),
    billingPortalSessions(failure),
  );

/**
 * Every capability, each call failing with {@link PaymentsUnavailable}: the
 * "not configured ≡ down" stub for an environment with no payment provider
 * configured (an unhydrated stage, a unit suite).
 */
export const unavailable = (provider?: string): Layer.Layer<Capabilities> =>
  layer(
    Effect.failSync(() =>
      provider === undefined
        ? new PaymentsUnavailable({ message: "Payments are not configured in this environment" })
        : new PaymentsUnavailable({
            message: `${provider} is not configured in this environment`,
            provider,
          }),
    ),
  );

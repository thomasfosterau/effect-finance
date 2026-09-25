/**
 * Stripe implementations of the vendor-neutral payments capabilities.
 *
 * Each capability defined by `@thomasfosterau/effect-payments` is implemented
 * here as a `Layer` backed by the Stripe SDK. The {@link layer} /
 * {@link layerFromEnv} helpers bundle the Stripe client together with every
 * capability, so a program written against the neutral core can be satisfied
 * with a single `Effect.provide`.
 *
 * @module
 */

import { Effect, Layer } from "effect";
import type Stripe from "stripe";
import {
  Customer as CustomerNS,
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  type Deleted,
  type PaymentsError,
} from "@thomasfosterau/effect-payments";
import {
  layer as clientLayer,
  layerFromEnv as clientLayerFromEnv,
  StripeService,
  type StripeConfig,
} from "./Stripe.js";
import { handleStripeError } from "./internal/index.js";
import { omitUndefined } from "./internal/omitUndefined.js";
import {
  toCustomer,
  toPage,
  toPaymentIntent,
  toPrice,
  toProduct,
  toRefund,
  toSubscription,
} from "./internal/mapping.js";

/** Run a Stripe SDK promise, mapping rejections to neutral errors. */
const run = <A>(f: () => Promise<A>): Effect.Effect<A, PaymentsError> =>
  Effect.tryPromise({ try: f, catch: handleStripeError });

const deleted = (id: string): Deleted => ({ id, deleted: true });

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link CustomerNS.Customers} capability. */
export const customersLayer: Layer.Layer<CustomerNS.Customers, never, StripeService> = Layer.effect(
  CustomerNS.Customers,
  Effect.map(StripeService, (stripe) =>
    CustomerNS.Customers.of({
      create: (params) =>
        run(() =>
          stripe.customers.create(
            omitUndefined({
              email: params.email,
              name: params.name,
              phone: params.phone,
              description: params.description,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toCustomer)),
      retrieve: (id) => run(() => stripe.customers.retrieve(id)).pipe(Effect.map(toCustomer)),
      update: (id, params) =>
        run(() =>
          stripe.customers.update(
            id,
            omitUndefined({
              email: params.email,
              name: params.name,
              phone: params.phone,
              description: params.description,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toCustomer)),
      del: (id) => run(() => stripe.customers.del(id)).pipe(Effect.map((d) => deleted(d.id))),
      list: (params) =>
        run(() =>
          stripe.customers.list(
            omitUndefined({
              limit: params?.limit,
              email: params?.email,
              starting_after: params?.startingAfter,
            }),
          ),
        ).pipe(Effect.map((list) => toPage(list, toCustomer))),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link ProductNS.Products} capability. */
export const productsLayer: Layer.Layer<ProductNS.Products, never, StripeService> = Layer.effect(
  ProductNS.Products,
  Effect.map(StripeService, (stripe) =>
    ProductNS.Products.of({
      create: (params) =>
        run(() =>
          stripe.products.create(
            omitUndefined({
              name: params.name,
              description: params.description,
              active: params.active,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toProduct)),
      retrieve: (id) => run(() => stripe.products.retrieve(id)).pipe(Effect.map(toProduct)),
      update: (id, params) =>
        run(() =>
          stripe.products.update(
            id,
            omitUndefined({
              name: params.name,
              description: params.description,
              active: params.active,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toProduct)),
      del: (id) => run(() => stripe.products.del(id)).pipe(Effect.map((d) => deleted(d.id))),
      list: (params) =>
        run(() =>
          stripe.products.list(
            omitUndefined({
              limit: params?.limit,
              active: params?.active,
              starting_after: params?.startingAfter,
            }),
          ),
        ).pipe(Effect.map((list) => toPage(list, toProduct))),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link PriceNS.Prices} capability. */
export const pricesLayer: Layer.Layer<PriceNS.Prices, never, StripeService> = Layer.effect(
  PriceNS.Prices,
  Effect.map(StripeService, (stripe) =>
    PriceNS.Prices.of({
      create: (params) =>
        run(() =>
          stripe.prices.create(
            omitUndefined({
              product: params.product,
              currency: params.currency,
              unit_amount: params.unitAmount,
              recurring: params.recurring
                ? omitUndefined({
                    interval: params.recurring.interval,
                    interval_count: params.recurring.intervalCount,
                  })
                : undefined,
              active: params.active,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toPrice)),
      retrieve: (id) => run(() => stripe.prices.retrieve(id)).pipe(Effect.map(toPrice)),
      update: (id, params) =>
        run(() =>
          stripe.prices.update(
            id,
            omitUndefined({
              active: params.active,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toPrice)),
      list: (params) =>
        run(() =>
          stripe.prices.list(
            omitUndefined({
              limit: params?.limit,
              product: params?.product,
              active: params?.active,
              starting_after: params?.startingAfter,
            }),
          ),
        ).pipe(Effect.map((list) => toPage(list, toPrice))),
    }),
  ),
);

// ---------------------------------------------------------------------------
// PaymentIntents
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link PaymentIntentNS.PaymentIntents} capability. */
export const paymentIntentsLayer: Layer.Layer<
  PaymentIntentNS.PaymentIntents,
  never,
  StripeService
> = Layer.effect(
  PaymentIntentNS.PaymentIntents,
  Effect.map(StripeService, (stripe) =>
    PaymentIntentNS.PaymentIntents.of({
      create: (params) =>
        run(() =>
          stripe.paymentIntents.create(
            omitUndefined({
              amount: params.amount,
              currency: params.currency,
              customer: params.customer,
              payment_method: params.paymentMethod,
              description: params.description,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toPaymentIntent)),
      retrieve: (id) =>
        run(() => stripe.paymentIntents.retrieve(id)).pipe(Effect.map(toPaymentIntent)),
      update: (id, params) =>
        run(() =>
          stripe.paymentIntents.update(
            id,
            omitUndefined({
              amount: params.amount,
              description: params.description,
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toPaymentIntent)),
      confirm: (id, params) =>
        run(() =>
          stripe.paymentIntents.confirm(
            id,
            omitUndefined({
              payment_method: params?.paymentMethod,
            }),
          ),
        ).pipe(Effect.map(toPaymentIntent)),
      cancel: (id) => run(() => stripe.paymentIntents.cancel(id)).pipe(Effect.map(toPaymentIntent)),
      list: (params) =>
        run(() =>
          stripe.paymentIntents.list(
            omitUndefined({
              limit: params?.limit,
              customer: params?.customer,
              starting_after: params?.startingAfter,
            }),
          ),
        ).pipe(Effect.map((list) => toPage(list, toPaymentIntent))),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link SubscriptionNS.Subscriptions} capability. */
export const subscriptionsLayer: Layer.Layer<SubscriptionNS.Subscriptions, never, StripeService> =
  Layer.effect(
    SubscriptionNS.Subscriptions,
    Effect.map(StripeService, (stripe) =>
      SubscriptionNS.Subscriptions.of({
        create: (params) =>
          run(() =>
            stripe.subscriptions.create(
              omitUndefined({
                customer: params.customer,
                items: params.items.map((item) =>
                  omitUndefined({
                    price: item.price,
                    quantity: item.quantity,
                  }),
                ),
                cancel_at_period_end: params.cancelAtPeriodEnd,
                metadata: params.metadata,
              }),
            ),
          ).pipe(Effect.map(toSubscription)),
        retrieve: (id) =>
          run(() => stripe.subscriptions.retrieve(id)).pipe(Effect.map(toSubscription)),
        update: (id, params) =>
          run(() =>
            stripe.subscriptions.update(
              id,
              omitUndefined({
                cancel_at_period_end: params.cancelAtPeriodEnd,
                metadata: params.metadata,
              }),
            ),
          ).pipe(Effect.map(toSubscription)),
        cancel: (id) => run(() => stripe.subscriptions.cancel(id)).pipe(Effect.map(toSubscription)),
        list: (params) =>
          run(() =>
            stripe.subscriptions.list(
              omitUndefined({
                limit: params?.limit,
                customer: params?.customer,
                status: params?.status,
                starting_after: params?.startingAfter,
              }),
            ),
          ).pipe(Effect.map((list) => toPage(list, toSubscription))),
      }),
    ),
  );

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/** Stripe implementation of the {@link RefundNS.Refunds} capability. */
export const refundsLayer: Layer.Layer<RefundNS.Refunds, never, StripeService> = Layer.effect(
  RefundNS.Refunds,
  Effect.map(StripeService, (stripe) =>
    RefundNS.Refunds.of({
      create: (params) =>
        run(() =>
          stripe.refunds.create(
            omitUndefined({
              payment_intent: params.paymentIntent,
              charge: params.charge,
              amount: params.amount,
              reason: params.reason as Stripe.RefundCreateParams["reason"],
              metadata: params.metadata,
            }),
          ),
        ).pipe(Effect.map(toRefund)),
      retrieve: (id) => run(() => stripe.refunds.retrieve(id)).pipe(Effect.map(toRefund)),
      update: (id, params) =>
        run(() => stripe.refunds.update(id, omitUndefined({ metadata: params.metadata }))).pipe(
          Effect.map(toRefund),
        ),
      list: (params) =>
        run(() =>
          stripe.refunds.list(
            omitUndefined({
              limit: params?.limit,
              payment_intent: params?.paymentIntent,
              charge: params?.charge,
              starting_after: params?.startingAfter,
            }),
          ),
        ).pipe(Effect.map((list) => toPage(list, toRefund))),
    }),
  ),
);

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------

/**
 * Every neutral capability implemented on top of an existing
 * {@link StripeService}. Requires a Stripe client to be provided separately.
 */
export const capabilities: Layer.Layer<
  | CustomerNS.Customers
  | ProductNS.Products
  | PriceNS.Prices
  | PaymentIntentNS.PaymentIntents
  | SubscriptionNS.Subscriptions
  | RefundNS.Refunds,
  never,
  StripeService
> = Layer.mergeAll(
  customersLayer,
  productsLayer,
  pricesLayer,
  paymentIntentsLayer,
  subscriptionsLayer,
  refundsLayer,
);

/**
 * A self-contained layer providing the Stripe client and every neutral
 * capability, built from configuration.
 */
export const layer = (config: StripeConfig) => Layer.provide(capabilities, clientLayer(config));

/**
 * A self-contained layer providing the Stripe client and every neutral
 * capability, with the client built from an environment variable.
 */
export const layerFromEnv = (envVar?: string) =>
  Layer.provide(capabilities, clientLayerFromEnv(envVar));

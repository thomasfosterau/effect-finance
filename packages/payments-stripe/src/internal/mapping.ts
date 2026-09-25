/**
 * Translation between Stripe SDK objects and vendor-neutral payments entities.
 *
 * Stripe is the source of truth here, so entities are constructed with schema
 * validation disabled — we trust the SDK's shapes rather than re-decoding them
 * on every call.
 *
 * @module
 */

import type Stripe from "stripe";
import {
  Customer as CustomerNS,
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  type Page,
} from "@thomasfosterau/effect-payments";

/** Construct entities from trusted Stripe data without re-validating. */
const TRUSTED = true;

/** Extract the id of a possibly-expanded Stripe reference. */
const idOf = (value: string | { readonly id: string } | null | undefined): string | null => {
  if (value == null) return null;
  return typeof value === "string" ? value : value.id;
};

const metadataOf = (metadata: Stripe.Metadata | null | undefined): Record<string, string> =>
  metadata ?? {};

/** Map a Stripe customer (or deleted customer) to the neutral entity. */
export const toCustomer = (
  customer: Stripe.Customer | Stripe.DeletedCustomer,
): CustomerNS.Customer => {
  if ("deleted" in customer && customer.deleted) {
    return new CustomerNS.Customer(
      {
        id: customer.id,
        email: null,
        name: null,
        phone: null,
        description: null,
        metadata: {},
        created: 0,
        livemode: false,
      },
      TRUSTED,
    );
  }
  return new CustomerNS.Customer(
    {
      id: customer.id,
      email: customer.email ?? null,
      name: customer.name ?? null,
      phone: customer.phone ?? null,
      description: customer.description ?? null,
      metadata: metadataOf(customer.metadata),
      created: customer.created,
      livemode: customer.livemode,
    },
    TRUSTED,
  );
};

/** Map a Stripe product to the neutral entity. */
export const toProduct = (product: Stripe.Product): ProductNS.Product =>
  new ProductNS.Product(
    {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      active: product.active,
      metadata: metadataOf(product.metadata),
      created: product.created,
    },
    TRUSTED,
  );

/** Map a Stripe price to the neutral entity. */
export const toPrice = (price: Stripe.Price): PriceNS.Price =>
  new PriceNS.Price(
    {
      id: price.id,
      productId: idOf(price.product),
      active: price.active,
      currency: price.currency,
      unitAmount: price.unit_amount ?? null,
      type: price.type,
      recurring: price.recurring
        ? new PriceNS.Recurring(
            {
              interval: price.recurring.interval,
              intervalCount: price.recurring.interval_count,
            },
            TRUSTED,
          )
        : null,
      metadata: metadataOf(price.metadata),
      created: price.created,
    },
    TRUSTED,
  );

/** Map a Stripe payment intent to the neutral entity. */
export const toPaymentIntent = (intent: Stripe.PaymentIntent): PaymentIntentNS.PaymentIntent =>
  new PaymentIntentNS.PaymentIntent(
    {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      customerId: idOf(intent.customer),
      paymentMethodId: idOf(intent.payment_method),
      clientSecret: intent.client_secret ?? null,
      description: intent.description ?? null,
      metadata: metadataOf(intent.metadata),
      created: intent.created,
    },
    TRUSTED,
  );

/** Map a Stripe subscription to the neutral entity. */
export const toSubscription = (subscription: Stripe.Subscription): SubscriptionNS.Subscription =>
  new SubscriptionNS.Subscription(
    {
      id: subscription.id,
      customerId: idOf(subscription.customer) ?? "",
      status: subscription.status,
      items: subscription.items.data.map(
        (item) =>
          new SubscriptionNS.SubscriptionItem(
            {
              id: item.id,
              priceId: item.price.id,
              quantity: item.quantity ?? null,
            },
            TRUSTED,
          ),
      ),
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      metadata: metadataOf(subscription.metadata),
      created: subscription.created,
    },
    TRUSTED,
  );

/** Map a Stripe refund to the neutral entity. */
export const toRefund = (refund: Stripe.Refund): RefundNS.Refund =>
  new RefundNS.Refund(
    {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: (refund.status ?? "pending") as RefundNS.RefundStatus,
      paymentIntentId: idOf(refund.payment_intent),
      chargeId: idOf(refund.charge),
      reason: refund.reason ?? null,
      metadata: metadataOf(refund.metadata),
      created: refund.created,
    },
    TRUSTED,
  );

/** Map a Stripe list response into a neutral page. */
export const toPage = <S, A>(list: Stripe.ApiList<S>, map: (value: S) => A): Page<A> => ({
  data: list.data.map(map),
  hasMore: list.has_more,
});

/**
 * Translation between PayPal API objects and vendor-neutral payments entities.
 *
 * PayPal models payments through its billing suite (catalog products, billing
 * plans, subscriptions), Orders (checkout) and Payments (captures/refunds).
 * These map onto the neutral `Products`, `Prices`, `Subscriptions`,
 * `PaymentIntents` and `Refunds` capabilities. PayPal has no first-class
 * customer resource, so this provider does not implement `Customers`.
 *
 * PayPal is the source of truth here, so entities are constructed with schema
 * validation disabled — we trust the API's shapes rather than re-decoding them.
 *
 * @module
 */

import {
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  type Page,
} from "@thomasfosterau/effect-payments";
import { toMinorUnits } from "./money.js";

/** Construct entities from trusted PayPal data without re-validating. */
const TRUSTED = true;

// ---------------------------------------------------------------------------
// Wire types (the subset of PayPal fields the neutral mapping reads)
// ---------------------------------------------------------------------------

export interface PayPalMoney {
  readonly currency_code: string;
  readonly value: string;
}

export interface PayPalProduct {
  readonly id: string;
  readonly name: string;
  readonly description?: string | null | undefined;
  readonly create_time?: string | null | undefined;
}

export interface PayPalBillingCycle {
  readonly tenure_type?: string | undefined;
  readonly frequency?: {
    readonly interval_unit?: string | undefined;
    readonly interval_count?: number | undefined;
  };
  readonly pricing_scheme?: { readonly fixed_price?: PayPalMoney } | undefined;
}

export interface PayPalPlan {
  readonly id: string;
  readonly product_id?: string | null | undefined;
  readonly status?: string | undefined;
  readonly billing_cycles?: ReadonlyArray<PayPalBillingCycle> | undefined;
  readonly create_time?: string | null | undefined;
}

export interface PayPalCapture {
  readonly id: string;
  readonly amount?: PayPalMoney | undefined;
  readonly status?: string | undefined;
}

export interface PayPalPurchaseUnit {
  readonly amount?: PayPalMoney | undefined;
  readonly description?: string | null | undefined;
  readonly custom_id?: string | null | undefined;
  readonly payments?: { readonly captures?: ReadonlyArray<PayPalCapture> } | undefined;
}

export interface PayPalOrder {
  readonly id: string;
  readonly status: string;
  readonly purchase_units?: ReadonlyArray<PayPalPurchaseUnit> | undefined;
  readonly create_time?: string | null | undefined;
}

export interface PayPalSubscription {
  readonly id: string;
  readonly status: string;
  readonly plan_id?: string | null | undefined;
  readonly custom_id?: string | null | undefined;
  readonly quantity?: string | null | undefined;
  readonly start_time?: string | null | undefined;
  readonly create_time?: string | null | undefined;
  readonly billing_info?: { readonly next_billing_time?: string | null } | undefined;
}

export interface PayPalRefund {
  readonly id: string;
  readonly status?: string | undefined;
  readonly amount?: PayPalMoney | undefined;
  readonly create_time?: string | null | undefined;
}

/** A PayPal list link, used to detect further pages. */
export interface PayPalLink {
  readonly rel: string;
  readonly href: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toEpochSeconds = (value: string | null | undefined): number => {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
};

const toInterval = (unit: string | undefined): PriceNS.RecurringInterval => {
  switch ((unit ?? "").toUpperCase()) {
    case "DAY":
      return "day";
    case "WEEK":
      return "week";
    case "YEAR":
      return "year";
    case "MONTH":
    default:
      return "month";
  }
};

/** Normalize a PayPal order status to the neutral payment status. */
export const toPaymentStatus = (status: string): PaymentIntentNS.PaymentStatus => {
  switch (status) {
    case "CREATED":
    case "SAVED":
      return "requires_confirmation";
    case "PAYER_ACTION_REQUIRED":
      return "requires_action";
    case "APPROVED":
      return "requires_capture";
    case "COMPLETED":
      return "succeeded";
    case "VOIDED":
      return "canceled";
    default:
      return "processing";
  }
};

/** Normalize a PayPal subscription status to the neutral status. */
export const toSubscriptionStatus = (status: string): SubscriptionNS.SubscriptionStatus => {
  switch (status) {
    case "ACTIVE":
      return "active";
    case "SUSPENDED":
      return "paused";
    case "CANCELLED":
      return "canceled";
    case "EXPIRED":
      return "incomplete_expired";
    case "APPROVAL_PENDING":
    case "APPROVED":
    default:
      return "incomplete";
  }
};

/** Normalize a PayPal refund status to the neutral status. */
export const toRefundStatus = (status: string | undefined): RefundNS.RefundStatus => {
  switch (status) {
    case "COMPLETED":
      return "succeeded";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "canceled";
    case "PENDING":
    default:
      return "pending";
  }
};

// ---------------------------------------------------------------------------
// Entity mappers
// ---------------------------------------------------------------------------

/** Map a PayPal catalog product to the neutral entity. */
export const toProduct = (product: PayPalProduct): ProductNS.Product =>
  new ProductNS.Product(
    {
      id: product.id,
      name: product.name,
      description: product.description ?? null,
      active: true,
      metadata: {},
      created: toEpochSeconds(product.create_time),
    },
    TRUSTED,
  );

/** Map a PayPal billing plan to the neutral price entity. */
export const toPrice = (plan: PayPalPlan): PriceNS.Price => {
  const cycle =
    plan.billing_cycles?.find((c) => c.tenure_type === "REGULAR") ?? plan.billing_cycles?.[0];
  const price = cycle?.pricing_scheme?.fixed_price;
  const currency = (price?.currency_code ?? "").toLowerCase();
  return new PriceNS.Price(
    {
      id: plan.id,
      productId: plan.product_id ?? null,
      active: plan.status === "ACTIVE",
      currency,
      unitAmount: price ? toMinorUnits(price.value, currency) : null,
      type: "recurring",
      recurring: cycle?.frequency
        ? new PriceNS.Recurring(
            {
              interval: toInterval(cycle.frequency.interval_unit),
              intervalCount: cycle.frequency.interval_count ?? 1,
            },
            TRUSTED,
          )
        : null,
      metadata: {},
      created: toEpochSeconds(plan.create_time),
    },
    TRUSTED,
  );
};

/** Map a PayPal order to the neutral payment intent entity. */
export const toPaymentIntent = (order: PayPalOrder): PaymentIntentNS.PaymentIntent => {
  const unit = order.purchase_units?.[0];
  const currency = (unit?.amount?.currency_code ?? "").toLowerCase();
  return new PaymentIntentNS.PaymentIntent(
    {
      id: order.id,
      amount: unit?.amount ? toMinorUnits(unit.amount.value, currency) : 0,
      currency,
      status: toPaymentStatus(order.status),
      customerId: unit?.custom_id ?? null,
      paymentMethodId: null,
      clientSecret: null,
      description: unit?.description ?? null,
      metadata: {},
      created: toEpochSeconds(order.create_time),
    },
    TRUSTED,
  );
};

/** Map a PayPal subscription to the neutral entity. */
export const toSubscription = (subscription: PayPalSubscription): SubscriptionNS.Subscription =>
  new SubscriptionNS.Subscription(
    {
      id: subscription.id,
      customerId: subscription.custom_id ?? "",
      status: toSubscriptionStatus(subscription.status),
      items: [
        new SubscriptionNS.SubscriptionItem(
          {
            id: subscription.id,
            priceId: subscription.plan_id ?? "",
            quantity: subscription.quantity ? Number.parseInt(subscription.quantity, 10) : null,
          },
          TRUSTED,
        ),
      ],
      currentPeriodStart: toEpochSeconds(subscription.start_time),
      currentPeriodEnd: toEpochSeconds(subscription.billing_info?.next_billing_time),
      cancelAtPeriodEnd: false,
      metadata: {},
      created: toEpochSeconds(subscription.create_time),
    },
    TRUSTED,
  );

/** Map a PayPal refund to the neutral entity. */
export const toRefund = (refund: PayPalRefund): RefundNS.Refund => {
  const currency = (refund.amount?.currency_code ?? "").toLowerCase();
  return new RefundNS.Refund(
    {
      id: refund.id,
      amount: refund.amount ? toMinorUnits(refund.amount.value, currency) : 0,
      currency,
      status: toRefundStatus(refund.status),
      paymentIntentId: null,
      chargeId: null,
      reason: null,
      metadata: {},
      created: toEpochSeconds(refund.create_time),
    },
    TRUSTED,
  );
};

/** Build a neutral page from a PayPal collection field and its links. */
export const toPage = <A>(
  items: ReadonlyArray<A>,
  links: ReadonlyArray<PayPalLink> | undefined,
): Page<A> => ({
  data: items,
  hasMore: links?.some((link) => link.rel === "next") ?? false,
});

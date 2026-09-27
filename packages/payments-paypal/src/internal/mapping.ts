/**
 * Translation between PayPal API objects and vendor-neutral payments entities.
 *
 * PayPal models payments through its billing suite (catalog products, billing
 * plans, subscriptions), Orders (checkout) and Payments (captures/refunds).
 * These map onto the neutral `Products`, `Prices`, `Subscriptions`,
 * `PaymentIntents` and `Refunds` capabilities. PayPal has no first-class
 * customer resource, so this provider does not implement `Customers`.
 *
 * Each PayPal object a capability layer reads is **decoded** with a `Schema`
 * narrowed to the fields the mapping uses — the response is not trusted, and a
 * 2xx whose body does not decode fails with {@link PaymentProviderError}
 * rather than producing an entity built from `undefined`. Unknown fields are
 * ignored. Statuses decode as strings and are normalised by the `to*Status`
 * functions below (an unrecognised one maps to a neutral fallback, as before).
 * Entities are then constructed with schema checks disabled: the vendor data
 * has just been decoded.
 *
 * @module
 */

import { Effect, Schema } from "effect";
import {
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  PaymentProviderError,
  type Page,
} from "@thomasfosterau/effect-payments";
import { PROVIDER } from "./error.js";
import { toMinorUnits } from "./money.js";

/** The vendor data was decoded just before construction. */
const TRUSTED: Schema.MakeOptions = { disableChecks: true };

// ---------------------------------------------------------------------------
// Wire shapes (the subset of PayPal fields the neutral mapping reads)
// ---------------------------------------------------------------------------

/** An optional, nullable field. */
const Maybe = <S extends Schema.Top>(schema: S) => Schema.optional(Schema.NullOr(schema));

/** A major-unit decimal string, e.g. `"10.00"`. */
const Decimal = Schema.String.check(Schema.isPattern(/^-?\d+(\.\d+)?$/));

const PayPalMoney = Schema.Struct({
  currency_code: Schema.String,
  value: Decimal,
});

const PayPalProduct = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Maybe(Schema.String),
  create_time: Maybe(Schema.String),
});

const PayPalBillingCycle = Schema.Struct({
  tenure_type: Maybe(Schema.String),
  frequency: Maybe(
    Schema.Struct({
      interval_unit: Maybe(Schema.String),
      interval_count: Maybe(Schema.Finite),
    }),
  ),
  pricing_scheme: Maybe(Schema.Struct({ fixed_price: Maybe(PayPalMoney) })),
});

const PayPalPlan = Schema.Struct({
  id: Schema.String,
  product_id: Maybe(Schema.String),
  status: Maybe(Schema.String),
  billing_cycles: Maybe(Schema.Array(PayPalBillingCycle)),
  create_time: Maybe(Schema.String),
});

const PayPalCapture = Schema.Struct({
  id: Schema.String,
  amount: Maybe(PayPalMoney),
  status: Maybe(Schema.String),
});

const PayPalPurchaseUnit = Schema.Struct({
  amount: Maybe(PayPalMoney),
  description: Maybe(Schema.String),
  custom_id: Maybe(Schema.String),
  payments: Maybe(Schema.Struct({ captures: Maybe(Schema.Array(PayPalCapture)) })),
});

const PayPalOrder = Schema.Struct({
  id: Schema.String,
  status: Schema.String,
  purchase_units: Maybe(Schema.Array(PayPalPurchaseUnit)),
  create_time: Maybe(Schema.String),
});

const PayPalSubscription = Schema.Struct({
  id: Schema.String,
  status: Schema.String,
  plan_id: Maybe(Schema.String),
  custom_id: Maybe(Schema.String),
  quantity: Maybe(Schema.String),
  start_time: Maybe(Schema.String),
  create_time: Maybe(Schema.String),
  billing_info: Maybe(Schema.Struct({ next_billing_time: Maybe(Schema.String) })),
});

const PayPalRefund = Schema.Struct({
  id: Schema.String,
  status: Maybe(Schema.String),
  amount: Maybe(PayPalMoney),
  create_time: Maybe(Schema.String),
});

/** A PayPal list link, used to detect further pages. */
const PayPalLinks = Maybe(Schema.Array(Schema.Struct({ rel: Schema.String })));

const PayPalProductList = Schema.Struct({
  products: Schema.Array(PayPalProduct),
  links: PayPalLinks,
});

const PayPalPlanList = Schema.Struct({
  plans: Schema.Array(PayPalPlan),
  links: PayPalLinks,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toEpochSeconds = (value: string | null | undefined): number => {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
};

const toInterval = (unit: string | null | undefined): PriceNS.RecurringInterval => {
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
export const toRefundStatus = (status: string | null | undefined): RefundNS.RefundStatus => {
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
const toProduct = (product: typeof PayPalProduct.Type): ProductNS.Product =>
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
const toPrice = (plan: typeof PayPalPlan.Type): PriceNS.Price => {
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
const toPaymentIntent = (order: typeof PayPalOrder.Type): PaymentIntentNS.PaymentIntent => {
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
const toSubscription = (
  subscription: typeof PayPalSubscription.Type,
): SubscriptionNS.Subscription =>
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
const toRefund = (refund: typeof PayPalRefund.Type): RefundNS.Refund => {
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

/** A neutral page from a PayPal collection and its links. */
const toPage = <A>(
  items: ReadonlyArray<A>,
  links: ReadonlyArray<{ readonly rel: string }> | null | undefined,
): Page<A> => ({
  data: items,
  hasMore: links?.some((link) => link.rel === "next") ?? false,
});

// ---------------------------------------------------------------------------
// Decoders
// ---------------------------------------------------------------------------

const malformed = (what: string, cause: unknown): PaymentProviderError =>
  new PaymentProviderError({
    message: `PayPal returned a malformed ${what} response`,
    provider: PROVIDER,
    cause,
  });

/**
 * Decode a response body with `schema` and map it, failing with
 * {@link PaymentProviderError} when it does not decode.
 */
const decoder =
  <S extends Schema.Codec<unknown, unknown>, A>(
    what: string,
    schema: S,
    map: (value: S["Type"]) => A,
  ) =>
  (body: unknown): Effect.Effect<A, PaymentProviderError> =>
    Schema.decodeUnknownEffect(schema)(body).pipe(
      Effect.mapError((cause) => malformed(what, cause)),
      Effect.map(map),
    );

/** A catalog product. */
export const decodeProduct = decoder("product", PayPalProduct, toProduct);
/** A page of catalog products. */
export const decodeProductPage = decoder("product list", PayPalProductList, (list) =>
  toPage(list.products.map(toProduct), list.links),
);
/** A billing plan, as a neutral price. */
export const decodePrice = decoder("plan", PayPalPlan, toPrice);
/** A page of billing plans, as neutral prices. */
export const decodePricePage = decoder("plan list", PayPalPlanList, (list) =>
  toPage(list.plans.map(toPrice), list.links),
);
/** An order, as a neutral payment intent. */
export const decodePaymentIntent = decoder("order", PayPalOrder, toPaymentIntent);
/** The id of an order's first capture, if it has been captured. */
export const decodeOrderCaptureId = decoder(
  "order",
  PayPalOrder,
  (order) => order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null,
);
/** The currency of a capture, if it carries an amount. */
export const decodeCaptureCurrency = decoder(
  "capture",
  PayPalCapture,
  (capture) => capture.amount?.currency_code ?? null,
);
/** A subscription. */
export const decodeSubscription = decoder("subscription", PayPalSubscription, toSubscription);
/** A capture refund. */
export const decodeRefund = decoder("refund", PayPalRefund, toRefund);

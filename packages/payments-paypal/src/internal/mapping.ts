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
 * 2xx whose body does not decode fails with `PaymentProviderError`
 * rather than producing an entity built from `undefined`. Unknown fields are
 * ignored. Statuses decode as strings and are normalised by the `to*Status`
 * functions below; a status they do not recognise becomes `Enumeration.Other`
 * carrying the raw string, so it never fails an object or a list page.
 * Entities are then constructed with schema checks disabled: the vendor data
 * has just been decoded.
 *
 * @module
 */

import * as Match from "effect/Match";
import * as Schema from "effect/Schema";
import {
  Enumeration,
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  type Page,
} from "@thomasfosterau/effect-payments";
import { epochSecondsOf, responseDecoder } from "@thomasfosterau/effect-payments/internal";
import { PROVIDER } from "./error.js";
import { exponent, parseMinorUnits, toMinorUnits } from "./money.js";

/** The vendor data was decoded just before construction. */
const TRUSTED: Schema.MakeOptions = { disableChecks: true };

// ---------------------------------------------------------------------------
// Wire shapes (the subset of PayPal fields the neutral mapping reads)
// ---------------------------------------------------------------------------

/** An optional, nullable field. */
const Maybe = <S extends Schema.Top>(schema: S) => Schema.optional(Schema.NullOr(schema));

/** A major-unit decimal string, e.g. `"10.00"`. */
const Decimal = Schema.String.check(Schema.isPattern(/^-?\d+(\.\d+)?$/));

/**
 * A PayPal `Money` object. The value is checked against its currency: more
 * fraction digits than the currency allows (e.g. `"10.005"` USD, `"10.5"`
 * HUF), or an amount beyond the safe-integer range in minor units, fails the
 * decode rather than being rounded.
 */
const PayPalMoney = Schema.Struct({
  currency_code: Schema.String,
  value: Decimal,
}).check(
  Schema.makeFilter(
    (money) =>
      parseMinorUnits(money.value, money.currency_code) !== undefined ||
      `value must have at most ${exponent(money.currency_code)} fraction digits for ${money.currency_code} and fit a safe integer in minor units`,
    {
      identifier: "PayPalMoneyAmount",
      title: "PayPal money amount",
      description:
        "A decimal value with no more fraction digits than its currency allows, within the safe-integer range in minor units",
    },
  ),
);

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
      interval_count: Maybe(Schema.Int.check(Schema.isGreaterThan(0))),
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
  /** A whole number, sent by PayPal as a string. */
  quantity: Maybe(Schema.String.check(Schema.isPattern(/^\d+$/))),
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
  /** Absent on an empty page. */
  products: Maybe(Schema.Array(PayPalProduct)),
  links: PayPalLinks,
});

const PayPalPlanList = Schema.Struct({
  /** Absent on an empty page. */
  plans: Maybe(Schema.Array(PayPalPlan)),
  links: PayPalLinks,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const toInterval = (unit: string | null | undefined): PriceNS.RecurringInterval =>
  Match.value((unit ?? "").toUpperCase()).pipe(
    Match.withReturnType<PriceNS.RecurringInterval>(),
    Match.when("DAY", () => "day"),
    Match.when("WEEK", () => "week"),
    Match.when("YEAR", () => "year"),
    Match.whenOr("MONTH", "", () => "month"),
    Match.orElse(() => Enumeration.other(unit ?? "")),
  );

/** Normalize a PayPal order status to the neutral payment status. */
const toPaymentStatus = (status: string): PaymentIntentNS.PaymentStatus =>
  Match.value(status).pipe(
    Match.withReturnType<PaymentIntentNS.PaymentStatus>(),
    Match.whenOr("CREATED", "SAVED", () => "requires_confirmation"),
    Match.when("PAYER_ACTION_REQUIRED", () => "requires_action"),
    Match.when("APPROVED", () => "requires_capture"),
    Match.when("COMPLETED", () => "succeeded"),
    Match.when("VOIDED", () => "canceled"),
    Match.orElse(Enumeration.other),
  );

/** Normalize a PayPal subscription status to the neutral status. */
const toSubscriptionStatus = (status: string): SubscriptionNS.SubscriptionStatus =>
  Match.value(status).pipe(
    Match.withReturnType<SubscriptionNS.SubscriptionStatus>(),
    Match.when("ACTIVE", () => "active"),
    Match.when("SUSPENDED", () => "paused"),
    Match.when("CANCELLED", () => "canceled"),
    Match.when("EXPIRED", () => "incomplete_expired"),
    Match.whenOr("APPROVAL_PENDING", "APPROVED", () => "incomplete"),
    Match.orElse(Enumeration.other),
  );

/** Normalize a PayPal refund status to the neutral status. */
const toRefundStatus = (status: string | null | undefined): RefundNS.RefundStatus =>
  Match.value(status).pipe(
    Match.withReturnType<RefundNS.RefundStatus>(),
    Match.when("COMPLETED", () => "succeeded"),
    Match.when("FAILED", () => "failed"),
    Match.when("CANCELLED", () => "canceled"),
    Match.whenOr("PENDING", Match.null, Match.undefined, () => "pending"),
    Match.orElse(Enumeration.other),
  );

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
      created: epochSecondsOf(product.create_time),
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
      created: epochSecondsOf(plan.create_time),
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
      created: epochSecondsOf(order.create_time),
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
      currentPeriodStart: epochSecondsOf(subscription.start_time),
      currentPeriodEnd: epochSecondsOf(subscription.billing_info?.next_billing_time),
      cancelAtPeriodEnd: false,
      metadata: {},
      created: epochSecondsOf(subscription.create_time),
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
      created: epochSecondsOf(refund.create_time),
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

/**
 * Decode a response body with `schema` and map it, failing with
 * `PaymentProviderError` when it does not decode.
 */
const decoder = /* @__PURE__ */ responseDecoder({ provider: PROVIDER, name: "PayPal" });

/** A catalog product. */
export const decodeProduct = decoder("product", PayPalProduct, toProduct);
/** A page of catalog products. */
export const decodeProductPage = decoder("product list", PayPalProductList, (list) =>
  toPage((list.products ?? []).map(toProduct), list.links),
);
/** A billing plan, as a neutral price. */
export const decodePrice = decoder("plan", PayPalPlan, toPrice);
/** A page of billing plans, as neutral prices. */
export const decodePricePage = decoder("plan list", PayPalPlanList, (list) =>
  toPage((list.plans ?? []).map(toPrice), list.links),
);
/** An order, as a neutral payment intent. */
export const decodePaymentIntent = decoder("order", PayPalOrder, toPaymentIntent);
/** The id of an order's first capture, if it has been captured. */
export const decodeOrderCaptureId = decoder(
  "order",
  PayPalOrder,
  (order) => order.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null,
);
/**
 * The currency of a capture. A partial refund needs it to format the amount,
 * so a capture without an amount is malformed rather than defaulted.
 */
export const decodeCaptureCurrency = decoder(
  "capture",
  Schema.Struct({ id: Schema.String, amount: PayPalMoney }),
  (capture) => capture.amount.currency_code,
);
/** A subscription. */
export const decodeSubscription = decoder("subscription", PayPalSubscription, toSubscription);
/** A capture refund. */
export const decodeRefund = decoder("refund", PayPalRefund, toRefund);

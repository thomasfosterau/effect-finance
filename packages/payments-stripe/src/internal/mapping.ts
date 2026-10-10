/**
 * Translation between Stripe's wire objects and vendor-neutral payments
 * entities.
 *
 * Each Stripe object a capability layer reads is **decoded** with a `Schema`
 * narrowed to the fields the mapping uses. The response comes back from
 * Distilled's operations unchecked (lenient validation, `StripeHttp`), and at
 * whatever API version the layer is configured with, so it is not trusted: a
 * 2xx whose body does not decode fails with {@link PaymentProviderError}
 * rather than producing an entity built from `undefined`. Unknown fields are
 * ignored, so a newer API version adding fields does not break decoding.
 * Entities are then constructed with schema checks disabled: the vendor data
 * has just been decoded.
 *
 * **Enumerations are lenient.** A status or type (`PaymentStatus`,
 * `SubscriptionStatus`, `RefundStatus`, the price `type` and recurring
 * `interval`) decodes through `Enumeration.fromWire`: a value in the neutral
 * literal set stays that literal, and a value Stripe adds later becomes
 * `Enumeration.Other` carrying the raw string, so one unrecognised value never
 * fails an object or a whole list page.
 *
 * @module
 */

import { Effect, Predicate, Redacted, Schema } from "effect";
import {
  Enumeration,
  Customer as CustomerNS,
  Product as ProductNS,
  Price as PriceNS,
  PaymentIntent as PaymentIntentNS,
  Subscription as SubscriptionNS,
  Refund as RefundNS,
  CheckoutSession as CheckoutSessionNS,
  BillingPortal as BillingPortalNS,
  PaymentProviderError,
  type Page,
} from "@thomasfosterau/effect-payments";
import { PROVIDER } from "./error.js";

/**
 * The failure for a 2xx whose body is not the shape a mapping reads:
 * {@link PaymentProviderError} naming the response (`what`), with the decode
 * failure as its cause.
 */
export const malformed = (what: string, cause?: unknown): PaymentProviderError =>
  new PaymentProviderError({
    message: `Stripe returned a malformed ${what} response`,
    provider: PROVIDER,
    cause,
  });

/** The vendor data was decoded just before construction. */
const TRUSTED: Schema.MakeOptions = { disableChecks: true };

// ---------------------------------------------------------------------------
// Wire shapes
// ---------------------------------------------------------------------------

/** A reference Stripe may return as an id or, when expanded, as the object. */
const Ref = Schema.Union([Schema.String, Schema.Struct({ id: Schema.String })]);

/** An optional, nullable field. */
const Maybe = <S extends Schema.Top>(schema: S) => Schema.optional(Schema.NullOr(schema));

const Metadata = Maybe(Schema.Record(Schema.String, Schema.String));

/**
 * A secret Distilled hands back wrapped in `Redacted` (it marks a payment
 * intent's `client_secret` sensitive), or the plain string the wire carried.
 */
const Secret = Schema.Union([
  Schema.String,
  Schema.declare(
    (value): value is Redacted.Redacted<string> =>
      Redacted.isRedacted(value) && Predicate.isString(Redacted.value(value)),
  ),
]);

/** The string a {@link Secret} holds. */
const revealed = (secret: typeof Secret.Type | null | undefined): string | null => {
  if (secret == null) return null;
  return Redacted.isRedacted(secret) ? Redacted.value(secret) : secret;
};

/** `{ id, deleted: true }` — Stripe's answer to a delete, and to reading a deleted object. */
const StripeDeleted = Schema.Struct({ id: Schema.String, deleted: Schema.Literal(true) });

const StripeCustomer = Schema.Struct({
  id: Schema.String,
  email: Maybe(Schema.String),
  name: Maybe(Schema.String),
  phone: Maybe(Schema.String),
  description: Maybe(Schema.String),
  metadata: Metadata,
  created: Schema.Number,
  livemode: Schema.Boolean,
});

/** A customer read back may be the deleted stub. */
const StripeCustomerOrDeleted = Schema.Union([StripeDeleted, StripeCustomer]);

const StripeProduct = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Maybe(Schema.String),
  active: Schema.Boolean,
  metadata: Metadata,
  created: Schema.Number,
});

const StripePrice = Schema.Struct({
  id: Schema.String,
  product: Maybe(Ref),
  active: Schema.Boolean,
  currency: Schema.String,
  unit_amount: Maybe(Schema.Number),
  type: Enumeration.fromWire(PriceNS.KnownPriceType),
  recurring: Maybe(
    Schema.Struct({
      interval: Enumeration.fromWire(PriceNS.KnownRecurringInterval),
      interval_count: Schema.Number,
    }),
  ),
  metadata: Metadata,
  created: Schema.Number,
});

const StripePaymentIntent = Schema.Struct({
  id: Schema.String,
  amount: Schema.Number,
  currency: Schema.String,
  status: Enumeration.fromWire(PaymentIntentNS.KnownPaymentStatus),
  customer: Maybe(Ref),
  payment_method: Maybe(Ref),
  client_secret: Maybe(Secret),
  description: Maybe(Schema.String),
  metadata: Metadata,
  created: Schema.Number,
});

/**
 * A subscription. The billing period moved from the subscription onto its
 * items in API version 2025-03-31 ("basil"); both are decoded and the first
 * item's period is preferred, so the mapping holds on either side of that
 * version.
 */
const StripeSubscription = Schema.Struct({
  id: Schema.String,
  customer: Ref,
  status: Enumeration.fromWire(SubscriptionNS.KnownSubscriptionStatus),
  items: Schema.Struct({
    data: Schema.Array(
      Schema.Struct({
        id: Schema.String,
        price: Schema.Struct({ id: Schema.String }),
        quantity: Maybe(Schema.Number),
        current_period_start: Maybe(Schema.Number),
        current_period_end: Maybe(Schema.Number),
      }),
    ),
  }),
  current_period_start: Maybe(Schema.Number),
  current_period_end: Maybe(Schema.Number),
  cancel_at_period_end: Schema.Boolean,
  metadata: Metadata,
  created: Schema.Number,
});

const StripeRefund = Schema.Struct({
  id: Schema.String,
  amount: Schema.Number,
  currency: Schema.String,
  status: Maybe(Enumeration.fromWire(RefundNS.KnownRefundStatus)),
  payment_intent: Maybe(Ref),
  charge: Maybe(Ref),
  reason: Maybe(Schema.String),
  metadata: Metadata,
  created: Schema.Number,
});

/**
 * A `checkout.session` or `billing_portal.session`, narrowed to its id and the
 * redirect URL. `url` is required and non-empty: a session with nothing to redirect to is
 * useless to the caller (a checkout session only has one in hosted mode, the
 * only mode the neutral capability creates), so a missing or `null` one fails
 * the decode rather than pushing that branch into every call site.
 */
const StripeHostedSession = Schema.Struct({ id: Schema.String, url: Schema.NonEmptyString });

/** A list page: `{ object: "list", data, has_more }`. */
const StripeList = <S extends Schema.Top>(item: S) =>
  Schema.Struct({ data: Schema.Array(item), has_more: Schema.Boolean });

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

/** The id of a possibly-expanded reference. */
const idOf = (value: typeof Ref.Type | null | undefined): string | null => {
  if (value == null) return null;
  return Predicate.isString(value) ? value : value.id;
};

const metadataOf = (metadata: typeof Metadata.Type) => ({
  ...metadata,
});

const toCustomer = (customer: typeof StripeCustomerOrDeleted.Type): CustomerNS.Customer => {
  if ("deleted" in customer) {
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

const toProduct = (product: typeof StripeProduct.Type): ProductNS.Product =>
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

const toPrice = (price: typeof StripePrice.Type): PriceNS.Price =>
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

const toPaymentIntent = (intent: typeof StripePaymentIntent.Type): PaymentIntentNS.PaymentIntent =>
  new PaymentIntentNS.PaymentIntent(
    {
      id: intent.id,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
      customerId: idOf(intent.customer),
      paymentMethodId: idOf(intent.payment_method),
      clientSecret: revealed(intent.client_secret),
      description: intent.description ?? null,
      metadata: metadataOf(intent.metadata),
      created: intent.created,
    },
    TRUSTED,
  );

/**
 * A subscription's entity, or `undefined` when it carries no billing period
 * on its first item or on itself — a shape no API version produces.
 */
const toSubscription = (
  subscription: typeof StripeSubscription.Type,
): SubscriptionNS.Subscription | undefined => {
  const first = subscription.items.data[0];
  const start = first?.current_period_start ?? subscription.current_period_start;
  const end = first?.current_period_end ?? subscription.current_period_end;
  if (start == null || end == null) return undefined;
  return new SubscriptionNS.Subscription(
    {
      id: subscription.id,
      customerId: idOf(subscription.customer) ?? "",
      status: subscription.status,
      items: subscription.items.data.map(
        (item) =>
          new SubscriptionNS.SubscriptionItem(
            { id: item.id, priceId: item.price.id, quantity: item.quantity ?? null },
            TRUSTED,
          ),
      ),
      currentPeriodStart: start,
      currentPeriodEnd: end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      metadata: metadataOf(subscription.metadata),
      created: subscription.created,
    },
    TRUSTED,
  );
};

const toRefund = (refund: typeof StripeRefund.Type): RefundNS.Refund =>
  new RefundNS.Refund(
    {
      id: refund.id,
      amount: refund.amount,
      currency: refund.currency,
      status: refund.status ?? "pending",
      paymentIntentId: idOf(refund.payment_intent),
      chargeId: idOf(refund.charge),
      reason: refund.reason ?? null,
      metadata: metadataOf(refund.metadata),
      created: refund.created,
    },
    TRUSTED,
  );

const toCheckoutSession = (
  session: typeof StripeHostedSession.Type,
): CheckoutSessionNS.CheckoutSession =>
  new CheckoutSessionNS.CheckoutSession({ id: session.id, url: session.url }, TRUSTED);

const toBillingPortalSession = (
  session: typeof StripeHostedSession.Type,
): BillingPortalNS.BillingPortalSession =>
  new BillingPortalNS.BillingPortalSession({ id: session.id, url: session.url }, TRUSTED);

// ---------------------------------------------------------------------------
// Decoders
// ---------------------------------------------------------------------------

/**
 * Decode a response body with `schema` and map it, failing with
 * {@link PaymentProviderError} when it does not decode or does not map.
 */
const decoder =
  <S extends Schema.Codec<unknown, unknown>, A>(
    what: string,
    schema: S,
    map: (value: S["Type"]) => A | undefined,
  ) =>
  (body: unknown): Effect.Effect<A, PaymentProviderError> =>
    Schema.decodeUnknownEffect(schema)(body).pipe(
      Effect.mapError((cause) => malformed(what, cause)),
      Effect.flatMap((value) => {
        const mapped = map(value);
        return mapped === undefined ? Effect.fail(malformed(what)) : Effect.succeed(mapped);
      }),
    );

/** Decode a list page and map every item, as a neutral page. */
const pageDecoder = <S extends Schema.Codec<unknown, unknown>, A>(
  what: string,
  item: S,
  map: (value: S["Type"]) => A | undefined,
) =>
  decoder(`${what} list`, StripeList(item), (list): Page<A> | undefined => {
    const data = list.data.map(map);
    return data.every((value): value is A => value !== undefined)
      ? { data, hasMore: list.has_more }
      : undefined;
  });

/** A customer (or the deleted stub, read back). */
export const decodeCustomer = decoder("customer", StripeCustomerOrDeleted, toCustomer);
/** A page of customers. */
export const decodeCustomerPage = pageDecoder("customer", StripeCustomer, toCustomer);
/** The `{ id, deleted: true }` answer to a delete. */
export const decodeDeleted = decoder("deletion", StripeDeleted, (deleted) => ({
  id: deleted.id,
  deleted: true as const,
}));
/** A product. */
export const decodeProduct = decoder("product", StripeProduct, toProduct);
/** A page of products. */
export const decodeProductPage = pageDecoder("product", StripeProduct, toProduct);
/** A price. */
export const decodePrice = decoder("price", StripePrice, toPrice);
/** A page of prices. */
export const decodePricePage = pageDecoder("price", StripePrice, toPrice);
/** A payment intent. */
export const decodePaymentIntent = decoder("payment intent", StripePaymentIntent, toPaymentIntent);
/** A page of payment intents. */
export const decodePaymentIntentPage = pageDecoder(
  "payment intent",
  StripePaymentIntent,
  toPaymentIntent,
);
/** A subscription. */
export const decodeSubscription = decoder("subscription", StripeSubscription, toSubscription);
/** A page of subscriptions. */
export const decodeSubscriptionPage = pageDecoder(
  "subscription",
  StripeSubscription,
  toSubscription,
);
/** A refund. */
export const decodeRefund = decoder("refund", StripeRefund, toRefund);
/** A page of refunds. */
export const decodeRefundPage = pageDecoder("refund", StripeRefund, toRefund);
/** A checkout session. */
export const decodeCheckoutSession = decoder(
  "checkout session",
  StripeHostedSession,
  toCheckoutSession,
);
/** A billing portal session. */
export const decodeBillingPortalSession = decoder(
  "billing portal session",
  StripeHostedSession,
  toBillingPortalSession,
);

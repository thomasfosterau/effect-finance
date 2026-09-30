/**
 * Translation between Airwallex API objects and vendor-neutral payments
 * entities.
 *
 * Each Airwallex object a capability layer reads is **decoded** with a
 * `Schema` narrowed to the fields the mapping uses — the response is not
 * trusted, and a 2xx whose body does not decode fails with
 * {@link PaymentProviderError} rather than producing an entity built from
 * `undefined`. Unknown fields are ignored. Statuses decode as strings and are
 * normalised by the `to*Status` functions below; a status they do not
 * recognise becomes `Enumeration.Other` carrying the raw string, so it never
 * fails an object or a list page. Entities are then constructed with schema
 * checks disabled: the vendor data has just been decoded.
 *
 * @module
 */

import { Effect, Schema } from "effect";
import {
  Enumeration,
  Customer as CustomerNS,
  PaymentIntent as PaymentIntentNS,
  Refund as RefundNS,
  PaymentProviderError,
  type Page,
} from "@thomasfosterau/effect-payments";
import { PROVIDER } from "./error.js";
import { exponent, parseMinorUnits, toMinorUnits } from "./money.js";

/** The vendor data was decoded just before construction. */
const TRUSTED: Schema.MakeOptions = { disableChecks: true };

// ---------------------------------------------------------------------------
// Wire shapes (the subset of Airwallex fields the neutral mapping reads)
// ---------------------------------------------------------------------------

/** An optional, nullable field. */
const Maybe = <S extends Schema.Top>(schema: S) => Schema.optional(Schema.NullOr(schema));

/**
 * An Airwallex amount (a major-unit JSON number) checked against its currency:
 * more fraction digits than the currency allows (e.g. `10.005` USD), or an
 * amount beyond the safe-integer range in minor units, fails the decode rather
 * than being rounded.
 */
const amountInCurrency = Schema.makeFilter(
  (money: { readonly amount: number; readonly currency: string }) =>
    parseMinorUnits(money.amount, money.currency) !== undefined ||
    `amount must have at most ${exponent(money.currency)} fraction digits for ${money.currency} and fit a safe integer in minor units`,
  {
    identifier: "AirwallexAmount",
    title: "Airwallex amount",
    description:
      "A major-unit amount with no more fraction digits than its currency allows, within the safe-integer range in minor units",
  },
);

/** Metadata values of any type decode; only the string ones are kept. */
const Metadata = Maybe(Schema.Record(Schema.String, Schema.Unknown));

const AirwallexCustomer = Schema.Struct({
  id: Schema.String,
  email: Maybe(Schema.String),
  first_name: Maybe(Schema.String),
  last_name: Maybe(Schema.String),
  phone_number: Maybe(Schema.String),
  metadata: Metadata,
  created_at: Maybe(Schema.String),
});

const AirwallexPaymentIntent = Schema.Struct({
  id: Schema.String,
  amount: Schema.Finite,
  currency: Schema.String,
  status: Schema.String,
  customer_id: Maybe(Schema.String),
  payment_method_id: Maybe(Schema.String),
  client_secret: Maybe(Schema.String),
  descriptor: Maybe(Schema.String),
  metadata: Metadata,
  created_at: Maybe(Schema.String),
}).check(amountInCurrency);

const AirwallexRefund = Schema.Struct({
  id: Schema.String,
  amount: Schema.Finite,
  currency: Schema.String,
  status: Schema.String,
  payment_intent_id: Maybe(Schema.String),
  reason: Maybe(Schema.String),
  metadata: Metadata,
  created_at: Maybe(Schema.String),
}).check(amountInCurrency);

/** An Airwallex list response. */
const AirwallexList = <S extends Schema.Top>(item: S) =>
  Schema.Struct({ items: Schema.Array(item), has_more: Schema.Boolean });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse an Airwallex ISO-8601 timestamp into Unix seconds. */
const toEpochSeconds = (value: string | null | undefined): number => {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : Math.floor(ms / 1000);
};

const composeName = (
  first: string | null | undefined,
  last: string | null | undefined,
): string | null => {
  const name = [first, last].filter((part) => !!part).join(" ");
  return name.length > 0 ? name : null;
};

const metadataOf = (metadata: typeof Metadata.Type): Record<string, string> =>
  Object.fromEntries(
    Object.entries(metadata ?? {}).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );

/** Normalize an Airwallex payment intent status to the neutral status. */
export const toPaymentStatus = (status: string): PaymentIntentNS.PaymentStatus => {
  switch (status) {
    case "REQUIRES_PAYMENT_METHOD":
      return "requires_payment_method";
    case "REQUIRES_CUSTOMER_ACTION":
      return "requires_action";
    case "REQUIRES_CAPTURE":
      return "requires_capture";
    case "SUCCEEDED":
      return "succeeded";
    case "CANCELLED":
      return "canceled";
    case "PENDING":
    case "RECEIVED":
      return "processing";
    default:
      return Enumeration.other(status);
  }
};

/** Normalize an Airwallex refund status to the neutral status. */
export const toRefundStatus = (status: string): RefundNS.RefundStatus => {
  switch (status) {
    case "SUCCEEDED":
      return "succeeded";
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "canceled";
    case "RECEIVED":
    case "ACCEPTED":
    case "PENDING":
      return "pending";
    default:
      return Enumeration.other(status);
  }
};

// ---------------------------------------------------------------------------
// Entity mappers
// ---------------------------------------------------------------------------

/** Map an Airwallex customer to the neutral entity. */
const toCustomer = (customer: typeof AirwallexCustomer.Type): CustomerNS.Customer =>
  new CustomerNS.Customer(
    {
      id: customer.id,
      email: customer.email ?? null,
      name: composeName(customer.first_name, customer.last_name),
      phone: customer.phone_number ?? null,
      description: null,
      metadata: metadataOf(customer.metadata),
      created: toEpochSeconds(customer.created_at),
      livemode: false,
    },
    TRUSTED,
  );

/** Map an Airwallex payment intent to the neutral entity. */
const toPaymentIntent = (
  intent: typeof AirwallexPaymentIntent.Type,
): PaymentIntentNS.PaymentIntent =>
  new PaymentIntentNS.PaymentIntent(
    {
      id: intent.id,
      amount: toMinorUnits(intent.amount, intent.currency),
      currency: intent.currency.toLowerCase(),
      status: toPaymentStatus(intent.status),
      customerId: intent.customer_id ?? null,
      paymentMethodId: intent.payment_method_id ?? null,
      clientSecret: intent.client_secret ?? null,
      description: intent.descriptor ?? null,
      metadata: metadataOf(intent.metadata),
      created: toEpochSeconds(intent.created_at),
    },
    TRUSTED,
  );

/** Map an Airwallex refund to the neutral entity. */
const toRefund = (refund: typeof AirwallexRefund.Type): RefundNS.Refund =>
  new RefundNS.Refund(
    {
      id: refund.id,
      amount: toMinorUnits(refund.amount, refund.currency),
      currency: refund.currency.toLowerCase(),
      status: toRefundStatus(refund.status),
      paymentIntentId: refund.payment_intent_id ?? null,
      chargeId: null,
      reason: refund.reason ?? null,
      metadata: metadataOf(refund.metadata),
      created: toEpochSeconds(refund.created_at),
    },
    TRUSTED,
  );

// ---------------------------------------------------------------------------
// Decoders
// ---------------------------------------------------------------------------

const malformed = (what: string, cause: unknown): PaymentProviderError =>
  new PaymentProviderError({
    message: `Airwallex returned a malformed ${what} response`,
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

/** Decode a list response and map every item, as a neutral page. */
const pageDecoder = <S extends Schema.Codec<unknown, unknown>, A>(
  what: string,
  item: S,
  map: (value: S["Type"]) => A,
) =>
  decoder(`${what} list`, AirwallexList(item), (list): Page<A> => ({
    data: list.items.map(map),
    hasMore: list.has_more,
  }));

/** A customer. */
export const decodeCustomer = decoder("customer", AirwallexCustomer, toCustomer);
/** A page of customers. */
export const decodeCustomerPage = pageDecoder("customer", AirwallexCustomer, toCustomer);
/** A payment intent. */
export const decodePaymentIntent = decoder(
  "payment intent",
  AirwallexPaymentIntent,
  toPaymentIntent,
);
/** A page of payment intents. */
export const decodePaymentIntentPage = pageDecoder(
  "payment intent",
  AirwallexPaymentIntent,
  toPaymentIntent,
);
/** The currency of a payment intent. */
export const decodePaymentIntentCurrency = decoder(
  "payment intent",
  AirwallexPaymentIntent,
  (intent) => intent.currency,
);
/** A refund. */
export const decodeRefund = decoder("refund", AirwallexRefund, toRefund);
/** A page of refunds. */
export const decodeRefundPage = pageDecoder("refund", AirwallexRefund, toRefund);

/**
 * Translation between Airwallex API objects and vendor-neutral payments
 * entities.
 *
 * Each Airwallex object a capability layer reads is **decoded** with a
 * `Schema` narrowed to the fields the mapping uses — the response is not
 * trusted, and a 2xx whose body does not decode fails with
 * `PaymentProviderError` rather than producing an entity built from
 * `undefined`. Unknown fields are ignored. Statuses decode as strings and are
 * normalised by the `to*Status` functions below; a status they do not
 * recognise becomes `Enumeration.Other` carrying the raw string, so it never
 * fails an object or a list page. Entities are then constructed with schema
 * checks disabled: the vendor data has just been decoded.
 *
 * @module
 */

import * as Arr from "effect/Array";
import * as Match from "effect/Match";
import * as Predicate from "effect/Predicate";
import * as R from "effect/Record";
import * as Schema from "effect/Schema";
import {
  Enumeration,
  Customer as CustomerNS,
  PaymentIntent as PaymentIntentNS,
  Refund as RefundNS,
  type Page,
} from "@thomasfosterau/effect-payments";
import { epochSecondsOf, responseDecoder } from "@thomasfosterau/effect-payments/internal";
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

const composeName = (
  first: string | null | undefined,
  last: string | null | undefined,
): string | null => {
  const parts = Arr.filter([first, last], (part): part is string => !!part);
  return Arr.match(parts, { onEmpty: () => null, onNonEmpty: (named) => named.join(" ") });
};

const metadataOf = (metadata: typeof Metadata.Type): Record<string, string> =>
  R.filter(metadata ?? {}, Predicate.isString);

/** Normalize an Airwallex payment intent status to the neutral status. */
const toPaymentStatus = (status: string): PaymentIntentNS.PaymentStatus =>
  Match.value(status).pipe(
    Match.withReturnType<PaymentIntentNS.PaymentStatus>(),
    Match.when("REQUIRES_PAYMENT_METHOD", () => "requires_payment_method"),
    Match.when("REQUIRES_CUSTOMER_ACTION", () => "requires_action"),
    Match.when("REQUIRES_CAPTURE", () => "requires_capture"),
    Match.when("SUCCEEDED", () => "succeeded"),
    Match.when("CANCELLED", () => "canceled"),
    Match.when(Match.is("PENDING", "RECEIVED"), () => "processing"),
    Match.orElse(Enumeration.other),
  );

/** Normalize an Airwallex refund status to the neutral status. */
const toRefundStatus = (status: string): RefundNS.RefundStatus =>
  Match.value(status).pipe(
    Match.withReturnType<RefundNS.RefundStatus>(),
    Match.when("SUCCEEDED", () => "succeeded"),
    Match.when("FAILED", () => "failed"),
    Match.when("CANCELLED", () => "canceled"),
    Match.when(Match.is("RECEIVED", "ACCEPTED", "PENDING"), () => "pending"),
    Match.orElse(Enumeration.other),
  );

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
      created: epochSecondsOf(customer.created_at),
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
      created: epochSecondsOf(intent.created_at),
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
      created: epochSecondsOf(refund.created_at),
    },
    TRUSTED,
  );

// ---------------------------------------------------------------------------
// Decoders
// ---------------------------------------------------------------------------

/**
 * Decode a response body with `schema` and map it, failing with
 * `PaymentProviderError` when it does not decode.
 */
const decoder = /* @__PURE__ */ responseDecoder({ provider: PROVIDER, name: "Airwallex" });

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

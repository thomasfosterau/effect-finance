/**
 * Translation between Airwallex API objects and vendor-neutral payments
 * entities.
 *
 * Airwallex is the source of truth here, so entities are constructed with schema
 * validation disabled — we trust the API's shapes rather than re-decoding them.
 *
 * @module
 */

import type { Schema } from "effect";
import {
  Customer as CustomerNS,
  PaymentIntent as PaymentIntentNS,
  Refund as RefundNS,
  type Page,
} from "@thomasfosterau/effect-payments";
import { toMinorUnits } from "./money.js";

/**
 * Construct entities from trusted Airwallex data without re-running the schema
 * checks (the provider's own response is the source of truth).
 */
const TRUSTED: Schema.MakeOptions = { disableChecks: true };

// ---------------------------------------------------------------------------
// Wire types (the subset of Airwallex fields the neutral mapping reads)
// ---------------------------------------------------------------------------

export interface AirwallexCustomer {
  readonly id: string;
  readonly email?: string | null | undefined;
  readonly first_name?: string | null | undefined;
  readonly last_name?: string | null | undefined;
  readonly phone_number?: string | null | undefined;
  readonly metadata?: Record<string, string> | null | undefined;
  readonly created_at?: string | null | undefined;
}

export interface AirwallexPaymentIntent {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
  readonly customer_id?: string | null | undefined;
  readonly payment_method_id?: string | null | undefined;
  readonly client_secret?: string | null | undefined;
  readonly descriptor?: string | null | undefined;
  readonly metadata?: Record<string, string> | null | undefined;
  readonly created_at?: string | null | undefined;
}

export interface AirwallexRefund {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
  readonly payment_intent_id?: string | null | undefined;
  readonly reason?: string | null | undefined;
  readonly metadata?: Record<string, string> | null | undefined;
  readonly created_at?: string | null | undefined;
}

/** A page of Airwallex results. */
export interface AirwallexList<A> {
  readonly items: ReadonlyArray<A>;
  readonly has_more: boolean;
}

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

const metadataOf = (metadata: Record<string, string> | null | undefined): Record<string, string> =>
  metadata ?? {};

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
    default:
      return "processing";
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
    default:
      return "pending";
  }
};

// ---------------------------------------------------------------------------
// Entity mappers
// ---------------------------------------------------------------------------

/** Map an Airwallex customer to the neutral entity. */
export const toCustomer = (customer: AirwallexCustomer): CustomerNS.Customer =>
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
export const toPaymentIntent = (intent: AirwallexPaymentIntent): PaymentIntentNS.PaymentIntent =>
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
export const toRefund = (refund: AirwallexRefund): RefundNS.Refund =>
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

/** Map an Airwallex list response into a neutral page. */
export const toPage = <S, A>(list: AirwallexList<S>, map: (value: S) => A): Page<A> => ({
  data: list.items.map(map),
  hasMore: list.has_more,
});

/**
 * Vendor-neutral payment intent resource.
 *
 * A payment intent tracks the lifecycle of collecting a payment from a
 * customer, from creation through confirmation to a terminal state.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import { Metadata } from "./Money.js";
import type { Page } from "./Page.js";
import type { PaymentsError } from "./PaymentsError.js";

/**
 * The lifecycle status of a payment intent, normalized across providers.
 */
export const PaymentStatus = Schema.Literal(
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "requires_capture",
  "canceled",
  "succeeded"
);
export type PaymentStatus = Schema.Schema.Type<typeof PaymentStatus>;

/**
 * An attempt to collect a payment of a given amount and currency.
 */
export class PaymentIntent extends Schema.Class<PaymentIntent>(
  "@effect-payments/PaymentIntent"
)({
  id: Schema.String,
  /** Amount in the smallest currency unit. */
  amount: Schema.Number,
  currency: Schema.String,
  status: PaymentStatus,
  customerId: Schema.NullOr(Schema.String),
  paymentMethodId: Schema.NullOr(Schema.String),
  /** Client secret used to complete the payment on the client side. */
  clientSecret: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  metadata: Metadata,
  /** Creation time as a Unix timestamp in seconds. */
  created: Schema.Number,
}) {}

/** Parameters for creating a payment intent. */
export interface CreateParams {
  readonly amount: number;
  readonly currency: string;
  readonly customer?: string;
  readonly paymentMethod?: string;
  readonly description?: string;
  readonly metadata?: Record<string, string>;
}

/** Parameters for updating a payment intent. */
export interface UpdateParams {
  readonly amount?: number;
  readonly description?: string;
  readonly metadata?: Record<string, string>;
}

/** Parameters for confirming a payment intent. */
export interface ConfirmParams {
  readonly paymentMethod?: string;
}

/** Parameters for listing payment intents. */
export interface ListParams {
  readonly limit?: number;
  readonly customer?: string;
  readonly startingAfter?: string;
}

/**
 * The payment intent capability.
 */
export class PaymentIntents extends Context.Tag(
  "@effect-payments/PaymentIntents"
)<
  PaymentIntents,
  {
    readonly create: (
      params: CreateParams
    ) => Effect.Effect<PaymentIntent, PaymentsError>;
    readonly retrieve: (
      id: string
    ) => Effect.Effect<PaymentIntent, PaymentsError>;
    readonly update: (
      id: string,
      params: UpdateParams
    ) => Effect.Effect<PaymentIntent, PaymentsError>;
    readonly confirm: (
      id: string,
      params?: ConfirmParams
    ) => Effect.Effect<PaymentIntent, PaymentsError>;
    readonly cancel: (
      id: string
    ) => Effect.Effect<PaymentIntent, PaymentsError>;
    readonly list: (
      params?: ListParams
    ) => Effect.Effect<Page<PaymentIntent>, PaymentsError>;
  }
>() {}

const accessors = Effect.serviceFunctions(PaymentIntents);

/** Create a payment intent. */
export const create = accessors.create;
/** Retrieve a payment intent by id. */
export const retrieve = accessors.retrieve;
/** Update a payment intent. */
export const update = accessors.update;
/** Confirm a payment intent. */
export const confirm = accessors.confirm;
/** Cancel a payment intent. */
export const cancel = accessors.cancel;
/** List payment intents. */
export const list = accessors.list;

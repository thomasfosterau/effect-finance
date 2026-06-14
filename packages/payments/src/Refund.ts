/**
 * Vendor-neutral refund resource.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import { Metadata } from "./Money.js";
import type { Page } from "./Page.js";
import type { PaymentsError } from "./PaymentsError.js";

/**
 * The status of a refund, normalized across providers.
 */
export const RefundStatus = Schema.Literal(
  "pending",
  "requires_action",
  "succeeded",
  "failed",
  "canceled"
);
export type RefundStatus = Schema.Schema.Type<typeof RefundStatus>;

/**
 * A refund of a previously captured payment.
 */
export class Refund extends Schema.Class<Refund>("@effect-payments/Refund")({
  id: Schema.String,
  /** Amount refunded in the smallest currency unit. */
  amount: Schema.Number,
  currency: Schema.String,
  status: RefundStatus,
  /** The payment intent being refunded, if the refund targets one. */
  paymentIntentId: Schema.NullOr(Schema.String),
  /** The charge being refunded, if the refund targets one. */
  chargeId: Schema.NullOr(Schema.String),
  reason: Schema.NullOr(Schema.String),
  metadata: Metadata,
  /** Creation time as a Unix timestamp in seconds. */
  created: Schema.Number,
}) {}

/** Parameters for creating a refund. Provide either a payment intent or charge. */
export interface CreateParams {
  readonly paymentIntent?: string;
  readonly charge?: string;
  /** Amount to refund in the smallest currency unit; omit for a full refund. */
  readonly amount?: number;
  readonly reason?: string;
  readonly metadata?: Record<string, string>;
}

/** Parameters for updating a refund. */
export interface UpdateParams {
  readonly metadata?: Record<string, string>;
}

/** Parameters for listing refunds. */
export interface ListParams {
  readonly limit?: number;
  readonly paymentIntent?: string;
  readonly charge?: string;
  readonly startingAfter?: string;
}

/**
 * The refund capability.
 */
export class Refunds extends Context.Tag("@effect-payments/Refunds")<
  Refunds,
  {
    readonly create: (
      params: CreateParams
    ) => Effect.Effect<Refund, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Refund, PaymentsError>;
    readonly update: (
      id: string,
      params: UpdateParams
    ) => Effect.Effect<Refund, PaymentsError>;
    readonly list: (
      params?: ListParams
    ) => Effect.Effect<Page<Refund>, PaymentsError>;
  }
>() {}

const accessors = Effect.serviceFunctions(Refunds);

/** Create a refund. */
export const create = accessors.create;
/** Retrieve a refund by id. */
export const retrieve = accessors.retrieve;
/** Update a refund. */
export const update = accessors.update;
/** List refunds. */
export const list = accessors.list;

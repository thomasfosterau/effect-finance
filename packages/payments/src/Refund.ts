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
export const RefundStatus = Schema.Literals([
  "pending",
  "requires_action",
  "succeeded",
  "failed",
  "canceled",
]);
export type RefundStatus = typeof RefundStatus.Type;

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
  readonly paymentIntent?: string | undefined;
  readonly charge?: string | undefined;
  /** Amount to refund in the smallest currency unit; omit for a full refund. */
  readonly amount?: number | undefined;
  readonly reason?: string | undefined;
  readonly metadata?: Record<string, string> | undefined;
}

/** Parameters for updating a refund. */
export interface UpdateParams {
  readonly metadata?: Record<string, string> | undefined;
}

/** Parameters for listing refunds. */
export interface ListParams {
  readonly limit?: number | undefined;
  readonly paymentIntent?: string | undefined;
  readonly charge?: string | undefined;
  readonly startingAfter?: string | undefined;
}

/**
 * The refund capability.
 */
export class Refunds extends Context.Service<
  Refunds,
  {
    readonly create: (params: CreateParams) => Effect.Effect<Refund, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Refund, PaymentsError>;
    readonly update: (id: string, params: UpdateParams) => Effect.Effect<Refund, PaymentsError>;
    readonly list: (params?: ListParams) => Effect.Effect<Page<Refund>, PaymentsError>;
  }
>()("@effect-payments/Refunds") {}

/** Create a refund. */
export const create = (params: CreateParams): Effect.Effect<Refund, PaymentsError, Refunds> =>
  Effect.flatMap(Refunds, (service) => service.create(params));
/** Retrieve a refund by id. */
export const retrieve = (id: string): Effect.Effect<Refund, PaymentsError, Refunds> =>
  Effect.flatMap(Refunds, (service) => service.retrieve(id));
/** Update a refund. */
export const update = (
  id: string,
  params: UpdateParams,
): Effect.Effect<Refund, PaymentsError, Refunds> =>
  Effect.flatMap(Refunds, (service) => service.update(id, params));
/** List refunds. */
export const list = (params?: ListParams): Effect.Effect<Page<Refund>, PaymentsError, Refunds> =>
  Effect.flatMap(Refunds, (service) => service.list(params));

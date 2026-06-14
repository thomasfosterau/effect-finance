/**
 * Vendor-neutral subscription resource.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import { Metadata } from "./Money.js";
import type { Page } from "./Page.js";
import type { PaymentsError } from "./PaymentsError.js";

/**
 * The status of a subscription, normalized across providers.
 */
export const SubscriptionStatus = Schema.Literal(
  "active",
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "trialing",
  "paused"
);
export type SubscriptionStatus = Schema.Schema.Type<typeof SubscriptionStatus>;

/** A single line item of a subscription, billed against a price. */
export class SubscriptionItem extends Schema.Class<SubscriptionItem>(
  "@effect-payments/SubscriptionItem"
)({
  id: Schema.String,
  priceId: Schema.String,
  quantity: Schema.NullOr(Schema.Number),
}) {}

/**
 * A recurring agreement to bill a customer for one or more prices.
 */
export class Subscription extends Schema.Class<Subscription>(
  "@effect-payments/Subscription"
)({
  id: Schema.String,
  customerId: Schema.String,
  status: SubscriptionStatus,
  items: Schema.Array(SubscriptionItem),
  /** Start of the current billing period (Unix timestamp in seconds). */
  currentPeriodStart: Schema.Number,
  /** End of the current billing period (Unix timestamp in seconds). */
  currentPeriodEnd: Schema.Number,
  cancelAtPeriodEnd: Schema.Boolean,
  metadata: Metadata,
  /** Creation time as a Unix timestamp in seconds. */
  created: Schema.Number,
}) {}

/** A price/quantity pair used when creating a subscription. */
export interface ItemParams {
  readonly price: string;
  readonly quantity?: number;
}

/** Parameters for creating a subscription. */
export interface CreateParams {
  readonly customer: string;
  readonly items: ReadonlyArray<ItemParams>;
  readonly cancelAtPeriodEnd?: boolean;
  readonly metadata?: Record<string, string>;
}

/** Parameters for updating a subscription. */
export interface UpdateParams {
  readonly cancelAtPeriodEnd?: boolean;
  readonly metadata?: Record<string, string>;
}

/** Parameters for listing subscriptions. */
export interface ListParams {
  readonly limit?: number;
  readonly customer?: string;
  readonly status?: SubscriptionStatus;
  readonly startingAfter?: string;
}

/**
 * The subscription capability.
 */
export class Subscriptions extends Context.Tag(
  "@effect-payments/Subscriptions"
)<
  Subscriptions,
  {
    readonly create: (
      params: CreateParams
    ) => Effect.Effect<Subscription, PaymentsError>;
    readonly retrieve: (
      id: string
    ) => Effect.Effect<Subscription, PaymentsError>;
    readonly update: (
      id: string,
      params: UpdateParams
    ) => Effect.Effect<Subscription, PaymentsError>;
    readonly cancel: (id: string) => Effect.Effect<Subscription, PaymentsError>;
    readonly list: (
      params?: ListParams
    ) => Effect.Effect<Page<Subscription>, PaymentsError>;
  }
>() {}

const accessors = Effect.serviceFunctions(Subscriptions);

/** Create a subscription. */
export const create = accessors.create;
/** Retrieve a subscription by id. */
export const retrieve = accessors.retrieve;
/** Update a subscription. */
export const update = accessors.update;
/** Cancel a subscription. */
export const cancel = accessors.cancel;
/** List subscriptions. */
export const list = accessors.list;

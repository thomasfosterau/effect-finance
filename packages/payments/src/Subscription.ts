/**
 * Vendor-neutral subscription resource.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import * as Enumeration from "./Enumeration.js";
import { Metadata } from "./Money.js";
import type { Page } from "./Page.js";
import type { PaymentsError } from "./PaymentsError.js";

/**
 * The subscription statuses that this library models, normalized across
 * providers.
 */
export const KnownSubscriptionStatus = Schema.Literals([
  "active",
  "past_due",
  "unpaid",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "trialing",
  "paused",
]);
export type KnownSubscriptionStatus = typeof KnownSubscriptionStatus.Type;

/**
 * The status of a subscription: a {@link KnownSubscriptionStatus}, or `Other`
 * carrying the raw status a provider sent that is not modelled.
 */
export const SubscriptionStatus = Enumeration.lenient(KnownSubscriptionStatus);
export type SubscriptionStatus = typeof SubscriptionStatus.Type;

/** A single line item of a subscription, billed against a price. */
export class SubscriptionItem extends Schema.Class<SubscriptionItem>(
  "@effect-payments/SubscriptionItem",
)({
  id: Schema.String,
  priceId: Schema.String,
  quantity: Schema.NullOr(Schema.Number),
}) {}

/**
 * A recurring agreement to bill a customer for one or more prices.
 */
export class Subscription extends Schema.Class<Subscription>("@effect-payments/Subscription")({
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
  readonly quantity?: number | undefined;
}

/** Parameters for creating a subscription. */
export interface CreateParams {
  readonly customer: string;
  readonly items: ReadonlyArray<ItemParams>;
  readonly cancelAtPeriodEnd?: boolean | undefined;
  readonly metadata?: Record<string, string> | undefined;
}

/** Parameters for updating a subscription. */
export interface UpdateParams {
  readonly cancelAtPeriodEnd?: boolean | undefined;
  readonly metadata?: Record<string, string> | undefined;
}

/** Parameters for listing subscriptions. */
export interface ListParams {
  readonly limit?: number | undefined;
  readonly customer?: string | undefined;
  /** A status to filter by; only a known status can be requested. */
  readonly status?: KnownSubscriptionStatus | undefined;
  readonly startingAfter?: string | undefined;
}

/**
 * The subscription capability.
 */
export class Subscriptions extends Context.Service<
  Subscriptions,
  {
    readonly create: (params: CreateParams) => Effect.Effect<Subscription, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Subscription, PaymentsError>;
    readonly update: (
      id: string,
      params: UpdateParams,
    ) => Effect.Effect<Subscription, PaymentsError>;
    readonly cancel: (id: string) => Effect.Effect<Subscription, PaymentsError>;
    readonly list: (params?: ListParams) => Effect.Effect<Page<Subscription>, PaymentsError>;
  }
>()("@effect-payments/Subscriptions") {}

/** Create a subscription. */
export const create = (
  params: CreateParams,
): Effect.Effect<Subscription, PaymentsError, Subscriptions> =>
  Effect.flatMap(Subscriptions, (service) => service.create(params));
/** Retrieve a subscription by id. */
export const retrieve = (id: string): Effect.Effect<Subscription, PaymentsError, Subscriptions> =>
  Effect.flatMap(Subscriptions, (service) => service.retrieve(id));
/** Update a subscription. */
export const update = (
  id: string,
  params: UpdateParams,
): Effect.Effect<Subscription, PaymentsError, Subscriptions> =>
  Effect.flatMap(Subscriptions, (service) => service.update(id, params));
/** Cancel a subscription. */
export const cancel = (id: string): Effect.Effect<Subscription, PaymentsError, Subscriptions> =>
  Effect.flatMap(Subscriptions, (service) => service.cancel(id));
/** List subscriptions. */
export const list = (
  params?: ListParams,
): Effect.Effect<Page<Subscription>, PaymentsError, Subscriptions> =>
  Effect.flatMap(Subscriptions, (service) => service.list(params));

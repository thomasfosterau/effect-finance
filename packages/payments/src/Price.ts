/**
 * Vendor-neutral price resource.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import { Metadata } from "./Money.js";
import type { Page } from "./Page.js";
import type { PaymentsError } from "./PaymentsError.js";

/** A recurring billing interval. */
export const RecurringInterval = Schema.Literals(["day", "week", "month", "year"]);
export type RecurringInterval = typeof RecurringInterval.Type;

/** The recurring schedule of a price, when it is not a one-time price. */
export class Recurring extends Schema.Class<Recurring>("@effect-payments/Recurring")({
  interval: RecurringInterval,
  intervalCount: Schema.Number,
}) {}

/**
 * The amount and currency a customer is charged for a product, optionally on a
 * recurring schedule.
 */
export class Price extends Schema.Class<Price>("@effect-payments/Price")({
  id: Schema.String,
  /** The id of the product this price is attached to, if any. */
  productId: Schema.NullOr(Schema.String),
  active: Schema.Boolean,
  currency: Schema.String,
  /** Amount in the smallest currency unit, or `null` for some price types. */
  unitAmount: Schema.NullOr(Schema.Number),
  type: Schema.Literals(["one_time", "recurring"]),
  recurring: Schema.NullOr(Recurring),
  metadata: Metadata,
  /** Creation time as a Unix timestamp in seconds. */
  created: Schema.Number,
}) {}

/** Parameters for creating a price. */
export interface CreateParams {
  readonly product: string;
  readonly currency: string;
  readonly unitAmount: number;
  readonly recurring?: {
    readonly interval: RecurringInterval;
    readonly intervalCount?: number | undefined;
  };
  readonly active?: boolean | undefined;
  readonly metadata?: Record<string, string> | undefined;
}

/** Parameters for updating a price. */
export interface UpdateParams {
  readonly active?: boolean | undefined;
  readonly metadata?: Record<string, string> | undefined;
}

/** Parameters for listing prices. */
export interface ListParams {
  readonly limit?: number | undefined;
  readonly product?: string | undefined;
  readonly active?: boolean | undefined;
  readonly startingAfter?: string | undefined;
}

/**
 * The price capability.
 */
export class Prices extends Context.Service<
  Prices,
  {
    readonly create: (params: CreateParams) => Effect.Effect<Price, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Price, PaymentsError>;
    readonly update: (id: string, params: UpdateParams) => Effect.Effect<Price, PaymentsError>;
    readonly list: (params?: ListParams) => Effect.Effect<Page<Price>, PaymentsError>;
  }
>()("@effect-payments/Prices") {}

/** Create a price. */
export const create = (params: CreateParams): Effect.Effect<Price, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.create(params));
/** Retrieve a price by id. */
export const retrieve = (id: string): Effect.Effect<Price, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.retrieve(id));
/** Update a price. */
export const update = (
  id: string,
  params: UpdateParams,
): Effect.Effect<Price, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.update(id, params));
/** List prices. */
export const list = (params?: ListParams): Effect.Effect<Page<Price>, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.list(params));

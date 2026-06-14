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
export const RecurringInterval = Schema.Literal("day", "week", "month", "year");
export type RecurringInterval = Schema.Schema.Type<typeof RecurringInterval>;

/** The recurring schedule of a price, when it is not a one-time price. */
export class Recurring extends Schema.Class<Recurring>(
  "@effect-payments/Recurring"
)({
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
  type: Schema.Literal("one_time", "recurring"),
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
    readonly intervalCount?: number;
  };
  readonly active?: boolean;
  readonly metadata?: Record<string, string>;
}

/** Parameters for updating a price. */
export interface UpdateParams {
  readonly active?: boolean;
  readonly metadata?: Record<string, string>;
}

/** Parameters for listing prices. */
export interface ListParams {
  readonly limit?: number;
  readonly product?: string;
  readonly active?: boolean;
  readonly startingAfter?: string;
}

/**
 * The price capability.
 */
export class Prices extends Context.Tag("@effect-payments/Prices")<
  Prices,
  {
    readonly create: (
      params: CreateParams
    ) => Effect.Effect<Price, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Price, PaymentsError>;
    readonly update: (
      id: string,
      params: UpdateParams
    ) => Effect.Effect<Price, PaymentsError>;
    readonly list: (
      params?: ListParams
    ) => Effect.Effect<Page<Price>, PaymentsError>;
  }
>() {}

const accessors = Effect.serviceFunctions(Prices);

/** Create a price. */
export const create = accessors.create;
/** Retrieve a price by id. */
export const retrieve = accessors.retrieve;
/** Update a price. */
export const update = accessors.update;
/** List prices. */
export const list = accessors.list;

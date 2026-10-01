/**
 * Vendor-neutral price resource.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import * as Enumeration from "./Enumeration.js";
import { Metadata } from "./Money.js";
import type { Page } from "./Page.js";
import type { IdempotencyKey } from "./IdempotencyKey.js";
import type { PaymentsError } from "./PaymentsError.js";

/** The recurring billing intervals that this library models. */
export const KnownRecurringInterval = Schema.Literals(["day", "week", "month", "year"]);
export type KnownRecurringInterval = typeof KnownRecurringInterval.Type;

/**
 * A recurring billing interval: a {@link KnownRecurringInterval}, or `Other`
 * carrying the raw interval a provider sent that is not modelled.
 */
export const RecurringInterval = Enumeration.lenient(KnownRecurringInterval);
export type RecurringInterval = typeof RecurringInterval.Type;

/** The price types that this library models. */
export const KnownPriceType = Schema.Literals(["one_time", "recurring"]);
export type KnownPriceType = typeof KnownPriceType.Type;

/**
 * Whether a price is charged once or on a schedule: a {@link KnownPriceType},
 * or `Other` carrying the raw type a provider sent that is not modelled.
 */
export const PriceType = Enumeration.lenient(KnownPriceType);
export type PriceType = typeof PriceType.Type;

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
  type: PriceType,
  recurring: Schema.NullOr(Recurring),
  metadata: Metadata,
  /** Creation time as a Unix timestamp in seconds. */
  created: Schema.Number,
}) {}

/** Parameters for creating a price. */
export interface CreateParams {
  readonly product: string;
  /** Lower-cased ISO 4217 currency code, e.g. `"usd"`. */
  readonly currency: string;
  /** Unit amount in the smallest currency unit (e.g. `2000` = $20.00). */
  readonly unitAmount: number;
  readonly recurring?: {
    readonly interval: KnownRecurringInterval;
    readonly intervalCount?: number | undefined;
  };
  readonly active?: boolean | undefined;
  readonly metadata?: Record<string, string> | undefined;
  /**
   * Makes this write safe to repeat: create one with `IdempotencyKey.generate`
   * before the first attempt and pass the same key on every retry (see
   * `IdempotencyKey` for the contract).
   */
  readonly idempotencyKey?: IdempotencyKey | undefined;
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

/**
 * Create a price. Fails with `PaymentInvalidRequestError` on a provider that
 * cannot create this kind of price (a one-time price on a recurring-only
 * provider).
 */
export const create = (params: CreateParams): Effect.Effect<Price, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.create(params));
/** Retrieve a price by id. */
export const retrieve = (id: string): Effect.Effect<Price, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.retrieve(id));
/**
 * Update a price. Fails with `PaymentInvalidRequestError` on a provider that
 * cannot apply the given fields (some can only toggle `active`).
 */
export const update = (
  id: string,
  params: UpdateParams,
): Effect.Effect<Price, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.update(id, params));
/** List prices. */
export const list = (params?: ListParams): Effect.Effect<Page<Price>, PaymentsError, Prices> =>
  Effect.flatMap(Prices, (service) => service.list(params));

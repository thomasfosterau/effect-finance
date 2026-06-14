/**
 * Vendor-neutral customer resource.
 *
 * Defines the neutral {@link Customer} entity, the {@link Customers} capability
 * (an abstract service that a provider implements), and accessor functions that
 * dispatch to whichever provider has been supplied to the environment.
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Customer from "@thomasfosterau/effect-payments/Customer";
 *
 * const program = Effect.gen(function* () {
 *   const customer = yield* Customer.create({ email: "jane@example.com" });
 *   return customer;
 * });
 * // Provide a concrete implementation, e.g. the Stripe provider, to run it.
 * ```
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import { Metadata } from "./Money.js";
import type { Page, Deleted } from "./Page.js";
import type { PaymentsError } from "./PaymentsError.js";

/**
 * A customer of the payments platform.
 */
export class Customer extends Schema.Class<Customer>(
  "@effect-payments/Customer"
)({
  id: Schema.String,
  email: Schema.NullOr(Schema.String),
  name: Schema.NullOr(Schema.String),
  phone: Schema.NullOr(Schema.String),
  description: Schema.NullOr(Schema.String),
  metadata: Metadata,
  /** Creation time as a Unix timestamp in seconds. */
  created: Schema.Number,
  /** Whether the customer exists in live (non-test) mode. */
  livemode: Schema.Boolean,
}) {}

/** Parameters for creating a customer. */
export interface CreateParams {
  readonly email?: string;
  readonly name?: string;
  readonly phone?: string;
  readonly description?: string;
  readonly metadata?: Record<string, string>;
}

/** Parameters for updating a customer. */
export interface UpdateParams {
  readonly email?: string;
  readonly name?: string;
  readonly phone?: string;
  readonly description?: string;
  readonly metadata?: Record<string, string>;
}

/** Parameters for listing customers. */
export interface ListParams {
  readonly limit?: number;
  readonly email?: string;
  /** Cursor: return results after this customer id. */
  readonly startingAfter?: string;
}

/**
 * The customer capability. A provider supplies a `Layer` implementing this
 * service; programs depend only on this abstract interface.
 */
export class Customers extends Context.Tag("@effect-payments/Customers")<
  Customers,
  {
    readonly create: (
      params: CreateParams
    ) => Effect.Effect<Customer, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Customer, PaymentsError>;
    readonly update: (
      id: string,
      params: UpdateParams
    ) => Effect.Effect<Customer, PaymentsError>;
    readonly del: (id: string) => Effect.Effect<Deleted, PaymentsError>;
    readonly list: (
      params?: ListParams
    ) => Effect.Effect<Page<Customer>, PaymentsError>;
  }
>() {}

const accessors = Effect.serviceFunctions(Customers);

/** Create a customer. */
export const create = accessors.create;
/** Retrieve a customer by id. */
export const retrieve = accessors.retrieve;
/** Update a customer. */
export const update = accessors.update;
/** Delete a customer. */
export const del = accessors.del;
/** List customers. */
export const list = accessors.list;

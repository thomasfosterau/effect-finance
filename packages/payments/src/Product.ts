/**
 * Vendor-neutral product resource.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import { Metadata } from "./Money.js";
import type { Page, Deleted } from "./Page.js";
import type { IdempotencyKey } from "./IdempotencyKey.js";
import type { PaymentsError } from "./PaymentsError.js";

/**
 * A sellable product. Prices are attached to products (see `Price`).
 */
export class Product extends Schema.Class<Product>("@effect-payments/Product")({
  id: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  active: Schema.Boolean,
  metadata: Metadata,
  /** Creation time as a Unix timestamp in seconds. */
  created: Schema.Number,
}) {}

/** Parameters for creating a product. */
export interface CreateParams {
  readonly name: string;
  readonly description?: string | undefined;
  readonly active?: boolean | undefined;
  readonly metadata?: Record<string, string> | undefined;
  /**
   * Makes this write safe to repeat: create one with `IdempotencyKey.generate`
   * before the first attempt and pass the same key on every retry (see
   * `IdempotencyKey` for the contract).
   */
  readonly idempotencyKey?: IdempotencyKey | undefined;
}

/** Parameters for updating a product. */
export interface UpdateParams {
  readonly name?: string | undefined;
  readonly description?: string | undefined;
  readonly active?: boolean | undefined;
  readonly metadata?: Record<string, string> | undefined;
}

/** Parameters for listing products. */
export interface ListParams {
  readonly limit?: number | undefined;
  readonly active?: boolean | undefined;
  readonly startingAfter?: string | undefined;
}

/**
 * The product capability.
 */
export class Products extends Context.Service<
  Products,
  {
    readonly create: (params: CreateParams) => Effect.Effect<Product, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Product, PaymentsError>;
    readonly update: (id: string, params: UpdateParams) => Effect.Effect<Product, PaymentsError>;
    readonly del: (id: string) => Effect.Effect<Deleted, PaymentsError>;
    readonly list: (params?: ListParams) => Effect.Effect<Page<Product>, PaymentsError>;
  }
>()("@effect-payments/Products") {}

/** Create a product. */
export const create = (params: CreateParams): Effect.Effect<Product, PaymentsError, Products> =>
  Effect.flatMap(Products, (service) => service.create(params));
/** Retrieve a product by id. */
export const retrieve = (id: string): Effect.Effect<Product, PaymentsError, Products> =>
  Effect.flatMap(Products, (service) => service.retrieve(id));
/**
 * Update a product. Fails with `PaymentInvalidRequestError` on a provider that
 * cannot apply the given fields.
 */
export const update = (
  id: string,
  params: UpdateParams,
): Effect.Effect<Product, PaymentsError, Products> =>
  Effect.flatMap(Products, (service) => service.update(id, params));
/**
 * Delete a product. Fails with `PaymentInvalidRequestError` on a provider
 * without this operation.
 */
export const del = (id: string): Effect.Effect<Deleted, PaymentsError, Products> =>
  Effect.flatMap(Products, (service) => service.del(id));
/** List products. */
export const list = (params?: ListParams): Effect.Effect<Page<Product>, PaymentsError, Products> =>
  Effect.flatMap(Products, (service) => service.list(params));

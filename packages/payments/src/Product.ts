/**
 * Vendor-neutral product resource.
 *
 * @module
 */

import { Context, Effect, Schema } from "effect";
import { Metadata } from "./Money.js";
import type { Page, Deleted } from "./Page.js";
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
  readonly description?: string;
  readonly active?: boolean;
  readonly metadata?: Record<string, string>;
}

/** Parameters for updating a product. */
export interface UpdateParams {
  readonly name?: string;
  readonly description?: string;
  readonly active?: boolean;
  readonly metadata?: Record<string, string>;
}

/** Parameters for listing products. */
export interface ListParams {
  readonly limit?: number;
  readonly active?: boolean;
  readonly startingAfter?: string;
}

/**
 * The product capability.
 */
export class Products extends Context.Tag("@effect-payments/Products")<
  Products,
  {
    readonly create: (
      params: CreateParams
    ) => Effect.Effect<Product, PaymentsError>;
    readonly retrieve: (id: string) => Effect.Effect<Product, PaymentsError>;
    readonly update: (
      id: string,
      params: UpdateParams
    ) => Effect.Effect<Product, PaymentsError>;
    readonly del: (id: string) => Effect.Effect<Deleted, PaymentsError>;
    readonly list: (
      params?: ListParams
    ) => Effect.Effect<Page<Product>, PaymentsError>;
  }
>() {}

const accessors = Effect.serviceFunctions(Products);

/** Create a product. */
export const create = accessors.create;
/** Retrieve a product by id. */
export const retrieve = accessors.retrieve;
/** Update a product. */
export const update = accessors.update;
/** Delete a product. */
export const del = accessors.del;
/** List products. */
export const list = accessors.list;

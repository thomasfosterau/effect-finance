/**
 * Product resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Product from "@thomasfosterau/effect-payments-stripe/Product";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createProduct = (name: string) => Product.create({ name });
 *
 * const program = Effect.gen(function* () {
 *   const product = yield* createProduct("Premium Plan");
 *   return product;
 * });
 *
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a product
 */
export const create = (
  params: Stripe.ProductCreateParams,
): Effect.Effect<Stripe.Product, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.products.create(params));

/**
 * Retrieve a product
 */
export const retrieve = (
  id: string,
  params?: Stripe.ProductRetrieveParams,
): Effect.Effect<Stripe.Product, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.products.retrieve(id, params));

/**
 * Update a product
 */
export const update = (
  id: string,
  params?: Stripe.ProductUpdateParams,
): Effect.Effect<Stripe.Product, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.products.update(id, params));

/**
 * Delete a product
 */
export const del = (id: string): Effect.Effect<Stripe.DeletedProduct, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.products.del(id));

/**
 * List products
 */
export const list = (
  params?: Stripe.ProductListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Product>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.products.list(params));

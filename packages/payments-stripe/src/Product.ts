/**
 * Product resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Product from "@thomasfosterau/effect-payments-stripe/Product";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createProduct = (name: string) => Product.create({ name });
 *
 * const program = Effect.gen(function* () {
 *   const product = yield* createProduct("Premium Plan");
 *   return product;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a product
 */
export const create = (
  params: Stripe.ProductCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Product, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/products", params, options);

/**
 * Retrieve a product
 */
export const retrieve = (
  id: string,
  params?: Stripe.ProductRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Product, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/products/${id}`, params, options);

/**
 * Update a product
 */
export const update = (
  id: string,
  params?: Stripe.ProductUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Product, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/products/${id}`, params, options);

/**
 * Delete a product
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedProduct, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/products/${id}`, undefined, options);

/**
 * List products
 */
export const list = (
  params?: Stripe.ProductListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Product>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/products", params, options);

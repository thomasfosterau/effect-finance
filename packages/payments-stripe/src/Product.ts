/**
 * Stripe's `/v1/products` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded; prefer the neutral
 * `Products` capability where it covers the call.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a product (`POST /v1/products`).
 */
export const create = (
  params: Stripe.ProductCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Product, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/products", params, options);

/**
 * Retrieve a product (`GET /v1/products/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.ProductRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Product, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/products/${id}`, params, options);

/**
 * Update a product (`POST /v1/products/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.ProductUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Product, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/products/${id}`, params, options);

/**
 * Delete a product (`DELETE /v1/products/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedProduct, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/products/${id}`, undefined, options);

/**
 * List products (`GET /v1/products`).
 */
export const list = (
  params?: Stripe.ProductListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Product>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/products", params, options);

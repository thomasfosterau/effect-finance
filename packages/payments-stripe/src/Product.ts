/**
 * Stripe's `/v1/products` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover; prefer the neutral `Products`
 * capability where it covers the call.
 *
 * Like {@link "./Customer"}, typed by a schema **generated** from Stripe's
 * OpenAPI spec at the pinned API version (not by the `stripe` package), with
 * every response decoded at the boundary: a body that does not match fails
 * with `PaymentProviderError`. An expandable field (`default_price`,
 * `tax_code`) decodes as its id or, when expanded, an open JSON object.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import * as Generated from "./internal/generated/schemas.js";
import { stripeRequestDecoded } from "./internal/decode.js";
import { path, type StripeError } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/** The Product object, as a `Schema` (the decoder for create, retrieve and update). */
export const Product = Generated.Product;
/** The Product object. */
export type Product = Generated.Product;

/** A deleted product (`{ id, object: "product", deleted: true }`), as a `Schema`. */
export const DeletedProduct = Generated.Deleted_product;
/** A deleted product: what {@link del} answers. */
export type DeletedProduct = Generated.Deleted_product;

/** A page of products, as a `Schema`. */
export const ProductList = Generated.GetProducts200;
/** A page of products. */
export type ProductList = Generated.GetProducts200;

/** The parameters of {@link create}. */
export type ProductCreateParams = Generated.PostProductsRequestFormUrlEncoded;
/** The parameters of {@link retrieve}. */
export type ProductRetrieveParams = Generated.GetProductsIdParams;
/** The parameters of {@link update}. */
export type ProductUpdateParams = Generated.PostProductsIdRequestFormUrlEncoded;
/**
 * The parameters of {@link list}. `created` takes a timestamp or a
 * `{ gt, gte, lt, lte }` range.
 */
export type ProductListParams = Generated.GetProductsParams;

/**
 * Create a product (`POST /v1/products`).
 */
export const create = (
  params: ProductCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Product, StripeError, StripeHttp> =>
  stripeRequestDecoded("product", Product, "POST", "/v1/products", params, options);

/**
 * Retrieve a product (`GET /v1/products/{id}`).
 */
export const retrieve = (
  id: string,
  params?: ProductRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Product, StripeError, StripeHttp> =>
  stripeRequestDecoded("product", Product, "GET", path`/v1/products/${id}`, params, options);

/**
 * Update a product (`POST /v1/products/{id}`).
 */
export const update = (
  id: string,
  params?: ProductUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Product, StripeError, StripeHttp> =>
  stripeRequestDecoded("product", Product, "POST", path`/v1/products/${id}`, params, options);

/**
 * Delete a product (`DELETE /v1/products/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<DeletedProduct, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "deleted product",
    DeletedProduct,
    "DELETE",
    path`/v1/products/${id}`,
    undefined,
    options,
  );

/**
 * List products (`GET /v1/products`).
 */
export const list = (
  params?: ProductListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<ProductList, StripeError, StripeHttp> =>
  stripeRequestDecoded("product list", ProductList, "GET", "/v1/products", params, options);

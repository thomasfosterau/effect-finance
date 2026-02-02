/**
 * Product resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Product from "@thomasfosterau/effect-stripe/Product";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
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

import { Effect, RequestResolver } from "effect";
import type Stripe from "stripe";
import { type StripeError } from "./internal.js";
import type { StripeService } from "./Stripe.js";
import {
  CreateProductRequest,
  CreateProductResolver,
  RetrieveProductRequest,
  RetrieveProductResolver,
  UpdateProductRequest,
  UpdateProductResolver,
  DeleteProductRequest,
  DeleteProductResolver,
  ListProductsRequest,
  ListProductsResolver,
} from "./ProductRequests.js";

/**
 * Create a product
 */
export const create = (
  params: Stripe.ProductCreateParams
): Effect.Effect<Stripe.Product, StripeError, StripeService> =>
  Effect.request(
    CreateProductRequest({ params }),
    RequestResolver.contextFromEffect(CreateProductResolver)
  );

/**
 * Retrieve a product
 */
export const retrieve = (
  id: string,
  params?: Stripe.ProductRetrieveParams
): Effect.Effect<Stripe.Product, StripeError, StripeService> =>
  Effect.request(
    RetrieveProductRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveProductResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a product
 */
export const update = (
  id: string,
  params?: Stripe.ProductUpdateParams
): Effect.Effect<Stripe.Product, StripeError, StripeService> =>
  Effect.request(
    UpdateProductRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateProductResolver)
  );

/**
 * Delete a product
 */
export const del = (
  id: string
): Effect.Effect<Stripe.DeletedProduct, StripeError, StripeService> =>
  Effect.request(
    DeleteProductRequest({ id }),
    RequestResolver.contextFromEffect(DeleteProductResolver)
  );

/**
 * List products
 */
export const list = (
  params?: Stripe.ProductListParams
): Effect.Effect<Stripe.ApiList<Stripe.Product>, StripeError, StripeService> =>
  Effect.request(
    ListProductsRequest({ params }),
    RequestResolver.contextFromEffect(ListProductsResolver)
  ).pipe(Effect.withRequestCaching(true));

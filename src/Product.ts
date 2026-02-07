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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a product
 */
interface CreateProductRequest extends Request.Request<
  Stripe.Product,
  StripeError
> {
  readonly _tag: "CreateProductRequest";
  readonly params: Stripe.ProductCreateParams;
}

const CreateProductRequest = Request.tagged<CreateProductRequest>(
  "CreateProductRequest"
);

const CreateProductResolver: RequestResolver.RequestResolver<
  CreateProductRequest,
  StripeService
> = makeStripeResolver<CreateProductRequest>((stripe, request) =>
  stripe.products.create(request.params)
);

/**
 * Request to retrieve a product
 */
interface RetrieveProductRequest extends Request.Request<
  Stripe.Product,
  StripeError
> {
  readonly _tag: "RetrieveProductRequest";
  readonly id: string;
  readonly params?: Stripe.ProductRetrieveParams;
}

const RetrieveProductRequest = Request.tagged<RetrieveProductRequest>(
  "RetrieveProductRequest"
);

const RetrieveProductResolver: RequestResolver.RequestResolver<
  RetrieveProductRequest,
  StripeService
> = makeStripeResolver<RetrieveProductRequest>((stripe, request) =>
  stripe.products.retrieve(request.id, request.params)
);

/**
 * Request to update a product
 */
interface UpdateProductRequest extends Request.Request<
  Stripe.Product,
  StripeError
> {
  readonly _tag: "UpdateProductRequest";
  readonly id: string;
  readonly params?: Stripe.ProductUpdateParams;
}

const UpdateProductRequest = Request.tagged<UpdateProductRequest>(
  "UpdateProductRequest"
);

const UpdateProductResolver: RequestResolver.RequestResolver<
  UpdateProductRequest,
  StripeService
> = makeStripeResolver<UpdateProductRequest>((stripe, request) =>
  stripe.products.update(request.id, request.params)
);

/**
 * Request to delete a product
 */
interface DeleteProductRequest extends Request.Request<
  Stripe.DeletedProduct,
  StripeError
> {
  readonly _tag: "DeleteProductRequest";
  readonly id: string;
}

const DeleteProductRequest = Request.tagged<DeleteProductRequest>(
  "DeleteProductRequest"
);

const DeleteProductResolver: RequestResolver.RequestResolver<
  DeleteProductRequest,
  StripeService
> = makeStripeResolver<DeleteProductRequest>((stripe, request) =>
  stripe.products.del(request.id)
);

/**
 * Request to list products
 */
interface ListProductsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Product>,
  StripeError
> {
  readonly _tag: "ListProductsRequest";
  readonly params?: Stripe.ProductListParams;
}

const ListProductsRequest = Request.tagged<ListProductsRequest>(
  "ListProductsRequest"
);

const ListProductsResolver: RequestResolver.RequestResolver<
  ListProductsRequest,
  StripeService
> = makeStripeResolver<ListProductsRequest>((stripe, request) =>
  stripe.products.list(request.params)
);

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

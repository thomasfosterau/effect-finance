/**
 * Product Request types and resolvers using Effect's RequestResolver pattern
 */

import { Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import {
  makeStripeResolver,
  type StripeError,
} from "./internal.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a product
 */
export interface CreateProductRequest
  extends Request.Request<Stripe.Product, StripeError> {
  readonly _tag: "CreateProductRequest";
  readonly params: Stripe.ProductCreateParams;
}

export const CreateProductRequest = Request.tagged<CreateProductRequest>(
  "CreateProductRequest"
);

export const CreateProductResolver: RequestResolver.RequestResolver<CreateProductRequest, StripeService> =
  makeStripeResolver<CreateProductRequest>(
    (stripe, request) =>
      stripe.products.create(request.params)
  );

/**
 * Request to retrieve a product
 */
export interface RetrieveProductRequest
  extends Request.Request<Stripe.Product, StripeError> {
  readonly _tag: "RetrieveProductRequest";
  readonly id: string;
  readonly params?: Stripe.ProductRetrieveParams;
}

export const RetrieveProductRequest = Request.tagged<RetrieveProductRequest>(
  "RetrieveProductRequest"
);

export const RetrieveProductResolver: RequestResolver.RequestResolver<RetrieveProductRequest, StripeService> =
  makeStripeResolver<RetrieveProductRequest>(
    (stripe, request) =>
      stripe.products.retrieve(request.id, request.params)
  );

/**
 * Request to update a product
 */
export interface UpdateProductRequest
  extends Request.Request<Stripe.Product, StripeError> {
  readonly _tag: "UpdateProductRequest";
  readonly id: string;
  readonly params?: Stripe.ProductUpdateParams;
}

export const UpdateProductRequest = Request.tagged<UpdateProductRequest>(
  "UpdateProductRequest"
);

export const UpdateProductResolver: RequestResolver.RequestResolver<UpdateProductRequest, StripeService> =
  makeStripeResolver<UpdateProductRequest>(
    (stripe, request) =>
      stripe.products.update(request.id, request.params)
  );

/**
 * Request to delete a product
 */
export interface DeleteProductRequest
  extends Request.Request<Stripe.DeletedProduct, StripeError> {
  readonly _tag: "DeleteProductRequest";
  readonly id: string;
}

export const DeleteProductRequest = Request.tagged<DeleteProductRequest>(
  "DeleteProductRequest"
);

export const DeleteProductResolver: RequestResolver.RequestResolver<DeleteProductRequest, StripeService> =
  makeStripeResolver<DeleteProductRequest>(
    (stripe, request) => stripe.products.del(request.id)
  );

/**
 * Request to list products
 */
export interface ListProductsRequest
  extends Request.Request<Stripe.ApiList<Stripe.Product>, StripeError> {
  readonly _tag: "ListProductsRequest";
  readonly params?: Stripe.ProductListParams;
}

export const ListProductsRequest = Request.tagged<ListProductsRequest>(
  "ListProductsRequest"
);

export const ListProductsResolver: RequestResolver.RequestResolver<ListProductsRequest, StripeService> =
  makeStripeResolver<ListProductsRequest>(
    (stripe, request) =>
      stripe.products.list(request.params)
  );

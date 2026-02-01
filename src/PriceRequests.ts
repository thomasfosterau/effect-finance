/**
 * Price Request types and resolvers using Effect's RequestResolver pattern
 */

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import {
  makeStripeResolver,
  type StripeError,
} from "./internal.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a price
 */
export interface CreatePriceRequest extends Request.Request<Stripe.Price, StripeError> {
  readonly _tag: "CreatePriceRequest";
  readonly params: Stripe.PriceCreateParams;
}

export const CreatePriceRequest = Request.tagged<CreatePriceRequest>(
  "CreatePriceRequest"
);

export const CreatePriceResolver: Effect.Effect<RequestResolver.RequestResolver<CreatePriceRequest>, never, StripeService> =
  makeStripeResolver(
    (stripe, request) => stripe.prices.create(request.params)
  );

/**
 * Request to retrieve a price
 */
export interface RetrievePriceRequest extends Request.Request<Stripe.Price, StripeError> {
  readonly _tag: "RetrievePriceRequest";
  readonly id: string;
  readonly params?: Stripe.PriceRetrieveParams;
}

export const RetrievePriceRequest = Request.tagged<RetrievePriceRequest>(
  "RetrievePriceRequest"
);

export const RetrievePriceResolver: Effect.Effect<RequestResolver.RequestResolver<RetrievePriceRequest>, never, StripeService> =
  makeStripeResolver(
    (stripe, request) =>
      stripe.prices.retrieve(request.id, request.params)
  );

/**
 * Request to update a price
 */
export interface UpdatePriceRequest extends Request.Request<Stripe.Price, StripeError> {
  readonly _tag: "UpdatePriceRequest";
  readonly id: string;
  readonly params?: Stripe.PriceUpdateParams;
}

export const UpdatePriceRequest = Request.tagged<UpdatePriceRequest>(
  "UpdatePriceRequest"
);

export const UpdatePriceResolver: Effect.Effect<RequestResolver.RequestResolver<UpdatePriceRequest>, never, StripeService> =
  makeStripeResolver(
    (stripe, request) =>
      stripe.prices.update(request.id, request.params)
  );

/**
 * Request to list prices
 */
export interface ListPricesRequest
  extends Request.Request<Stripe.ApiList<Stripe.Price>, StripeError> {
  readonly _tag: "ListPricesRequest";
  readonly params?: Stripe.PriceListParams;
}

export const ListPricesRequest = Request.tagged<ListPricesRequest>(
  "ListPricesRequest"
);

export const ListPricesResolver: Effect.Effect<RequestResolver.RequestResolver<ListPricesRequest>, never, StripeService> =
  makeStripeResolver(
    (stripe, request) => stripe.prices.list(request.params)
  );

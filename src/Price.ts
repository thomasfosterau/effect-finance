/**
 * Price resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Price from "@thomasfosterau/effect-stripe/Price";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createPrice = (productId: string, amount: number) =>
 *   Price.create({
 *     product: productId,
 *     unit_amount: amount,
 *     currency: "usd",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const price = yield* createPrice("prod_123", 1999);
 *   return price;
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
 * Request to create a price
 */
interface CreatePriceRequest extends Request.Request<Stripe.Price, StripeError> {
  readonly _tag: "CreatePriceRequest";
  readonly params: Stripe.PriceCreateParams;
}

const CreatePriceRequest = Request.tagged<CreatePriceRequest>(
  "CreatePriceRequest"
);

const CreatePriceResolver: RequestResolver.RequestResolver<CreatePriceRequest, StripeService> =
  makeStripeResolver<CreatePriceRequest>(
    (stripe, request) => stripe.prices.create(request.params)
  );

/**
 * Request to retrieve a price
 */
interface RetrievePriceRequest extends Request.Request<Stripe.Price, StripeError> {
  readonly _tag: "RetrievePriceRequest";
  readonly id: string;
  readonly params?: Stripe.PriceRetrieveParams;
}

const RetrievePriceRequest = Request.tagged<RetrievePriceRequest>(
  "RetrievePriceRequest"
);

const RetrievePriceResolver: RequestResolver.RequestResolver<RetrievePriceRequest, StripeService> =
  makeStripeResolver<RetrievePriceRequest>(
    (stripe, request) =>
      stripe.prices.retrieve(request.id, request.params)
  );

/**
 * Request to update a price
 */
interface UpdatePriceRequest extends Request.Request<Stripe.Price, StripeError> {
  readonly _tag: "UpdatePriceRequest";
  readonly id: string;
  readonly params?: Stripe.PriceUpdateParams;
}

const UpdatePriceRequest = Request.tagged<UpdatePriceRequest>(
  "UpdatePriceRequest"
);

const UpdatePriceResolver: RequestResolver.RequestResolver<UpdatePriceRequest, StripeService> =
  makeStripeResolver<UpdatePriceRequest>(
    (stripe, request) =>
      stripe.prices.update(request.id, request.params)
  );

/**
 * Request to list prices
 */
interface ListPricesRequest
  extends Request.Request<Stripe.ApiList<Stripe.Price>, StripeError> {
  readonly _tag: "ListPricesRequest";
  readonly params?: Stripe.PriceListParams;
}

const ListPricesRequest = Request.tagged<ListPricesRequest>(
  "ListPricesRequest"
);

const ListPricesResolver: RequestResolver.RequestResolver<ListPricesRequest, StripeService> =
  makeStripeResolver<ListPricesRequest>(
    (stripe, request) => stripe.prices.list(request.params)
  );

/**
 * Create a price
 */
export const create = (
  params: Stripe.PriceCreateParams
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  Effect.request(CreatePriceRequest({ params }), RequestResolver.contextFromEffect(CreatePriceResolver));

/**
 * Retrieve a price
 */
export const retrieve = (
  id: string,
  params?: Stripe.PriceRetrieveParams
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  Effect.request(
    RetrievePriceRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrievePriceResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a price
 */
export const update = (
  id: string,
  params?: Stripe.PriceUpdateParams
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  Effect.request(UpdatePriceRequest({ id, params }), RequestResolver.contextFromEffect(UpdatePriceResolver));

/**
 * List prices
 */
export const list = (
  params?: Stripe.PriceListParams
): Effect.Effect<Stripe.ApiList<Stripe.Price>, StripeError, StripeService> =>
  Effect.request(ListPricesRequest({ params }), RequestResolver.contextFromEffect(ListPricesResolver)).pipe(
    Effect.withRequestCaching(true)
  );

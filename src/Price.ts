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

import { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError } from "./internal.js";
import type { StripeService } from "./Stripe.js";
import {
  CreatePriceRequest,
  CreatePriceResolver,
  RetrievePriceRequest,
  RetrievePriceResolver,
  UpdatePriceRequest,
  UpdatePriceResolver,
  ListPricesRequest,
  ListPricesResolver,
} from "./PriceRequests.js";

/**
 * Create a price
 */
export const create = (
  params: Stripe.PriceCreateParams
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  Effect.request(CreatePriceRequest({ params }), CreatePriceResolver);

/**
 * Retrieve a price
 */
export const retrieve = (
  id: string,
  params?: Stripe.PriceRetrieveParams
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  Effect.request(
    RetrievePriceRequest({ id, params }),
    RetrievePriceResolver
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a price
 */
export const update = (
  id: string,
  params?: Stripe.PriceUpdateParams
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  Effect.request(UpdatePriceRequest({ id, params }), UpdatePriceResolver);

/**
 * List prices
 */
export const list = (
  params?: Stripe.PriceListParams
): Effect.Effect<Stripe.ApiList<Stripe.Price>, StripeError, StripeService> =>
  Effect.request(ListPricesRequest({ params }), ListPricesResolver).pipe(
    Effect.withRequestCaching(true)
  );

/**
 * Price resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Price from "@thomasfosterau/effect-payments-stripe/Price";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a price
 */
export const create = (
  params: Stripe.PriceCreateParams,
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.prices.create(params));

/**
 * Retrieve a price
 */
export const retrieve = (
  id: string,
  params?: Stripe.PriceRetrieveParams,
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.prices.retrieve(id, params));

/**
 * Update a price
 */
export const update = (
  id: string,
  params?: Stripe.PriceUpdateParams,
): Effect.Effect<Stripe.Price, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.prices.update(id, params));

/**
 * List prices
 */
export const list = (
  params?: Stripe.PriceListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Price>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.prices.list(params));

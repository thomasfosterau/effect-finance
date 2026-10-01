/**
 * Price resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Price from "@thomasfosterau/effect-payments-stripe/Price";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create a price
 */
export const create = (
  params: Stripe.PriceCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Price, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/prices", params, options);

/**
 * Retrieve a price
 */
export const retrieve = (
  id: string,
  params?: Stripe.PriceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Price, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/prices/${id}`, params, options);

/**
 * Update a price
 */
export const update = (
  id: string,
  params?: Stripe.PriceUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Price, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/prices/${id}`, params, options);

/**
 * List prices
 */
export const list = (
  params?: Stripe.PriceListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Price>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/prices", params, options);

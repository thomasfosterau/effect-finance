/**
 * Topup resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Topup from "@thomasfosterau/effect-payments-stripe/Topup";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createTopup = (amount: number) =>
 *   Topup.create({
 *     amount,
 *     currency: "usd",
 *     description: "Top-up for account",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const topup = yield* createTopup(1000);
 *   return topup;
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
 * Create a topup
 */
export const create = (
  params: Stripe.TopupCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Topup, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/topups", params, options);

/**
 * Retrieve a topup
 */
export const retrieve = (
  id: string,
  params?: Stripe.TopupRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Topup, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/topups/${id}`, params, options);

/**
 * Update a topup
 */
export const update = (
  id: string,
  params?: Stripe.TopupUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Topup, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/topups/${id}`, params, options);

/**
 * List topups
 */
export const list = (
  params?: Stripe.TopupListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Topup>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/topups", params, options);

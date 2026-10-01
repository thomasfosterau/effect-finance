/**
 * Payout resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Payout from "@thomasfosterau/effect-payments-stripe/Payout";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createPayout = (amount: number, currency: string) =>
 *   Payout.create({ amount, currency });
 *
 * const program = Effect.gen(function* () {
 *   const payout = yield* createPayout(10000, "usd");
 *   return payout;
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
 * Create a payout
 */
export const create = (
  params: Stripe.PayoutCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/payouts", params, options);

/**
 * Retrieve a payout
 */
export const retrieve = (
  id: string,
  params?: Stripe.PayoutRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/payouts/${id}`, params, options);

/**
 * Update a payout
 */
export const update = (
  id: string,
  params?: Stripe.PayoutUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payouts/${id}`, params, options);

/**
 * Cancel a payout
 */
export const cancel = (
  id: string,
  params?: Stripe.PayoutCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payouts/${id}/cancel`, params, options);

/**
 * List payouts
 */
export const list = (
  params?: Stripe.PayoutListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Payout>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/payouts", params, options);

/**
 * Coupon resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Coupon from "@thomasfosterau/effect-payments-stripe/Coupon";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createCoupon = (percentOff: number) =>
 *   Coupon.create({ percent_off: percentOff, duration: "once" });
 *
 * const program = Effect.gen(function* () {
 *   const coupon = yield* createCoupon(25);
 *   return coupon;
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
 * Create a coupon
 */
export const create = (
  params: Stripe.CouponCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Coupon, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/coupons", params, options);

/**
 * Retrieve a coupon
 */
export const retrieve = (
  id: string,
  params?: Stripe.CouponRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Coupon, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/coupons/${id}`, params, options);

/**
 * Update a coupon
 */
export const update = (
  id: string,
  params?: Stripe.CouponUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Coupon, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/coupons/${id}`, params, options);

/**
 * Delete a coupon
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedCoupon, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/coupons/${id}`, undefined, options);

/**
 * List coupons
 */
export const list = (
  params?: Stripe.CouponListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Coupon>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/coupons", params, options);

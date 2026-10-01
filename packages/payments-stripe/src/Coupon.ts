/**
 * Stripe's `/v1/coupons` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a coupon (`POST /v1/coupons`).
 */
export const create = (
  params: Stripe.CouponCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Coupon, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/coupons", params, options);

/**
 * Retrieve a coupon (`GET /v1/coupons/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.CouponRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Coupon, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/coupons/${id}`, params, options);

/**
 * Update a coupon (`POST /v1/coupons/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.CouponUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Coupon, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/coupons/${id}`, params, options);

/**
 * Delete a coupon (`DELETE /v1/coupons/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedCoupon, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/coupons/${id}`, undefined, options);

/**
 * List coupons (`GET /v1/coupons`).
 */
export const list = (
  params?: Stripe.CouponListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Coupon>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/coupons", params, options);

/**
 * Coupon resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Coupon from "@thomasfosterau/effect-payments-stripe/Coupon";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createCoupon = (percentOff: number) =>
 *   Coupon.create({ percent_off: percentOff, duration: "once" });
 *
 * const program = Effect.gen(function* () {
 *   const coupon = yield* createCoupon(25);
 *   return coupon;
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
 * Create a coupon
 */
export const create = (
  params: Stripe.CouponCreateParams,
): Effect.Effect<Stripe.Coupon, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.coupons.create(params));

/**
 * Retrieve a coupon
 */
export const retrieve = (
  id: string,
  params?: Stripe.CouponRetrieveParams,
): Effect.Effect<Stripe.Coupon, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.coupons.retrieve(id, params));

/**
 * Update a coupon
 */
export const update = (
  id: string,
  params?: Stripe.CouponUpdateParams,
): Effect.Effect<Stripe.Coupon, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.coupons.update(id, params));

/**
 * Delete a coupon
 */
export const del = (id: string): Effect.Effect<Stripe.DeletedCoupon, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.coupons.del(id));

/**
 * List coupons
 */
export const list = (
  params?: Stripe.CouponListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Coupon>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.coupons.list(params));

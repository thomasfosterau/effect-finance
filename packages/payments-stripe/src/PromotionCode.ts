/**
 * PromotionCode resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as PromotionCode from "@thomasfosterau/effect-payments-stripe/PromotionCode";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createPromoCode = (couponId: string, code: string) =>
 *   PromotionCode.create({ coupon: couponId, code });
 *
 * const program = Effect.gen(function* () {
 *   const promoCode = yield* createPromoCode("coupon_123", "SAVE10");
 *   return promoCode;
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
 * Create a promotion code
 */
export const create = (
  params: Stripe.PromotionCodeCreateParams,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.promotionCodes.create(params));

/**
 * Retrieve a promotion code
 */
export const retrieve = (
  id: string,
  params?: Stripe.PromotionCodeRetrieveParams,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.promotionCodes.retrieve(id, params));

/**
 * Update a promotion code
 */
export const update = (
  id: string,
  params?: Stripe.PromotionCodeUpdateParams,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.promotionCodes.update(id, params));

/**
 * List promotion codes
 */
export const list = (
  params?: Stripe.PromotionCodeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.PromotionCode>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.promotionCodes.list(params));

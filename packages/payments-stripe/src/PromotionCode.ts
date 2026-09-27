/**
 * PromotionCode resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as PromotionCode from "@thomasfosterau/effect-payments-stripe/PromotionCode";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createPromoCode = (couponId: string, code: string) =>
 *   PromotionCode.create({ coupon: couponId, code });
 *
 * const program = Effect.gen(function* () {
 *   const promoCode = yield* createPromoCode("coupon_123", "SAVE10");
 *   return promoCode;
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
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create a promotion code
 */
export const create = (
  params: Stripe.PromotionCodeCreateParams,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/promotion_codes", params);

/**
 * Retrieve a promotion code
 */
export const retrieve = (
  id: string,
  params?: Stripe.PromotionCodeRetrieveParams,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/promotion_codes/${id}`, params);

/**
 * Update a promotion code
 */
export const update = (
  id: string,
  params?: Stripe.PromotionCodeUpdateParams,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/promotion_codes/${id}`, params);

/**
 * List promotion codes
 */
export const list = (
  params?: Stripe.PromotionCodeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.PromotionCode>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/promotion_codes", params);

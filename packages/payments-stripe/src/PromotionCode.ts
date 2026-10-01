/**
 * Stripe's `/v1/promotion_codes` API as a raw resource module, the escape hatch
 * for what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a promotion code (`POST /v1/promotion_codes`).
 */
export const create = (
  params: Stripe.PromotionCodeCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/promotion_codes", params, options);

/**
 * Retrieve a promotion code (`GET /v1/promotion_codes/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.PromotionCodeRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/promotion_codes/${id}`, params, options);

/**
 * Update a promotion code (`POST /v1/promotion_codes/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.PromotionCodeUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PromotionCode, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/promotion_codes/${id}`, params, options);

/**
 * List promotion codes (`GET /v1/promotion_codes`).
 */
export const list = (
  params?: Stripe.PromotionCodeListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.PromotionCode>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/promotion_codes", params, options);

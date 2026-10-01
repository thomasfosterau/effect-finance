/**
 * Stripe's `/v1/refunds` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded; prefer the neutral
 * `Refunds` capability where it covers the call.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a refund (`POST /v1/refunds`).
 */
export const create = (
  params: Stripe.RefundCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Refund, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/refunds", params, options);

/**
 * Retrieve a refund (`GET /v1/refunds/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.RefundRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Refund, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/refunds/${id}`, params, options);

/**
 * Update a refund (`POST /v1/refunds/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.RefundUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Refund, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/refunds/${id}`, params, options);

/**
 * List refunds (`GET /v1/refunds`).
 */
export const list = (
  params?: Stripe.RefundListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Refund>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/refunds", params, options);

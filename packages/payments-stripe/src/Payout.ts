/**
 * Stripe's `/v1/payouts` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
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
 * Create a payout (`POST /v1/payouts`).
 */
export const create = (
  params: Stripe.PayoutCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/payouts", params, options);

/**
 * Retrieve a payout (`GET /v1/payouts/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.PayoutRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/payouts/${id}`, params, options);

/**
 * Update a payout (`POST /v1/payouts/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.PayoutUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payouts/${id}`, params, options);

/**
 * Cancel a payout (`POST /v1/payouts/{id}/cancel`).
 */
export const cancel = (
  id: string,
  params?: Stripe.PayoutCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Payout, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payouts/${id}/cancel`, params, options);

/**
 * List payouts (`GET /v1/payouts`).
 */
export const list = (
  params?: Stripe.PayoutListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Payout>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/payouts", params, options);

/**
 * Stripe's `/v1/topups` API as a raw resource module, the escape hatch for what
 * the neutral capabilities do not cover. Results are typed with the `stripe`
 * package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a topup (`POST /v1/topups`).
 */
export const create = (
  params: Stripe.TopupCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Topup, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/topups", params, options);

/**
 * Retrieve a topup (`GET /v1/topups/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.TopupRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Topup, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/topups/${id}`, params, options);

/**
 * Update a topup (`POST /v1/topups/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.TopupUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Topup, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/topups/${id}`, params, options);

/**
 * List topups (`GET /v1/topups`).
 */
export const list = (
  params?: Stripe.TopupListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Topup>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/topups", params, options);

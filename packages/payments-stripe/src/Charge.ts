/**
 * Stripe's `/v1/charges` API as a raw resource module, the escape hatch for
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
 * Create a charge (`POST /v1/charges`).
 */
export const create = (
  params: Stripe.ChargeCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Charge, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/charges", params, options);

/**
 * Retrieve a charge (`GET /v1/charges/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.ChargeRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Charge, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/charges/${id}`, params, options);

/**
 * Update a charge (`POST /v1/charges/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.ChargeUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Charge, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/charges/${id}`, params, options);

/**
 * List charges (`GET /v1/charges`).
 */
export const list = (
  params?: Stripe.ChargeListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Charge>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/charges", params, options);

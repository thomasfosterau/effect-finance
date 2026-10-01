/**
 * Stripe's `/v1/issuing/cardholders` API as a raw resource module, the escape
 * hatch for what the neutral capabilities do not cover. Results are typed with
 * the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create an issuing cardholder (`POST /v1/issuing/cardholders`).
 */
export const create = (
  params: Stripe.Issuing.CardholderCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/issuing/cardholders", params, options);

/**
 * Retrieve an issuing cardholder (`GET /v1/issuing/cardholders/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardholderRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/cardholders/${id}`, params, options);

/**
 * Update an issuing cardholder (`POST /v1/issuing/cardholders/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardholderUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/cardholders/${id}`, params, options);

/**
 * List issuing cardholders (`GET /v1/issuing/cardholders`).
 */
export const list = (
  params?: Stripe.Issuing.CardholderListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Cardholder>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/cardholders", params, options);

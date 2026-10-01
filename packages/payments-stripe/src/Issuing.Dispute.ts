/**
 * Stripe's `/v1/issuing/disputes` API as a raw resource module, the escape
 * hatch for what the neutral capabilities do not cover. Results are typed with
 * the `stripe` package's declarations and are not decoded.
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
 * Create an issuing dispute (`POST /v1/issuing/disputes`).
 */
export const create = (
  params: Stripe.Issuing.DisputeCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/issuing/disputes", params, options);

/**
 * Retrieve an issuing dispute (`GET /v1/issuing/disputes/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.DisputeRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/disputes/${id}`, params, options);

/**
 * Update an issuing dispute (`POST /v1/issuing/disputes/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.DisputeUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/disputes/${id}`, params, options);

/**
 * List issuing disputes (`GET /v1/issuing/disputes`).
 */
export const list = (
  params?: Stripe.Issuing.DisputeListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Dispute>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/disputes", params, options);

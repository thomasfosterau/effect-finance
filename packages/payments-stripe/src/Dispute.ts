/**
 * Stripe's `/v1/disputes` API as a raw resource module, the escape hatch for
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
 * Retrieve a dispute (`GET /v1/disputes/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.DisputeRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Dispute, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/disputes/${id}`, params, options);

/**
 * Update a dispute (`POST /v1/disputes/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.DisputeUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Dispute, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/disputes/${id}`, params, options);

/**
 * List disputes (`GET /v1/disputes`).
 */
export const list = (
  params?: Stripe.DisputeListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Dispute>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/disputes", params, options);

/**
 * Stripe's `/v1/transfers` API as a raw resource module, the escape hatch for
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
 * Create a transfer (`POST /v1/transfers`).
 */
export const create = (
  params: Stripe.TransferCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Transfer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/transfers", params, options);

/**
 * Retrieve a transfer (`GET /v1/transfers/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.TransferRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Transfer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/transfers/${id}`, params, options);

/**
 * Update a transfer (`POST /v1/transfers/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.TransferUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Transfer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/transfers/${id}`, params, options);

/**
 * List transfers (`GET /v1/transfers`).
 */
export const list = (
  params?: Stripe.TransferListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Transfer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/transfers", params, options);

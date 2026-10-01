/**
 * Stripe's `/v1/terminal/readers` API as a raw resource module, the escape
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
 * Create a terminal reader (`POST /v1/terminal/readers`).
 */
export const create = (
  params: Stripe.Terminal.ReaderCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/terminal/readers", params, options);

/**
 * Retrieve a terminal reader (`GET /v1/terminal/readers/{id}`). Stripe answers a
 * deleted one with its `{ deleted: true }` stub, so the result is the SDK's
 * `Reader | DeletedReader`.
 */
export const retrieve = (
  id: string,
  params?: Stripe.Terminal.ReaderRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.Reader | Stripe.Terminal.DeletedReader, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/terminal/readers/${id}`, params, options);

/**
 * Update a terminal reader (`POST /v1/terminal/readers/{id}`). Stripe answers a
 * deleted one with its `{ deleted: true }` stub, so the result is the SDK's
 * `Reader | DeletedReader`.
 */
export const update = (
  id: string,
  params?: Stripe.Terminal.ReaderUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.Reader | Stripe.Terminal.DeletedReader, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/terminal/readers/${id}`, params, options);

/**
 * Delete a terminal reader (`DELETE /v1/terminal/readers/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.DeletedReader, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/terminal/readers/${id}`, undefined, options);

/**
 * List terminal readers (`GET /v1/terminal/readers`).
 */
export const list = (
  params?: Stripe.Terminal.ReaderListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Terminal.Reader>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/terminal/readers", params, options);

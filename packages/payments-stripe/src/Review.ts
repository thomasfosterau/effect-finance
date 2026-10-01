/**
 * Stripe's `/v1/reviews` API as a raw resource module, the escape hatch for
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
 * Retrieve a review (`GET /v1/reviews/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.ReviewRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Review, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/reviews/${id}`, params, options);

/**
 * List reviews (`GET /v1/reviews`).
 */
export const list = (
  params?: Stripe.ReviewListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Review>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/reviews", params, options);

/**
 * Approve a review (`POST /v1/reviews/{id}/approve`).
 */
export const approve = (
  id: string,
  params?: Stripe.ReviewApproveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Review, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/reviews/${id}/approve`, params, options);

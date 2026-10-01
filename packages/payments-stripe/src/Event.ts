/**
 * Stripe's `/v1/events` API as a raw resource module, the escape hatch for what
 * the neutral capabilities do not cover. Results are typed with the `stripe`
 * package's declarations and are not decoded.
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
 * Retrieve an event (`GET /v1/events/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.EventRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Event, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/events/${id}`, params, options);

/**
 * List events (`GET /v1/events`).
 */
export const list = (
  params?: Stripe.EventListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Event>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/events", params, options);

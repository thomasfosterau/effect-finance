/**
 * Stripe's `/v1/subscriptions` API as a raw resource module, the escape hatch
 * for what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded; prefer the neutral
 * `Subscriptions` capability where it covers the call.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a subscription (`POST /v1/subscriptions`).
 */
export const create = (
  params: Stripe.SubscriptionCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/subscriptions", params, options);

/**
 * Retrieve a subscription (`GET /v1/subscriptions/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/subscriptions/${id}`, params, options);

/**
 * Update a subscription (`POST /v1/subscriptions/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscriptions/${id}`, params, options);

/**
 * Cancel a subscription (`DELETE /v1/subscriptions/{id}`).
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/subscriptions/${id}`, params, options);

/**
 * List subscriptions (`GET /v1/subscriptions`).
 */
export const list = (
  params?: Stripe.SubscriptionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Subscription>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/subscriptions", params, options);

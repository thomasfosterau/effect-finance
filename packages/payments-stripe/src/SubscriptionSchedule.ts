/**
 * Stripe's `/v1/subscription_schedules` API as a raw resource module, the
 * escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
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
 * Create a subscription schedule (`POST /v1/subscription_schedules`).
 */
export const create = (
  params?: Stripe.SubscriptionScheduleCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/subscription_schedules", params, options);

/**
 * Retrieve a subscription schedule (`GET /v1/subscription_schedules/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionScheduleRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/subscription_schedules/${id}`, params, options);

/**
 * Update a subscription schedule (`POST /v1/subscription_schedules/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionScheduleUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}`, params, options);

/**
 * Cancel a subscription schedule
 * (`POST /v1/subscription_schedules/{id}/cancel`).
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionScheduleCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}/cancel`, params, options);

/**
 * Release a subscription schedule
 * (`POST /v1/subscription_schedules/{id}/release`).
 */
export const release = (
  id: string,
  params?: Stripe.SubscriptionScheduleReleaseParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}/release`, params, options);

/**
 * List subscription schedules (`GET /v1/subscription_schedules`).
 */
export const list = (
  params?: Stripe.SubscriptionScheduleListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.SubscriptionSchedule>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/subscription_schedules", params, options);

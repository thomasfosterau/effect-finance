/**
 * Stripe's `/v1/subscription_schedules` API as a raw resource module, the
 * escape hatch for what the neutral capabilities do not cover.
 *
 * Like {@link "./Customer"}, typed by a schema **generated** from Stripe's
 * OpenAPI spec at the pinned API version (not by the `stripe` package), with
 * every response decoded at the boundary: a body that does not match fails
 * with `PaymentProviderError`. An expandable field (`customer`,
 * `subscription`, `test_clock`, …) decodes as its id or, when expanded, an
 * open JSON object. Response enumerations (`status`, `end_behavior`, …) are
 * lenient: a value Stripe adds later decodes as `Enumeration.Other`. Request
 * enumerations stay closed.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import * as Generated from "./internal/generated/schemas.js";
import { stripeRequestDecoded } from "./internal/decode.js";
import { path, type StripeError } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/** The Subscription Schedule object, as a `Schema` (the decoder for every single-schedule response). */
export const SubscriptionSchedule = Generated.Subscription_schedule;
/** The Subscription Schedule object. */
export type SubscriptionSchedule = Generated.Subscription_schedule;

/** A page of subscription schedules, as a `Schema`. */
export const SubscriptionScheduleList = Generated.GetSubscriptionSchedules200;
/** A page of subscription schedules. */
export type SubscriptionScheduleList = Generated.GetSubscriptionSchedules200;

/** The parameters of {@link create}. */
export type SubscriptionScheduleCreateParams =
  Generated.PostSubscriptionSchedulesRequestFormUrlEncoded;
/** The parameters of {@link retrieve}. */
export type SubscriptionScheduleRetrieveParams = Generated.GetSubscriptionSchedulesScheduleParams;
/** The parameters of {@link update}. */
export type SubscriptionScheduleUpdateParams =
  Generated.PostSubscriptionSchedulesScheduleRequestFormUrlEncoded;
/** The parameters of {@link cancel}. */
export type SubscriptionScheduleCancelParams =
  Generated.PostSubscriptionSchedulesScheduleCancelRequestFormUrlEncoded;
/** The parameters of {@link release}. */
export type SubscriptionScheduleReleaseParams =
  Generated.PostSubscriptionSchedulesScheduleReleaseRequestFormUrlEncoded;
/**
 * The parameters of {@link list}. The date filters (`created`, `canceled_at`,
 * `completed_at`, `released_at`) take a timestamp or a `{ gt, gte, lt, lte }`
 * range.
 */
export type SubscriptionScheduleListParams = Generated.GetSubscriptionSchedulesParams;

/**
 * Create a subscription schedule (`POST /v1/subscription_schedules`).
 */
export const create = (
  params?: SubscriptionScheduleCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription schedule",
    SubscriptionSchedule,
    "POST",
    "/v1/subscription_schedules",
    params,
    options,
  );

/**
 * Retrieve a subscription schedule (`GET /v1/subscription_schedules/{id}`).
 */
export const retrieve = (
  id: string,
  params?: SubscriptionScheduleRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription schedule",
    SubscriptionSchedule,
    "GET",
    path`/v1/subscription_schedules/${id}`,
    params,
    options,
  );

/**
 * Update a subscription schedule (`POST /v1/subscription_schedules/{id}`).
 */
export const update = (
  id: string,
  params?: SubscriptionScheduleUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription schedule",
    SubscriptionSchedule,
    "POST",
    path`/v1/subscription_schedules/${id}`,
    params,
    options,
  );

/**
 * Cancel a subscription schedule
 * (`POST /v1/subscription_schedules/{id}/cancel`).
 */
export const cancel = (
  id: string,
  params?: SubscriptionScheduleCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription schedule",
    SubscriptionSchedule,
    "POST",
    path`/v1/subscription_schedules/${id}/cancel`,
    params,
    options,
  );

/**
 * Release a subscription schedule
 * (`POST /v1/subscription_schedules/{id}/release`).
 */
export const release = (
  id: string,
  params?: SubscriptionScheduleReleaseParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription schedule",
    SubscriptionSchedule,
    "POST",
    path`/v1/subscription_schedules/${id}/release`,
    params,
    options,
  );

/**
 * List subscription schedules (`GET /v1/subscription_schedules`).
 */
export const list = (
  params?: SubscriptionScheduleListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SubscriptionScheduleList, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription schedule list",
    SubscriptionScheduleList,
    "GET",
    "/v1/subscription_schedules",
    params,
    options,
  );

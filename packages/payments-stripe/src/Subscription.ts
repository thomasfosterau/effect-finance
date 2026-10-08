/**
 * Stripe's `/v1/subscriptions` API as a raw resource module, the escape hatch
 * for what the neutral capabilities do not cover; prefer the neutral
 * `Subscriptions` capability where it covers the call.
 *
 * Like {@link "./Customer"}, typed by a schema **generated** from Stripe's
 * OpenAPI spec at the pinned API version (not by the `stripe` package), with
 * every response decoded at the boundary: a body that does not match fails
 * with `PaymentProviderError`. An expandable field (`customer`,
 * `latest_invoice`, `default_payment_method`, `pending_setup_intent`,
 * `schedule`, …) decodes as its id or, when expanded, an open JSON object.
 * Response enumerations (`status`, `collection_method`, …) are lenient: a
 * value Stripe adds later decodes as `Enumeration.Other`. Request enumerations
 * stay closed.
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

/** The Subscription object, as a `Schema` (the decoder for every single-subscription response). */
export const Subscription = Generated.Subscription;
/** The Subscription object. */
export type Subscription = Generated.Subscription;

/** A page of subscriptions, as a `Schema`. */
export const SubscriptionList = Generated.GetSubscriptions200;
/** A page of subscriptions. */
export type SubscriptionList = Generated.GetSubscriptions200;

/** The parameters of {@link create}. */
export type SubscriptionCreateParams = Generated.PostSubscriptionsRequestFormUrlEncoded;
/** The parameters of {@link retrieve}. */
export type SubscriptionRetrieveParams = Generated.GetSubscriptionsSubscriptionExposedIdParams;
/** The parameters of {@link update}. */
export type SubscriptionUpdateParams =
  Generated.PostSubscriptionsSubscriptionExposedIdRequestFormUrlEncoded;
/** The parameters of {@link cancel}. */
export type SubscriptionCancelParams =
  Generated.DeleteSubscriptionsSubscriptionExposedIdRequestFormUrlEncoded;
/**
 * The parameters of {@link list}. A `deepObject` query parameter is a flat,
 * bracketed key (`"automatic_tax[enabled]": true`, which is also its wire
 * name), not a nested object; the date filters (`created`,
 * `current_period_end`, `current_period_start`) are the exception, since
 * Stripe's spec gives them a `number | { gt, gte, lt, lte }` schema.
 */
export type SubscriptionListParams = Generated.GetSubscriptionsParams;

/**
 * Create a subscription (`POST /v1/subscriptions`).
 */
export const create = (
  params: SubscriptionCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Subscription, StripeError, StripeHttp> =>
  stripeRequestDecoded("subscription", Subscription, "POST", "/v1/subscriptions", params, options);

/**
 * Retrieve a subscription (`GET /v1/subscriptions/{id}`).
 */
export const retrieve = (
  id: string,
  params?: SubscriptionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Subscription, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription",
    Subscription,
    "GET",
    path`/v1/subscriptions/${id}`,
    params,
    options,
  );

/**
 * Update a subscription (`POST /v1/subscriptions/{id}`).
 */
export const update = (
  id: string,
  params?: SubscriptionUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Subscription, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription",
    Subscription,
    "POST",
    path`/v1/subscriptions/${id}`,
    params,
    options,
  );

/**
 * Cancel a subscription (`DELETE /v1/subscriptions/{id}`). Stripe answers
 * with the canceled subscription, not a deleted object.
 */
export const cancel = (
  id: string,
  params?: SubscriptionCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Subscription, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription",
    Subscription,
    "DELETE",
    path`/v1/subscriptions/${id}`,
    params,
    options,
  );

/**
 * List subscriptions (`GET /v1/subscriptions`).
 */
export const list = (
  params?: SubscriptionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<SubscriptionList, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "subscription list",
    SubscriptionList,
    "GET",
    "/v1/subscriptions",
    params,
    options,
  );

/**
 * SubscriptionSchedule resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as SubscriptionSchedule from "@thomasfosterau/effect-payments-stripe/SubscriptionSchedule";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createSchedule = (customerId: string, phases: object[]) =>
 *   SubscriptionSchedule.create({ customer: customerId, phases });
 *
 * const program = Effect.gen(function* () {
 *   const schedule = yield* createSchedule("cus_123", [{ items: [{ price: "price_123" }] }]);
 *   return schedule;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a subscription schedule
 */
export const create = (
  params?: Stripe.SubscriptionScheduleCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/subscription_schedules", params, options);

/**
 * Retrieve a subscription schedule
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionScheduleRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/subscription_schedules/${id}`, params, options);

/**
 * Update a subscription schedule
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionScheduleUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}`, params, options);

/**
 * Cancel a subscription schedule
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionScheduleCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}/cancel`, params, options);

/**
 * Release a subscription schedule
 */
export const release = (
  id: string,
  params?: Stripe.SubscriptionScheduleReleaseParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}/release`, params, options);

/**
 * List subscription schedules
 */
export const list = (
  params?: Stripe.SubscriptionScheduleListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.SubscriptionSchedule>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/subscription_schedules", params, options);

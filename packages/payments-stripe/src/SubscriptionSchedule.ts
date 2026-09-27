/**
 * SubscriptionSchedule resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
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
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create a subscription schedule
 */
export const create = (
  params?: Stripe.SubscriptionScheduleCreateParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/subscription_schedules", params);

/**
 * Retrieve a subscription schedule
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionScheduleRetrieveParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/subscription_schedules/${id}`, params);

/**
 * Update a subscription schedule
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionScheduleUpdateParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}`, params);

/**
 * Cancel a subscription schedule
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionScheduleCancelParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}/cancel`, params);

/**
 * Release a subscription schedule
 */
export const release = (
  id: string,
  params?: Stripe.SubscriptionScheduleReleaseParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscription_schedules/${id}/release`, params);

/**
 * List subscription schedules
 */
export const list = (
  params?: Stripe.SubscriptionScheduleListParams,
): Effect.Effect<Stripe.ApiList<Stripe.SubscriptionSchedule>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/subscription_schedules", params);

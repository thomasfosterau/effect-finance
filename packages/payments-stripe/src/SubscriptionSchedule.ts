/**
 * SubscriptionSchedule resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as SubscriptionSchedule from "@thomasfosterau/effect-payments-stripe/SubscriptionSchedule";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createSchedule = (customerId: string, phases: object[]) =>
 *   SubscriptionSchedule.create({ customer: customerId, phases });
 *
 * const program = Effect.gen(function* () {
 *   const schedule = yield* createSchedule("cus_123", [{ items: [{ price: "price_123" }] }]);
 *   return schedule;
 * });
 *
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a subscription schedule
 */
export const create = (
  params?: Stripe.SubscriptionScheduleCreateParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptionSchedules.create(params));

/**
 * Retrieve a subscription schedule
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionScheduleRetrieveParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptionSchedules.retrieve(id, params));

/**
 * Update a subscription schedule
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionScheduleUpdateParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptionSchedules.update(id, params));

/**
 * Cancel a subscription schedule
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionScheduleCancelParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptionSchedules.cancel(id, params));

/**
 * Release a subscription schedule
 */
export const release = (
  id: string,
  params?: Stripe.SubscriptionScheduleReleaseParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptionSchedules.release(id, params));

/**
 * List subscription schedules
 */
export const list = (
  params?: Stripe.SubscriptionScheduleListParams,
): Effect.Effect<Stripe.ApiList<Stripe.SubscriptionSchedule>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptionSchedules.list(params));

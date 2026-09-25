/**
 * Subscription resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Subscription from "@thomasfosterau/effect-payments-stripe/Subscription";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createSubscription = (customerId: string, priceId: string) =>
 *   Subscription.create({
 *     customer: customerId,
 *     items: [{ price: priceId }],
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const subscription = yield* createSubscription("cus_123", "price_123");
 *   return subscription;
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
 * Create a subscription
 */
export const create = (
  params: Stripe.SubscriptionCreateParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptions.create(params));

/**
 * Retrieve a subscription
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionRetrieveParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptions.retrieve(id, params));

/**
 * Update a subscription
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionUpdateParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptions.update(id, params));

/**
 * Cancel a subscription
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionCancelParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptions.cancel(id, params));

/**
 * List subscriptions
 */
export const list = (
  params?: Stripe.SubscriptionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Subscription>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.subscriptions.list(params));

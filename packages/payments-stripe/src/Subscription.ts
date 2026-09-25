/**
 * Subscription resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Subscription from "@thomasfosterau/effect-payments-stripe/Subscription";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create a subscription
 */
export const create = (
  params: Stripe.SubscriptionCreateParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/subscriptions", params);

/**
 * Retrieve a subscription
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionRetrieveParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/subscriptions/${id}`, params);

/**
 * Update a subscription
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionUpdateParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/subscriptions/${id}`, params);

/**
 * Cancel a subscription
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionCancelParams,
): Effect.Effect<Stripe.Subscription, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/subscriptions/${id}`, params);

/**
 * List subscriptions
 */
export const list = (
  params?: Stripe.SubscriptionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Subscription>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/subscriptions", params);

/**
 * Subscription resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Subscription from "@thomasfosterau/effect-stripe/Subscription";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
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

import { Effect, RequestResolver } from "effect";
import type Stripe from "stripe";
import { type StripeError } from "./internal.js";
import type { StripeService } from "./Stripe.js";
import {
  CreateSubscriptionRequest,
  CreateSubscriptionResolver,
  RetrieveSubscriptionRequest,
  RetrieveSubscriptionResolver,
  UpdateSubscriptionRequest,
  UpdateSubscriptionResolver,
  CancelSubscriptionRequest,
  CancelSubscriptionResolver,
  ListSubscriptionsRequest,
  ListSubscriptionsResolver,
} from "./SubscriptionRequests.js";

/**
 * Create a subscription
 */
export const create = (
  params: Stripe.SubscriptionCreateParams
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  Effect.request(
    CreateSubscriptionRequest({ params }),
    RequestResolver.contextFromEffect(CreateSubscriptionResolver)
  );

/**
 * Retrieve a subscription
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionRetrieveParams
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  Effect.request(
    RetrieveSubscriptionRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveSubscriptionResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a subscription
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionUpdateParams
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  Effect.request(
    UpdateSubscriptionRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateSubscriptionResolver)
  );

/**
 * Cancel a subscription
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionCancelParams
): Effect.Effect<Stripe.Subscription, StripeError, StripeService> =>
  Effect.request(
    CancelSubscriptionRequest({ id, params }),
    RequestResolver.contextFromEffect(CancelSubscriptionResolver)
  );

/**
 * List subscriptions
 */
export const list = (
  params?: Stripe.SubscriptionListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Subscription>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListSubscriptionsRequest({ params }),
    RequestResolver.contextFromEffect(ListSubscriptionsResolver)
  ).pipe(Effect.withRequestCaching(true));

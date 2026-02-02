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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a subscription
 */
interface CreateSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "CreateSubscriptionRequest";
  readonly params: Stripe.SubscriptionCreateParams;
}

const CreateSubscriptionRequest =
  Request.tagged<CreateSubscriptionRequest>("CreateSubscriptionRequest");

const CreateSubscriptionResolver: RequestResolver.RequestResolver<CreateSubscriptionRequest, StripeService> =
  makeStripeResolver<CreateSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.create(request.params)
  );

/**
 * Request to retrieve a subscription
 */
interface RetrieveSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "RetrieveSubscriptionRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionRetrieveParams;
}

const RetrieveSubscriptionRequest =
  Request.tagged<RetrieveSubscriptionRequest>("RetrieveSubscriptionRequest");

const RetrieveSubscriptionResolver: RequestResolver.RequestResolver<RetrieveSubscriptionRequest, StripeService> =
  makeStripeResolver<RetrieveSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.retrieve(request.id, request.params)
  );

/**
 * Request to update a subscription
 */
interface UpdateSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "UpdateSubscriptionRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionUpdateParams;
}

const UpdateSubscriptionRequest =
  Request.tagged<UpdateSubscriptionRequest>("UpdateSubscriptionRequest");

const UpdateSubscriptionResolver: RequestResolver.RequestResolver<UpdateSubscriptionRequest, StripeService> =
  makeStripeResolver<UpdateSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.update(request.id, request.params)
  );

/**
 * Request to cancel a subscription
 */
interface CancelSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "CancelSubscriptionRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionCancelParams;
}

const CancelSubscriptionRequest =
  Request.tagged<CancelSubscriptionRequest>("CancelSubscriptionRequest");

const CancelSubscriptionResolver: RequestResolver.RequestResolver<CancelSubscriptionRequest, StripeService> =
  makeStripeResolver<CancelSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.cancel(request.id, request.params)
  );

/**
 * Request to list subscriptions
 */
interface ListSubscriptionsRequest
  extends Request.Request<Stripe.ApiList<Stripe.Subscription>, StripeError> {
  readonly _tag: "ListSubscriptionsRequest";
  readonly params?: Stripe.SubscriptionListParams;
}

const ListSubscriptionsRequest =
  Request.tagged<ListSubscriptionsRequest>("ListSubscriptionsRequest");

const ListSubscriptionsResolver: RequestResolver.RequestResolver<ListSubscriptionsRequest, StripeService> =
  makeStripeResolver<ListSubscriptionsRequest>(
    (stripe, request) =>
      stripe.subscriptions.list(request.params)
  );

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

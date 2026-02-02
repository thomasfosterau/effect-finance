/**
 * Subscription Request types and resolvers using Effect's RequestResolver pattern
 */

import { Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import {
  makeStripeResolver,
  type StripeError,
} from "./internal.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a subscription
 */
export interface CreateSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "CreateSubscriptionRequest";
  readonly params: Stripe.SubscriptionCreateParams;
}

export const CreateSubscriptionRequest =
  Request.tagged<CreateSubscriptionRequest>("CreateSubscriptionRequest");

export const CreateSubscriptionResolver: RequestResolver.RequestResolver<CreateSubscriptionRequest, StripeService> =
  makeStripeResolver<CreateSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.create(request.params)
  );

/**
 * Request to retrieve a subscription
 */
export interface RetrieveSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "RetrieveSubscriptionRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionRetrieveParams;
}

export const RetrieveSubscriptionRequest =
  Request.tagged<RetrieveSubscriptionRequest>("RetrieveSubscriptionRequest");

export const RetrieveSubscriptionResolver: RequestResolver.RequestResolver<RetrieveSubscriptionRequest, StripeService> =
  makeStripeResolver<RetrieveSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.retrieve(request.id, request.params)
  );

/**
 * Request to update a subscription
 */
export interface UpdateSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "UpdateSubscriptionRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionUpdateParams;
}

export const UpdateSubscriptionRequest =
  Request.tagged<UpdateSubscriptionRequest>("UpdateSubscriptionRequest");

export const UpdateSubscriptionResolver: RequestResolver.RequestResolver<UpdateSubscriptionRequest, StripeService> =
  makeStripeResolver<UpdateSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.update(request.id, request.params)
  );

/**
 * Request to cancel a subscription
 */
export interface CancelSubscriptionRequest
  extends Request.Request<Stripe.Subscription, StripeError> {
  readonly _tag: "CancelSubscriptionRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionCancelParams;
}

export const CancelSubscriptionRequest =
  Request.tagged<CancelSubscriptionRequest>("CancelSubscriptionRequest");

export const CancelSubscriptionResolver: RequestResolver.RequestResolver<CancelSubscriptionRequest, StripeService> =
  makeStripeResolver<CancelSubscriptionRequest>(
    (stripe, request) =>
      stripe.subscriptions.cancel(request.id, request.params)
  );

/**
 * Request to list subscriptions
 */
export interface ListSubscriptionsRequest
  extends Request.Request<Stripe.ApiList<Stripe.Subscription>, StripeError> {
  readonly _tag: "ListSubscriptionsRequest";
  readonly params?: Stripe.SubscriptionListParams;
}

export const ListSubscriptionsRequest =
  Request.tagged<ListSubscriptionsRequest>("ListSubscriptionsRequest");

export const ListSubscriptionsResolver: RequestResolver.RequestResolver<ListSubscriptionsRequest, StripeService> =
  makeStripeResolver<ListSubscriptionsRequest>(
    (stripe, request) =>
      stripe.subscriptions.list(request.params)
  );

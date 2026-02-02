/**
 * PaymentIntent Request types and resolvers using Effect's RequestResolver pattern
 */

import { Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import {
  makeStripeResolver,
  type StripeError,
} from "./internal.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create a payment intent
 */
export interface CreatePaymentIntentRequest
  extends Request.Request<Stripe.PaymentIntent, StripeError> {
  readonly _tag: "CreatePaymentIntentRequest";
  readonly params: Stripe.PaymentIntentCreateParams;
}

export const CreatePaymentIntentRequest =
  Request.tagged<CreatePaymentIntentRequest>("CreatePaymentIntentRequest");

export const CreatePaymentIntentResolver: RequestResolver.RequestResolver<CreatePaymentIntentRequest, StripeService> =
  makeStripeResolver<CreatePaymentIntentRequest>(
    (stripe, request) =>
      stripe.paymentIntents.create(request.params)
  );

/**
 * Request to retrieve a payment intent
 */
export interface RetrievePaymentIntentRequest
  extends Request.Request<Stripe.PaymentIntent, StripeError> {
  readonly _tag: "RetrievePaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentRetrieveParams;
}

export const RetrievePaymentIntentRequest =
  Request.tagged<RetrievePaymentIntentRequest>("RetrievePaymentIntentRequest");

export const RetrievePaymentIntentResolver: RequestResolver.RequestResolver<RetrievePaymentIntentRequest, StripeService> =
  makeStripeResolver<RetrievePaymentIntentRequest>(
    (stripe, request) =>
      stripe.paymentIntents.retrieve(request.id, request.params)
  );

/**
 * Request to update a payment intent
 */
export interface UpdatePaymentIntentRequest
  extends Request.Request<Stripe.PaymentIntent, StripeError> {
  readonly _tag: "UpdatePaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentUpdateParams;
}

export const UpdatePaymentIntentRequest =
  Request.tagged<UpdatePaymentIntentRequest>("UpdatePaymentIntentRequest");

export const UpdatePaymentIntentResolver: RequestResolver.RequestResolver<UpdatePaymentIntentRequest, StripeService> =
  makeStripeResolver<UpdatePaymentIntentRequest>(
    (stripe, request) =>
      stripe.paymentIntents.update(request.id, request.params)
  );

/**
 * Request to confirm a payment intent
 */
export interface ConfirmPaymentIntentRequest
  extends Request.Request<Stripe.PaymentIntent, StripeError> {
  readonly _tag: "ConfirmPaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentConfirmParams;
}

export const ConfirmPaymentIntentRequest =
  Request.tagged<ConfirmPaymentIntentRequest>("ConfirmPaymentIntentRequest");

export const ConfirmPaymentIntentResolver: RequestResolver.RequestResolver<ConfirmPaymentIntentRequest, StripeService> =
  makeStripeResolver<ConfirmPaymentIntentRequest>(
    (stripe, request) =>
      stripe.paymentIntents.confirm(request.id, request.params)
  );

/**
 * Request to cancel a payment intent
 */
export interface CancelPaymentIntentRequest
  extends Request.Request<Stripe.PaymentIntent, StripeError> {
  readonly _tag: "CancelPaymentIntentRequest";
  readonly id: string;
  readonly params?: Stripe.PaymentIntentCancelParams;
}

export const CancelPaymentIntentRequest =
  Request.tagged<CancelPaymentIntentRequest>("CancelPaymentIntentRequest");

export const CancelPaymentIntentResolver: RequestResolver.RequestResolver<CancelPaymentIntentRequest, StripeService> =
  makeStripeResolver<CancelPaymentIntentRequest>(
    (stripe, request) =>
      stripe.paymentIntents.cancel(request.id, request.params)
  );

/**
 * Request to list payment intents
 */
export interface ListPaymentIntentsRequest
  extends Request.Request<Stripe.ApiList<Stripe.PaymentIntent>, StripeError> {
  readonly _tag: "ListPaymentIntentsRequest";
  readonly params?: Stripe.PaymentIntentListParams;
}

export const ListPaymentIntentsRequest =
  Request.tagged<ListPaymentIntentsRequest>("ListPaymentIntentsRequest");

export const ListPaymentIntentsResolver: RequestResolver.RequestResolver<ListPaymentIntentsRequest, StripeService> =
  makeStripeResolver<ListPaymentIntentsRequest>(
    (stripe, request) =>
      stripe.paymentIntents.list(request.params)
  );

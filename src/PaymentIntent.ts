/**
 * PaymentIntent resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as PaymentIntent from "@thomasfosterau/effect-stripe/PaymentIntent";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createPaymentIntent = (amount: number, currency: string) =>
 *   PaymentIntent.create({ amount, currency });
 *
 * const program = Effect.gen(function* () {
 *   const intent = yield* createPaymentIntent(2000, "usd");
 *   return intent;
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
  CreatePaymentIntentRequest,
  CreatePaymentIntentResolver,
  RetrievePaymentIntentRequest,
  RetrievePaymentIntentResolver,
  UpdatePaymentIntentRequest,
  UpdatePaymentIntentResolver,
  ConfirmPaymentIntentRequest,
  ConfirmPaymentIntentResolver,
  CancelPaymentIntentRequest,
  CancelPaymentIntentResolver,
  ListPaymentIntentsRequest,
  ListPaymentIntentsResolver,
} from "./PaymentIntentRequests.js";

/**
 * Create a payment intent
 */
export const create = (
  params: Stripe.PaymentIntentCreateParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    CreatePaymentIntentRequest({ params }),
    RequestResolver.contextFromEffect(CreatePaymentIntentResolver)
  );

/**
 * Retrieve a payment intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentIntentRetrieveParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    RetrievePaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrievePaymentIntentResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a payment intent
 */
export const update = (
  id: string,
  params?: Stripe.PaymentIntentUpdateParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    UpdatePaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdatePaymentIntentResolver)
  );

/**
 * Confirm a payment intent
 */
export const confirm = (
  id: string,
  params?: Stripe.PaymentIntentConfirmParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    ConfirmPaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(ConfirmPaymentIntentResolver)
  );

/**
 * Cancel a payment intent
 */
export const cancel = (
  id: string,
  params?: Stripe.PaymentIntentCancelParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  Effect.request(
    CancelPaymentIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(CancelPaymentIntentResolver)
  );

/**
 * List payment intents
 */
export const list = (
  params?: Stripe.PaymentIntentListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.PaymentIntent>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListPaymentIntentsRequest({ params }),
    RequestResolver.contextFromEffect(ListPaymentIntentsResolver)
  ).pipe(Effect.withRequestCaching(true));

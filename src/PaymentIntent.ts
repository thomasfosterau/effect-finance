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

import { Effect } from "effect";
import type Stripe from "stripe";
import { wrapStripeCall, type StripeError } from "./internal.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a payment intent
 */
export const create = (
  params: Stripe.PaymentIntentCreateParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentIntents.create(params));

/**
 * Retrieve a payment intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentIntentRetrieveParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentIntents.retrieve(id, params));

/**
 * Update a payment intent
 */
export const update = (
  id: string,
  params?: Stripe.PaymentIntentUpdateParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentIntents.update(id, params));

/**
 * Confirm a payment intent
 */
export const confirm = (
  id: string,
  params?: Stripe.PaymentIntentConfirmParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentIntents.confirm(id, params));

/**
 * Cancel a payment intent
 */
export const cancel = (
  id: string,
  params?: Stripe.PaymentIntentCancelParams
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentIntents.cancel(id, params));

/**
 * List payment intents
 */
export const list = (
  params?: Stripe.PaymentIntentListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.PaymentIntent>,
  StripeError,
  StripeService
> => wrapStripeCall((stripe) => stripe.paymentIntents.list(params));

/**
 * PaymentMethod resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as PaymentMethod from "@thomasfosterau/effect-payments-stripe/PaymentMethod";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createPaymentMethod = (type: string) =>
 *   PaymentMethod.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const paymentMethod = yield* createPaymentMethod("card");
 *   return paymentMethod;
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
 * Create a payment method
 */
export const create = (
  params: Stripe.PaymentMethodCreateParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentMethods.create(params));

/**
 * Retrieve a payment method
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentMethodRetrieveParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentMethods.retrieve(id, params));

/**
 * Update a payment method
 */
export const update = (
  id: string,
  params?: Stripe.PaymentMethodUpdateParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentMethods.update(id, params));

/**
 * Attach a payment method to a customer
 */
export const attach = (
  id: string,
  params: Stripe.PaymentMethodAttachParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentMethods.attach(id, params));

/**
 * Detach a payment method from a customer
 */
export const detach = (
  id: string,
  params?: Stripe.PaymentMethodDetachParams,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentMethods.detach(id, params));

/**
 * List payment methods
 */
export const list = (
  params: Stripe.PaymentMethodListParams,
): Effect.Effect<Stripe.ApiList<Stripe.PaymentMethod>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.paymentMethods.list(params));

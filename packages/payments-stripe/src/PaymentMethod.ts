/**
 * PaymentMethod resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as PaymentMethod from "@thomasfosterau/effect-payments-stripe/PaymentMethod";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createPaymentMethod = (type: string) =>
 *   PaymentMethod.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const paymentMethod = yield* createPaymentMethod("card");
 *   return paymentMethod;
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
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a payment method
 */
export const create = (
  params: Stripe.PaymentMethodCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/payment_methods", params, options);

/**
 * Retrieve a payment method
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentMethodRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/payment_methods/${id}`, params, options);

/**
 * Update a payment method
 */
export const update = (
  id: string,
  params?: Stripe.PaymentMethodUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_methods/${id}`, params, options);

/**
 * Attach a payment method to a customer
 */
export const attach = (
  id: string,
  params: Stripe.PaymentMethodAttachParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_methods/${id}/attach`, params, options);

/**
 * Detach a payment method from a customer
 */
export const detach = (
  id: string,
  params?: Stripe.PaymentMethodDetachParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_methods/${id}/detach`, params, options);

/**
 * List payment methods
 */
export const list = (
  params: Stripe.PaymentMethodListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.PaymentMethod>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/payment_methods", params, options);

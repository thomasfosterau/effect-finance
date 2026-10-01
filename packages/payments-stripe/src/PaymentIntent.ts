/**
 * PaymentIntent resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as PaymentIntent from "@thomasfosterau/effect-payments-stripe/PaymentIntent";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createPaymentIntent = (amount: number, currency: string) =>
 *   PaymentIntent.create({ amount, currency });
 *
 * const program = Effect.gen(function* () {
 *   const intent = yield* createPaymentIntent(2000, "usd");
 *   return intent;
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
 * Create a payment intent
 */
export const create = (
  params: Stripe.PaymentIntentCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/payment_intents", params, options);

/**
 * Retrieve a payment intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentIntentRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/payment_intents/${id}`, params, options);

/**
 * Update a payment intent
 */
export const update = (
  id: string,
  params?: Stripe.PaymentIntentUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_intents/${id}`, params, options);

/**
 * Confirm a payment intent
 */
export const confirm = (
  id: string,
  params?: Stripe.PaymentIntentConfirmParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_intents/${id}/confirm`, params, options);

/**
 * Cancel a payment intent
 */
export const cancel = (
  id: string,
  params?: Stripe.PaymentIntentCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_intents/${id}/cancel`, params, options);

/**
 * List payment intents
 */
export const list = (
  params?: Stripe.PaymentIntentListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.PaymentIntent>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/payment_intents", params, options);

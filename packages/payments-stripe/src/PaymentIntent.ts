/**
 * Stripe's `/v1/payment_intents` API as a raw resource module, the escape hatch
 * for what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded; prefer the neutral
 * `PaymentIntents` capability where it covers the call.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a payment intent (`POST /v1/payment_intents`).
 */
export const create = (
  params: Stripe.PaymentIntentCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/payment_intents", params, options);

/**
 * Retrieve a payment intent (`GET /v1/payment_intents/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentIntentRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/payment_intents/${id}`, params, options);

/**
 * Update a payment intent (`POST /v1/payment_intents/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.PaymentIntentUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_intents/${id}`, params, options);

/**
 * Confirm a payment intent (`POST /v1/payment_intents/{id}/confirm`).
 */
export const confirm = (
  id: string,
  params?: Stripe.PaymentIntentConfirmParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_intents/${id}/confirm`, params, options);

/**
 * Cancel a payment intent (`POST /v1/payment_intents/{id}/cancel`).
 */
export const cancel = (
  id: string,
  params?: Stripe.PaymentIntentCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_intents/${id}/cancel`, params, options);

/**
 * List payment intents (`GET /v1/payment_intents`).
 */
export const list = (
  params?: Stripe.PaymentIntentListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.PaymentIntent>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/payment_intents", params, options);

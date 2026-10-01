/**
 * Stripe's `/v1/payment_methods` API as a raw resource module, the escape hatch
 * for what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a payment method (`POST /v1/payment_methods`).
 */
export const create = (
  params: Stripe.PaymentMethodCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/payment_methods", params, options);

/**
 * Retrieve a payment method (`GET /v1/payment_methods/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.PaymentMethodRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/payment_methods/${id}`, params, options);

/**
 * Update a payment method (`POST /v1/payment_methods/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.PaymentMethodUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_methods/${id}`, params, options);

/**
 * Attach a payment method to a customer
 * (`POST /v1/payment_methods/{id}/attach`).
 */
export const attach = (
  id: string,
  params: Stripe.PaymentMethodAttachParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_methods/${id}/attach`, params, options);

/**
 * Detach a payment method from a customer
 * (`POST /v1/payment_methods/{id}/detach`).
 */
export const detach = (
  id: string,
  params?: Stripe.PaymentMethodDetachParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.PaymentMethod, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/payment_methods/${id}/detach`, params, options);

/**
 * List payment methods (`GET /v1/payment_methods`).
 */
export const list = (
  params: Stripe.PaymentMethodListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.PaymentMethod>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/payment_methods", params, options);

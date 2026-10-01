/**
 * Stripe's `/v1/setup_intents` API as a raw resource module, the escape hatch
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
 * Create a setup intent (`POST /v1/setup_intents`).
 */
export const create = (
  params?: Stripe.SetupIntentCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/setup_intents", params, options);

/**
 * Retrieve a setup intent (`GET /v1/setup_intents/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.SetupIntentRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/setup_intents/${id}`, params, options);

/**
 * Update a setup intent (`POST /v1/setup_intents/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.SetupIntentUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}`, params, options);

/**
 * Confirm a setup intent (`POST /v1/setup_intents/{id}/confirm`).
 */
export const confirm = (
  id: string,
  params?: Stripe.SetupIntentConfirmParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}/confirm`, params, options);

/**
 * Cancel a setup intent (`POST /v1/setup_intents/{id}/cancel`).
 */
export const cancel = (
  id: string,
  params?: Stripe.SetupIntentCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}/cancel`, params, options);

/**
 * List setup intents (`GET /v1/setup_intents`).
 */
export const list = (
  params?: Stripe.SetupIntentListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.SetupIntent>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/setup_intents", params, options);

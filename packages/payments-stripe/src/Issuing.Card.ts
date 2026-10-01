/**
 * Stripe's `/v1/issuing/cards` API as a raw resource module, the escape hatch
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
 * Create an issuing card (`POST /v1/issuing/cards`).
 */
export const create = (
  params: Stripe.Issuing.CardCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/issuing/cards", params, options);

/**
 * Retrieve an issuing card (`GET /v1/issuing/cards/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/cards/${id}`, params, options);

/**
 * Update an issuing card (`POST /v1/issuing/cards/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/cards/${id}`, params, options);

/**
 * List issuing cards (`GET /v1/issuing/cards`).
 */
export const list = (
  params?: Stripe.Issuing.CardListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Card>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/cards", params, options);

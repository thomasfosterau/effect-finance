/**
 * Stripe's `/v1/prices` API as a raw resource module, the escape hatch for what
 * the neutral capabilities do not cover. Results are typed with the `stripe`
 * package's declarations and are not decoded; prefer the neutral `Prices`
 * capability where it covers the call.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a price (`POST /v1/prices`).
 */
export const create = (
  params: Stripe.PriceCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Price, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/prices", params, options);

/**
 * Retrieve a price (`GET /v1/prices/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.PriceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Price, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/prices/${id}`, params, options);

/**
 * Update a price (`POST /v1/prices/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.PriceUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Price, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/prices/${id}`, params, options);

/**
 * List prices (`GET /v1/prices`).
 */
export const list = (
  params?: Stripe.PriceListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Price>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/prices", params, options);

/**
 * Stripe's `/v1/accounts` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
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
 * Create an account (`POST /v1/accounts`).
 */
export const create = (
  params: Stripe.AccountCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Account, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/accounts", params, options);

/**
 * Retrieve an account (`GET /v1/accounts/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.AccountRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Account, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${id}`, params, options);

/**
 * Update an account (`POST /v1/accounts/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.AccountUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Account, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${id}`, params, options);

/**
 * Delete an account (`DELETE /v1/accounts/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedAccount, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/accounts/${id}`, undefined, options);

/**
 * List accounts (`GET /v1/accounts`).
 */
export const list = (
  params?: Stripe.AccountListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Account>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/accounts", params, options);

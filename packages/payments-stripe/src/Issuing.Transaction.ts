/**
 * Stripe's `/v1/issuing/transactions` API as a raw resource module, the escape
 * hatch for what the neutral capabilities do not cover. Results are typed with
 * the `stripe` package's declarations and are not decoded.
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
 * Retrieve an issuing transaction (`GET /v1/issuing/transactions/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.TransactionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/transactions/${id}`, params, options);

/**
 * Update an issuing transaction (`POST /v1/issuing/transactions/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.TransactionUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/transactions/${id}`, params, options);

/**
 * List issuing transactions (`GET /v1/issuing/transactions`).
 */
export const list = (
  params?: Stripe.Issuing.TransactionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Transaction>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/transactions", params, options);

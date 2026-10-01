/**
 * Stripe's `/v1/treasury/transactions` API as a raw resource module, the escape
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
 * Retrieve a transaction (`GET /v1/treasury/transactions/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.TransactionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.Transaction, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/transactions/${id}`, params, options);

/**
 * List transactions (`GET /v1/treasury/transactions`).
 */
export const list = (
  params: Stripe.Treasury.TransactionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.Transaction>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/transactions", params, options);

/**
 * Stripe's `/v1/balance_transactions` API as a raw resource module, the escape
 * hatch for what the neutral capabilities do not cover. Results are typed with
 * the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve a balance transaction (`GET /v1/balance_transactions/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.BalanceTransactionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.BalanceTransaction, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/balance_transactions/${id}`, params, options);

/**
 * List balance transactions (`GET /v1/balance_transactions`).
 */
export const list = (
  params?: Stripe.BalanceTransactionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.BalanceTransaction>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/balance_transactions", params, options);

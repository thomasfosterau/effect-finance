/**
 * Stripe's `/v1/balance` API as a raw resource module, the escape hatch for
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
import { type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve the balance (`GET /v1/balance`).
 */
export const retrieve = (
  params?: Stripe.BalanceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Balance, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/balance", params, options);

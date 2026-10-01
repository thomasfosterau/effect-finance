/**
 * Stripe's `/v1/account_links` API as a raw resource module, the escape hatch
 * for what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create an account link (`POST /v1/account_links`).
 */
export const create = (
  params: Stripe.AccountLinkCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.AccountLink, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/account_links", params, options);

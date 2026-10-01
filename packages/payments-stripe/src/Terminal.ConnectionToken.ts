/**
 * Stripe's `/v1/terminal/connection_tokens` API as a raw resource module, the
 * escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
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
 * Create a terminal connection token (`POST /v1/terminal/connection_tokens`):
 * a short-lived credential for the Terminal SDK to connect to a reader.
 */
export const create = (
  params?: Stripe.Terminal.ConnectionTokenCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.ConnectionToken, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/terminal/connection_tokens", params, options);

/**
 * Stripe's `/v1/treasury/outbound_transfers` API as a raw resource module, the
 * escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create an outbound transfer (`POST /v1/treasury/outbound_transfers`).
 */
export const create = (
  params: Stripe.Treasury.OutboundTransferCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/outbound_transfers", params, options);

/**
 * Retrieve an outbound transfer (`GET /v1/treasury/outbound_transfers/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.OutboundTransferRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/outbound_transfers/${id}`, params, options);

/**
 * List outbound transfers (`GET /v1/treasury/outbound_transfers`).
 */
export const list = (
  params: Stripe.Treasury.OutboundTransferListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.OutboundTransfer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/outbound_transfers", params, options);

/**
 * Cancel an outbound transfer
 * (`POST /v1/treasury/outbound_transfers/{id}/cancel`).
 */
export const cancel = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/outbound_transfers/${id}/cancel`, undefined, options);

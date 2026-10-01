/**
 * Stripe's `/v1/treasury/inbound_transfers` API as a raw resource module, the
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
 * Create an inbound transfer (`POST /v1/treasury/inbound_transfers`).
 */
export const create = (
  params: Stripe.Treasury.InboundTransferCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/inbound_transfers", params, options);

/**
 * Retrieve an inbound transfer (`GET /v1/treasury/inbound_transfers/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.InboundTransferRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/inbound_transfers/${id}`, params, options);

/**
 * List inbound transfers (`GET /v1/treasury/inbound_transfers`).
 */
export const list = (
  params: Stripe.Treasury.InboundTransferListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.InboundTransfer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/inbound_transfers", params, options);

/**
 * Cancel an inbound transfer
 * (`POST /v1/treasury/inbound_transfers/{id}/cancel`).
 */
export const cancel = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/inbound_transfers/${id}/cancel`, undefined, options);

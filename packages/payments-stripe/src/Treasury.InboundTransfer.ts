/**
 * Treasury.InboundTransfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as InboundTransfer from "@thomasfosterau/effect-payments-stripe/Treasury.InboundTransfer";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createTransfer = (financialAccountId: string, amount: number) =>
 *   InboundTransfer.create({
 *     financial_account: financialAccountId,
 *     amount,
 *     currency: "usd",
 *     origin_payment_method: "pm_...",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const transfer = yield* createTransfer("fa_...", 10000);
 *   return transfer;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create an inbound transfer
 */
export const create = (
  params: Stripe.Treasury.InboundTransferCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/inbound_transfers", params, options);

/**
 * Retrieve an inbound transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.InboundTransferRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/inbound_transfers/${id}`, params, options);

/**
 * List inbound transfers
 */
export const list = (
  params: Stripe.Treasury.InboundTransferListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.InboundTransfer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/inbound_transfers", params, options);

/**
 * Cancel an inbound transfer
 */
export const cancel = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/inbound_transfers/${id}/cancel`, undefined, options);

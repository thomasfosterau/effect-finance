/**
 * Treasury.OutboundTransfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as OutboundTransfer from "@thomasfosterau/effect-payments-stripe/Treasury.OutboundTransfer";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createTransfer = (financialAccountId: string, amount: number) =>
 *   OutboundTransfer.create({
 *     financial_account: financialAccountId,
 *     amount,
 *     currency: "usd",
 *     destination_payment_method: "pm_...",
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
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create an outbound transfer
 */
export const create = (
  params: Stripe.Treasury.OutboundTransferCreateParams,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/outbound_transfers", params);

/**
 * Retrieve an outbound transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.OutboundTransferRetrieveParams,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/outbound_transfers/${id}`, params);

/**
 * List outbound transfers
 */
export const list = (
  params: Stripe.Treasury.OutboundTransferListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.OutboundTransfer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/outbound_transfers", params);

/**
 * Cancel an outbound transfer
 */
export const cancel = (
  id: string,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/outbound_transfers/${id}/cancel`);

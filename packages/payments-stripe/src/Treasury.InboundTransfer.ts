/**
 * Treasury.InboundTransfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
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
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create an inbound transfer
 */
export const create = (
  params: Stripe.Treasury.InboundTransferCreateParams,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/inbound_transfers", params);

/**
 * Retrieve an inbound transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.InboundTransferRetrieveParams,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/inbound_transfers/${id}`, params);

/**
 * List inbound transfers
 */
export const list = (
  params: Stripe.Treasury.InboundTransferListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.InboundTransfer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/inbound_transfers", params);

/**
 * Cancel an inbound transfer
 */
export const cancel = (
  id: string,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/inbound_transfers/${id}/cancel`);

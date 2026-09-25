/**
 * Treasury.OutboundTransfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as OutboundTransfer from "@thomasfosterau/effect-payments-stripe/Treasury.OutboundTransfer";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create an outbound transfer
 */
export const create = (
  params: Stripe.Treasury.OutboundTransferCreateParams,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.outboundTransfers.create(params));

/**
 * Retrieve an outbound transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.OutboundTransferRetrieveParams,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.outboundTransfers.retrieve(id, params));

/**
 * List outbound transfers
 */
export const list = (
  params: Stripe.Treasury.OutboundTransferListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.OutboundTransfer>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.outboundTransfers.list(params));

/**
 * Cancel an outbound transfer
 */
export const cancel = (
  id: string,
): Effect.Effect<Stripe.Treasury.OutboundTransfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.outboundTransfers.cancel(id));

/**
 * Treasury.InboundTransfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as InboundTransfer from "@thomasfosterau/effect-payments-stripe/Treasury.InboundTransfer";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
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
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create an inbound transfer
 */
export const create = (
  params: Stripe.Treasury.InboundTransferCreateParams,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.inboundTransfers.create(params));

/**
 * Retrieve an inbound transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.InboundTransferRetrieveParams,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.inboundTransfers.retrieve(id, params));

/**
 * List inbound transfers
 */
export const list = (
  params: Stripe.Treasury.InboundTransferListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.InboundTransfer>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.inboundTransfers.list(params));

/**
 * Cancel an inbound transfer
 */
export const cancel = (
  id: string,
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.inboundTransfers.cancel(id));

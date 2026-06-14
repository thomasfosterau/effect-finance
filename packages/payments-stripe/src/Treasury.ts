/**
 * Treasury namespace grouping all Treasury resources
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Treasury from "@thomasfosterau/effect-payments-stripe/Treasury";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   // Create a financial account
 *   const account = yield* Treasury.FinancialAccount.create({
 *     supported_currencies: ["usd"]
 *   });
 *
 *   // Create an inbound transfer
 *   const transfer = yield* Treasury.InboundTransfer.create({
 *     financial_account: account.id,
 *     amount: 10000,
 *     currency: "usd",
 *     origin_payment_method: "pm_..."
 *   });
 *
 *   return { account, transfer };
 * });
 *
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

export * as FinancialAccount from "./Treasury.FinancialAccount.js";
export * as Transaction from "./Treasury.Transaction.js";
export * as InboundTransfer from "./Treasury.InboundTransfer.js";
export * as OutboundTransfer from "./Treasury.OutboundTransfer.js";

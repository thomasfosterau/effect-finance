/**
 * Treasury namespace grouping all Treasury resources
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Treasury from "@thomasfosterau/effect-payments-stripe/Treasury";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

export * as FinancialAccount from "./Treasury.FinancialAccount.js";
export * as Transaction from "./Treasury.Transaction.js";
export * as InboundTransfer from "./Treasury.InboundTransfer.js";
export * as OutboundTransfer from "./Treasury.OutboundTransfer.js";

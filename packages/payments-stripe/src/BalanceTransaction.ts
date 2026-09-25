/**
 * BalanceTransaction resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as BalanceTransaction from "@thomasfosterau/effect-payments-stripe/BalanceTransaction";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const getTransaction = (id: string) =>
 *   BalanceTransaction.retrieve(id);
 *
 * const program = Effect.gen(function* () {
 *   const transaction = yield* getTransaction("txn_123");
 *   return transaction;
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
 * Retrieve a balance transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.BalanceTransactionRetrieveParams,
): Effect.Effect<Stripe.BalanceTransaction, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.balanceTransactions.retrieve(id, params));

/**
 * List balance transactions
 */
export const list = (
  params?: Stripe.BalanceTransactionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.BalanceTransaction>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.balanceTransactions.list(params));

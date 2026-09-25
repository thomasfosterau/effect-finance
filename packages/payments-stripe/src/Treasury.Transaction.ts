/**
 * Treasury.Transaction resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Transaction from "@thomasfosterau/effect-payments-stripe/Treasury.Transaction";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const getTransaction = (id: string) => Transaction.retrieve(id);
 *
 * const program = Effect.gen(function* () {
 *   const transaction = yield* getTransaction("trxn_...");
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
 * Retrieve a transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.TransactionRetrieveParams,
): Effect.Effect<Stripe.Treasury.Transaction, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.transactions.retrieve(id, params));

/**
 * List transactions
 */
export const list = (
  params: Stripe.Treasury.TransactionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.Transaction>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.transactions.list(params));

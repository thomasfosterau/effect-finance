/**
 * BalanceTransaction resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as BalanceTransaction from "@thomasfosterau/effect-payments-stripe/BalanceTransaction";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const getTransaction = (id: string) =>
 *   BalanceTransaction.retrieve(id);
 *
 * const program = Effect.gen(function* () {
 *   const transaction = yield* getTransaction("txn_123");
 *   return transaction;
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
 * Retrieve a balance transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.BalanceTransactionRetrieveParams,
): Effect.Effect<Stripe.BalanceTransaction, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/balance_transactions/${id}`, params);

/**
 * List balance transactions
 */
export const list = (
  params?: Stripe.BalanceTransactionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.BalanceTransaction>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/balance_transactions", params);

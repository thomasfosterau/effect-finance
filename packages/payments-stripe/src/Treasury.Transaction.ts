/**
 * Treasury.Transaction resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Transaction from "@thomasfosterau/effect-payments-stripe/Treasury.Transaction";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const getTransaction = (id: string) => Transaction.retrieve(id);
 *
 * const program = Effect.gen(function* () {
 *   const transaction = yield* getTransaction("trxn_...");
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
 * Retrieve a transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.TransactionRetrieveParams,
): Effect.Effect<Stripe.Treasury.Transaction, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/transactions/${id}`, params);

/**
 * List transactions
 */
export const list = (
  params: Stripe.Treasury.TransactionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.Transaction>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/transactions", params);

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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to retrieve a balance transaction
 */
interface RetrieveBalanceTransactionRequest extends Request.Request<
  Stripe.BalanceTransaction,
  StripeError
> {
  readonly _tag: "RetrieveBalanceTransactionRequest";
  readonly id: string;
  readonly params?: Stripe.BalanceTransactionRetrieveParams;
}

const RetrieveBalanceTransactionRequest =
  Request.tagged<RetrieveBalanceTransactionRequest>(
    "RetrieveBalanceTransactionRequest"
  );

const RetrieveBalanceTransactionResolver: RequestResolver.RequestResolver<
  RetrieveBalanceTransactionRequest,
  StripeService
> = makeStripeResolver<RetrieveBalanceTransactionRequest>((stripe, request) =>
  stripe.balanceTransactions.retrieve(request.id, request.params)
);

/**
 * Request to list balance transactions
 */
interface ListBalanceTransactionsRequest extends Request.Request<
  Stripe.ApiList<Stripe.BalanceTransaction>,
  StripeError
> {
  readonly _tag: "ListBalanceTransactionsRequest";
  readonly params?: Stripe.BalanceTransactionListParams;
}

const ListBalanceTransactionsRequest =
  Request.tagged<ListBalanceTransactionsRequest>(
    "ListBalanceTransactionsRequest"
  );

const ListBalanceTransactionsResolver: RequestResolver.RequestResolver<
  ListBalanceTransactionsRequest,
  StripeService
> = makeStripeResolver<ListBalanceTransactionsRequest>((stripe, request) =>
  stripe.balanceTransactions.list(request.params)
);

/**
 * Retrieve a balance transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.BalanceTransactionRetrieveParams
): Effect.Effect<Stripe.BalanceTransaction, StripeError, StripeService> =>
  Effect.request(
    RetrieveBalanceTransactionRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveBalanceTransactionResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * List balance transactions
 */
export const list = (
  params?: Stripe.BalanceTransactionListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.BalanceTransaction>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListBalanceTransactionsRequest({ params }),
    RequestResolver.contextFromEffect(ListBalanceTransactionsResolver)
  ).pipe(Effect.withRequestCaching(true));

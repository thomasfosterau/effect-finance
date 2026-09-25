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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to retrieve a transaction
 */
interface RetrieveTransactionRequest extends Request.Request<
  Stripe.Treasury.Transaction,
  StripeError
> {
  readonly _tag: "RetrieveTransactionRequest";
  readonly id: string;
  readonly params?: Stripe.Treasury.TransactionRetrieveParams | undefined;
}

const RetrieveTransactionRequest = Request.tagged<RetrieveTransactionRequest>(
  "RetrieveTransactionRequest",
);

const RetrieveTransactionResolver: RequestResolver.RequestResolver<
  RetrieveTransactionRequest,
  StripeService
> = makeStripeResolver<RetrieveTransactionRequest>((stripe, request) =>
  stripe.treasury.transactions.retrieve(request.id, request.params),
);

/**
 * Request to list transactions
 */
interface ListTransactionsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Treasury.Transaction>,
  StripeError
> {
  readonly _tag: "ListTransactionsRequest";
  readonly params: Stripe.Treasury.TransactionListParams;
}

const ListTransactionsRequest = Request.tagged<ListTransactionsRequest>("ListTransactionsRequest");

const ListTransactionsResolver: RequestResolver.RequestResolver<
  ListTransactionsRequest,
  StripeService
> = makeStripeResolver<ListTransactionsRequest>((stripe, request) =>
  stripe.treasury.transactions.list(request.params),
);

/**
 * Retrieve a transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.TransactionRetrieveParams,
): Effect.Effect<Stripe.Treasury.Transaction, StripeError, StripeService> =>
  Effect.request(
    RetrieveTransactionRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveTransactionResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * List transactions
 */
export const list = (
  params: Stripe.Treasury.TransactionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.Transaction>, StripeError, StripeService> =>
  Effect.request(
    ListTransactionsRequest({ params }),
    RequestResolver.contextFromEffect(ListTransactionsResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Issuing Transaction resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingTransaction from "@thomasfosterau/effect-payments-stripe/Issuing.Transaction";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const transaction = yield* IssuingTransaction.retrieve("ipi_xxx");
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
 * Request to retrieve an issuing transaction
 */
interface RetrieveTransactionRequest extends Request.Request<
  Stripe.Issuing.Transaction,
  StripeError
> {
  readonly _tag: "RetrieveTransactionRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.TransactionRetrieveParams | undefined;
}

const RetrieveTransactionRequest = Request.tagged<RetrieveTransactionRequest>(
  "RetrieveTransactionRequest",
);

const RetrieveTransactionResolver: RequestResolver.RequestResolver<
  RetrieveTransactionRequest,
  StripeService
> = makeStripeResolver<RetrieveTransactionRequest>((stripe, request) =>
  stripe.issuing.transactions.retrieve(request.id, request.params),
);

/**
 * Request to update an issuing transaction
 */
interface UpdateTransactionRequest extends Request.Request<
  Stripe.Issuing.Transaction,
  StripeError
> {
  readonly _tag: "UpdateTransactionRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.TransactionUpdateParams | undefined;
}

const UpdateTransactionRequest = Request.tagged<UpdateTransactionRequest>(
  "UpdateTransactionRequest",
);

const UpdateTransactionResolver: RequestResolver.RequestResolver<
  UpdateTransactionRequest,
  StripeService
> = makeStripeResolver<UpdateTransactionRequest>((stripe, request) =>
  stripe.issuing.transactions.update(request.id, request.params),
);

/**
 * Request to list issuing transactions
 */
interface ListTransactionsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Issuing.Transaction>,
  StripeError
> {
  readonly _tag: "ListTransactionsRequest";
  readonly params?: Stripe.Issuing.TransactionListParams | undefined;
}

const ListTransactionsRequest = Request.tagged<ListTransactionsRequest>("ListTransactionsRequest");

const ListTransactionsResolver: RequestResolver.RequestResolver<
  ListTransactionsRequest,
  StripeService
> = makeStripeResolver<ListTransactionsRequest>((stripe, request) =>
  stripe.issuing.transactions.list(request.params),
);

/**
 * Retrieve an issuing transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.TransactionRetrieveParams,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeService> =>
  Effect.request(
    RetrieveTransactionRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveTransactionResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an issuing transaction
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.TransactionUpdateParams,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeService> =>
  Effect.request(
    UpdateTransactionRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateTransactionResolver),
  );

/**
 * List issuing transactions
 */
export const list = (
  params?: Stripe.Issuing.TransactionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Transaction>, StripeError, StripeService> =>
  Effect.request(
    ListTransactionsRequest({ params }),
    RequestResolver.contextFromEffect(ListTransactionsResolver),
  ).pipe(Effect.withRequestCaching(true));

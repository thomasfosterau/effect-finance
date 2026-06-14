/**
 * ExternalAccount resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as ExternalAccount from "@thomasfosterau/effect-payments-stripe/ExternalAccount";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createExternalAccount = (accountId: string) =>
 *   ExternalAccount.create(accountId, {
 *     external_account: "btok_123",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const externalAccount = yield* createExternalAccount("acct_123");
 *   return externalAccount;
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
 * Request to create an external account
 */
interface CreateExternalAccountRequest extends Request.Request<
  Stripe.BankAccount | Stripe.Card,
  StripeError
> {
  readonly _tag: "CreateExternalAccountRequest";
  readonly accountId: string;
  readonly params: Stripe.ExternalAccountCreateParams;
}

const CreateExternalAccountRequest =
  Request.tagged<CreateExternalAccountRequest>("CreateExternalAccountRequest");

const CreateExternalAccountResolver: RequestResolver.RequestResolver<
  CreateExternalAccountRequest,
  StripeService
> = makeStripeResolver<CreateExternalAccountRequest>((stripe, request) =>
  stripe.accounts.createExternalAccount(request.accountId, request.params)
);

/**
 * Request to retrieve an external account
 */
interface RetrieveExternalAccountRequest extends Request.Request<
  Stripe.BankAccount | Stripe.Card,
  StripeError
> {
  readonly _tag: "RetrieveExternalAccountRequest";
  readonly accountId: string;
  readonly id: string;
  readonly params?: Stripe.ExternalAccountRetrieveParams;
}

const RetrieveExternalAccountRequest =
  Request.tagged<RetrieveExternalAccountRequest>(
    "RetrieveExternalAccountRequest"
  );

const RetrieveExternalAccountResolver: RequestResolver.RequestResolver<
  RetrieveExternalAccountRequest,
  StripeService
> = makeStripeResolver<RetrieveExternalAccountRequest>((stripe, request) =>
  stripe.accounts.retrieveExternalAccount(
    request.accountId,
    request.id,
    request.params
  )
);

/**
 * Request to update an external account
 */
interface UpdateExternalAccountRequest extends Request.Request<
  Stripe.BankAccount | Stripe.Card,
  StripeError
> {
  readonly _tag: "UpdateExternalAccountRequest";
  readonly accountId: string;
  readonly id: string;
  readonly params?: Stripe.ExternalAccountUpdateParams;
}

const UpdateExternalAccountRequest =
  Request.tagged<UpdateExternalAccountRequest>("UpdateExternalAccountRequest");

const UpdateExternalAccountResolver: RequestResolver.RequestResolver<
  UpdateExternalAccountRequest,
  StripeService
> = makeStripeResolver<UpdateExternalAccountRequest>((stripe, request) =>
  stripe.accounts.updateExternalAccount(
    request.accountId,
    request.id,
    request.params
  )
);

/**
 * Request to delete an external account
 */
interface DeleteExternalAccountRequest extends Request.Request<
  Stripe.DeletedBankAccount | Stripe.DeletedCard,
  StripeError
> {
  readonly _tag: "DeleteExternalAccountRequest";
  readonly accountId: string;
  readonly id: string;
}

const DeleteExternalAccountRequest =
  Request.tagged<DeleteExternalAccountRequest>("DeleteExternalAccountRequest");

const DeleteExternalAccountResolver: RequestResolver.RequestResolver<
  DeleteExternalAccountRequest,
  StripeService
> = makeStripeResolver<DeleteExternalAccountRequest>((stripe, request) =>
  stripe.accounts.deleteExternalAccount(request.accountId, request.id)
);

/**
 * Request to list external accounts
 */
interface ListExternalAccountsRequest extends Request.Request<
  Stripe.ApiList<Stripe.BankAccount | Stripe.Card>,
  StripeError
> {
  readonly _tag: "ListExternalAccountsRequest";
  readonly accountId: string;
  readonly params?: Stripe.ExternalAccountListParams;
}

const ListExternalAccountsRequest = Request.tagged<ListExternalAccountsRequest>(
  "ListExternalAccountsRequest"
);

const ListExternalAccountsResolver: RequestResolver.RequestResolver<
  ListExternalAccountsRequest,
  StripeService
> = makeStripeResolver<ListExternalAccountsRequest>((stripe, request) =>
  stripe.accounts.listExternalAccounts(request.accountId, request.params)
);

/**
 * Create an external account
 */
export const create = (
  accountId: string,
  params: Stripe.ExternalAccountCreateParams
): Effect.Effect<
  Stripe.BankAccount | Stripe.Card,
  StripeError,
  StripeService
> =>
  Effect.request(
    CreateExternalAccountRequest({ accountId, params }),
    RequestResolver.contextFromEffect(CreateExternalAccountResolver)
  );

/**
 * Retrieve an external account
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.ExternalAccountRetrieveParams
): Effect.Effect<
  Stripe.BankAccount | Stripe.Card,
  StripeError,
  StripeService
> =>
  Effect.request(
    RetrieveExternalAccountRequest({ accountId, id, params }),
    RequestResolver.contextFromEffect(RetrieveExternalAccountResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an external account
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.ExternalAccountUpdateParams
): Effect.Effect<
  Stripe.BankAccount | Stripe.Card,
  StripeError,
  StripeService
> =>
  Effect.request(
    UpdateExternalAccountRequest({ accountId, id, params }),
    RequestResolver.contextFromEffect(UpdateExternalAccountResolver)
  );

/**
 * Delete an external account
 */
export const del = (
  accountId: string,
  id: string
): Effect.Effect<
  Stripe.DeletedBankAccount | Stripe.DeletedCard,
  StripeError,
  StripeService
> =>
  Effect.request(
    DeleteExternalAccountRequest({ accountId, id }),
    RequestResolver.contextFromEffect(DeleteExternalAccountResolver)
  );

/**
 * List external accounts
 */
export const list = (
  accountId: string,
  params?: Stripe.ExternalAccountListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.BankAccount | Stripe.Card>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListExternalAccountsRequest({ accountId, params }),
    RequestResolver.contextFromEffect(ListExternalAccountsResolver)
  ).pipe(Effect.withRequestCaching(true));

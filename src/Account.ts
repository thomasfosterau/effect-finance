/**
 * Account resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Account from "@thomasfosterau/effect-stripe/Account";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createAccount = (type: "standard" | "express" | "custom") =>
 *   Account.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* createAccount("express");
 *   return account;
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
 * Request to create an account
 */
interface CreateAccountRequest
  extends Request.Request<Stripe.Account, StripeError> {
  readonly _tag: "CreateAccountRequest";
  readonly params: Stripe.AccountCreateParams;
}

const CreateAccountRequest = Request.tagged<CreateAccountRequest>(
  "CreateAccountRequest"
);

const CreateAccountResolver: RequestResolver.RequestResolver<CreateAccountRequest, StripeService> =
  makeStripeResolver<CreateAccountRequest>(
    (stripe, request) => stripe.accounts.create(request.params)
  );

/**
 * Request to retrieve an account
 */
interface RetrieveAccountRequest
  extends Request.Request<Stripe.Account, StripeError> {
  readonly _tag: "RetrieveAccountRequest";
  readonly id: string;
  readonly params?: Stripe.AccountRetrieveParams;
}

const RetrieveAccountRequest = Request.tagged<RetrieveAccountRequest>(
  "RetrieveAccountRequest"
);

const RetrieveAccountResolver: RequestResolver.RequestResolver<RetrieveAccountRequest, StripeService> =
  makeStripeResolver<RetrieveAccountRequest>(
    (stripe, request) => stripe.accounts.retrieve(request.id, request.params)
  );

/**
 * Request to update an account
 */
interface UpdateAccountRequest
  extends Request.Request<Stripe.Account, StripeError> {
  readonly _tag: "UpdateAccountRequest";
  readonly id: string;
  readonly params?: Stripe.AccountUpdateParams;
}

const UpdateAccountRequest = Request.tagged<UpdateAccountRequest>(
  "UpdateAccountRequest"
);

const UpdateAccountResolver: RequestResolver.RequestResolver<UpdateAccountRequest, StripeService> =
  makeStripeResolver<UpdateAccountRequest>(
    (stripe, request) => stripe.accounts.update(request.id, request.params)
  );

/**
 * Request to delete an account
 */
interface DeleteAccountRequest
  extends Request.Request<Stripe.DeletedAccount, StripeError> {
  readonly _tag: "DeleteAccountRequest";
  readonly id: string;
}

const DeleteAccountRequest = Request.tagged<DeleteAccountRequest>(
  "DeleteAccountRequest"
);

const DeleteAccountResolver: RequestResolver.RequestResolver<DeleteAccountRequest, StripeService> =
  makeStripeResolver<DeleteAccountRequest>(
    (stripe, request) => stripe.accounts.del(request.id)
  );

/**
 * Request to list accounts
 */
interface ListAccountsRequest
  extends Request.Request<Stripe.ApiList<Stripe.Account>, StripeError> {
  readonly _tag: "ListAccountsRequest";
  readonly params?: Stripe.AccountListParams;
}

const ListAccountsRequest = Request.tagged<ListAccountsRequest>(
  "ListAccountsRequest"
);

const ListAccountsResolver: RequestResolver.RequestResolver<ListAccountsRequest, StripeService> =
  makeStripeResolver<ListAccountsRequest>(
    (stripe, request) => stripe.accounts.list(request.params)
  );

/**
 * Create an account
 */
export const create = (
  params: Stripe.AccountCreateParams
): Effect.Effect<Stripe.Account, StripeError, StripeService> =>
  Effect.request(
    CreateAccountRequest({ params }),
    RequestResolver.contextFromEffect(CreateAccountResolver)
  );

/**
 * Retrieve an account
 */
export const retrieve = (
  id: string,
  params?: Stripe.AccountRetrieveParams
): Effect.Effect<Stripe.Account, StripeError, StripeService> =>
  Effect.request(
    RetrieveAccountRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveAccountResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an account
 */
export const update = (
  id: string,
  params?: Stripe.AccountUpdateParams
): Effect.Effect<Stripe.Account, StripeError, StripeService> =>
  Effect.request(
    UpdateAccountRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateAccountResolver)
  );

/**
 * Delete an account
 */
export const del = (
  id: string
): Effect.Effect<Stripe.DeletedAccount, StripeError, StripeService> =>
  Effect.request(
    DeleteAccountRequest({ id }),
    RequestResolver.contextFromEffect(DeleteAccountResolver)
  );

/**
 * List accounts
 */
export const list = (
  params?: Stripe.AccountListParams
): Effect.Effect<Stripe.ApiList<Stripe.Account>, StripeError, StripeService> =>
  Effect.request(
    ListAccountsRequest({ params }),
    RequestResolver.contextFromEffect(ListAccountsResolver)
  ).pipe(Effect.withRequestCaching(true));

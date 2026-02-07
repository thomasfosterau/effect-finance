/**
 * Treasury.FinancialAccount resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as FinancialAccount from "@thomasfosterau/effect-stripe/Treasury.FinancialAccount";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createAccount = (supportedCurrencies: string[]) =>
 *   FinancialAccount.create({ supported_currencies: supportedCurrencies });
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* createAccount(["usd"]);
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
 * Request to create a financial account
 */
interface CreateFinancialAccountRequest extends Request.Request<
  Stripe.Treasury.FinancialAccount,
  StripeError
> {
  readonly _tag: "CreateFinancialAccountRequest";
  readonly params: Stripe.Treasury.FinancialAccountCreateParams;
}

const CreateFinancialAccountRequest =
  Request.tagged<CreateFinancialAccountRequest>(
    "CreateFinancialAccountRequest"
  );

const CreateFinancialAccountResolver: RequestResolver.RequestResolver<
  CreateFinancialAccountRequest,
  StripeService
> = makeStripeResolver<CreateFinancialAccountRequest>((stripe, request) =>
  stripe.treasury.financialAccounts.create(request.params)
);

/**
 * Request to retrieve a financial account
 */
interface RetrieveFinancialAccountRequest extends Request.Request<
  Stripe.Treasury.FinancialAccount,
  StripeError
> {
  readonly _tag: "RetrieveFinancialAccountRequest";
  readonly id: string;
  readonly params?: Stripe.Treasury.FinancialAccountRetrieveParams;
}

const RetrieveFinancialAccountRequest =
  Request.tagged<RetrieveFinancialAccountRequest>(
    "RetrieveFinancialAccountRequest"
  );

const RetrieveFinancialAccountResolver: RequestResolver.RequestResolver<
  RetrieveFinancialAccountRequest,
  StripeService
> = makeStripeResolver<RetrieveFinancialAccountRequest>((stripe, request) =>
  stripe.treasury.financialAccounts.retrieve(request.id, request.params)
);

/**
 * Request to update a financial account
 */
interface UpdateFinancialAccountRequest extends Request.Request<
  Stripe.Treasury.FinancialAccount,
  StripeError
> {
  readonly _tag: "UpdateFinancialAccountRequest";
  readonly id: string;
  readonly params?: Stripe.Treasury.FinancialAccountUpdateParams;
}

const UpdateFinancialAccountRequest =
  Request.tagged<UpdateFinancialAccountRequest>(
    "UpdateFinancialAccountRequest"
  );

const UpdateFinancialAccountResolver: RequestResolver.RequestResolver<
  UpdateFinancialAccountRequest,
  StripeService
> = makeStripeResolver<UpdateFinancialAccountRequest>((stripe, request) =>
  stripe.treasury.financialAccounts.update(request.id, request.params)
);

/**
 * Request to list financial accounts
 */
interface ListFinancialAccountsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Treasury.FinancialAccount>,
  StripeError
> {
  readonly _tag: "ListFinancialAccountsRequest";
  readonly params?: Stripe.Treasury.FinancialAccountListParams;
}

const ListFinancialAccountsRequest =
  Request.tagged<ListFinancialAccountsRequest>("ListFinancialAccountsRequest");

const ListFinancialAccountsResolver: RequestResolver.RequestResolver<
  ListFinancialAccountsRequest,
  StripeService
> = makeStripeResolver<ListFinancialAccountsRequest>((stripe, request) =>
  stripe.treasury.financialAccounts.list(request.params)
);

/**
 * Request to close a financial account
 */
interface CloseFinancialAccountRequest extends Request.Request<
  Stripe.Treasury.FinancialAccount,
  StripeError
> {
  readonly _tag: "CloseFinancialAccountRequest";
  readonly id: string;
}

const CloseFinancialAccountRequest =
  Request.tagged<CloseFinancialAccountRequest>("CloseFinancialAccountRequest");

const CloseFinancialAccountResolver: RequestResolver.RequestResolver<
  CloseFinancialAccountRequest,
  StripeService
> = makeStripeResolver<CloseFinancialAccountRequest>((stripe, request) =>
  stripe.treasury.financialAccounts.close(request.id)
);

/**
 * Request to retrieve features of a financial account
 */
interface RetrieveFeaturesRequest extends Request.Request<
  Stripe.Treasury.FinancialAccountFeatures,
  StripeError
> {
  readonly _tag: "RetrieveFeaturesRequest";
  readonly id: string;
  readonly params?: Stripe.Treasury.FinancialAccountRetrieveFeaturesParams;
}

const RetrieveFeaturesRequest = Request.tagged<RetrieveFeaturesRequest>(
  "RetrieveFeaturesRequest"
);

const RetrieveFeaturesResolver: RequestResolver.RequestResolver<
  RetrieveFeaturesRequest,
  StripeService
> = makeStripeResolver<RetrieveFeaturesRequest>((stripe, request) =>
  stripe.treasury.financialAccounts.retrieveFeatures(request.id, request.params)
);

/**
 * Request to update features of a financial account
 */
interface UpdateFeaturesRequest extends Request.Request<
  Stripe.Treasury.FinancialAccountFeatures,
  StripeError
> {
  readonly _tag: "UpdateFeaturesRequest";
  readonly id: string;
  readonly params?: Stripe.Treasury.FinancialAccountUpdateFeaturesParams;
}

const UpdateFeaturesRequest = Request.tagged<UpdateFeaturesRequest>(
  "UpdateFeaturesRequest"
);

const UpdateFeaturesResolver: RequestResolver.RequestResolver<
  UpdateFeaturesRequest,
  StripeService
> = makeStripeResolver<UpdateFeaturesRequest>((stripe, request) =>
  stripe.treasury.financialAccounts.updateFeatures(request.id, request.params)
);

/**
 * Create a financial account
 */
export const create = (
  params: Stripe.Treasury.FinancialAccountCreateParams
): Effect.Effect<
  Stripe.Treasury.FinancialAccount,
  StripeError,
  StripeService
> =>
  Effect.request(
    CreateFinancialAccountRequest({ params }),
    RequestResolver.contextFromEffect(CreateFinancialAccountResolver)
  );

/**
 * Retrieve a financial account
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveParams
): Effect.Effect<
  Stripe.Treasury.FinancialAccount,
  StripeError,
  StripeService
> =>
  Effect.request(
    RetrieveFinancialAccountRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveFinancialAccountResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a financial account
 */
export const update = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateParams
): Effect.Effect<
  Stripe.Treasury.FinancialAccount,
  StripeError,
  StripeService
> =>
  Effect.request(
    UpdateFinancialAccountRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateFinancialAccountResolver)
  );

/**
 * List financial accounts
 */
export const list = (
  params?: Stripe.Treasury.FinancialAccountListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Treasury.FinancialAccount>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListFinancialAccountsRequest({ params }),
    RequestResolver.contextFromEffect(ListFinancialAccountsResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Close a financial account
 */
export const close = (
  id: string
): Effect.Effect<
  Stripe.Treasury.FinancialAccount,
  StripeError,
  StripeService
> =>
  Effect.request(
    CloseFinancialAccountRequest({ id }),
    RequestResolver.contextFromEffect(CloseFinancialAccountResolver)
  );

/**
 * Retrieve features of a financial account
 */
export const retrieveFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveFeaturesParams
): Effect.Effect<
  Stripe.Treasury.FinancialAccountFeatures,
  StripeError,
  StripeService
> =>
  Effect.request(
    RetrieveFeaturesRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveFeaturesResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update features of a financial account
 */
export const updateFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateFeaturesParams
): Effect.Effect<
  Stripe.Treasury.FinancialAccountFeatures,
  StripeError,
  StripeService
> =>
  Effect.request(
    UpdateFeaturesRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateFeaturesResolver)
  );

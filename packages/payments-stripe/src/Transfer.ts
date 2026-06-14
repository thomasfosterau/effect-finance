/**
 * Transfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Transfer from "@thomasfosterau/effect-payments-stripe/Transfer";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createTransfer = (amount: number, destination: string) =>
 *   Transfer.create({
 *     amount,
 *     currency: "usd",
 *     destination,
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const transfer = yield* createTransfer(1000, "acct_123");
 *   return transfer;
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
 * Request to create a transfer
 */
interface CreateTransferRequest extends Request.Request<
  Stripe.Transfer,
  StripeError
> {
  readonly _tag: "CreateTransferRequest";
  readonly params: Stripe.TransferCreateParams;
}

const CreateTransferRequest = Request.tagged<CreateTransferRequest>(
  "CreateTransferRequest"
);

const CreateTransferResolver: RequestResolver.RequestResolver<
  CreateTransferRequest,
  StripeService
> = makeStripeResolver<CreateTransferRequest>((stripe, request) =>
  stripe.transfers.create(request.params)
);

/**
 * Request to retrieve a transfer
 */
interface RetrieveTransferRequest extends Request.Request<
  Stripe.Transfer,
  StripeError
> {
  readonly _tag: "RetrieveTransferRequest";
  readonly id: string;
  readonly params?: Stripe.TransferRetrieveParams;
}

const RetrieveTransferRequest = Request.tagged<RetrieveTransferRequest>(
  "RetrieveTransferRequest"
);

const RetrieveTransferResolver: RequestResolver.RequestResolver<
  RetrieveTransferRequest,
  StripeService
> = makeStripeResolver<RetrieveTransferRequest>((stripe, request) =>
  stripe.transfers.retrieve(request.id, request.params)
);

/**
 * Request to update a transfer
 */
interface UpdateTransferRequest extends Request.Request<
  Stripe.Transfer,
  StripeError
> {
  readonly _tag: "UpdateTransferRequest";
  readonly id: string;
  readonly params?: Stripe.TransferUpdateParams;
}

const UpdateTransferRequest = Request.tagged<UpdateTransferRequest>(
  "UpdateTransferRequest"
);

const UpdateTransferResolver: RequestResolver.RequestResolver<
  UpdateTransferRequest,
  StripeService
> = makeStripeResolver<UpdateTransferRequest>((stripe, request) =>
  stripe.transfers.update(request.id, request.params)
);

/**
 * Request to list transfers
 */
interface ListTransfersRequest extends Request.Request<
  Stripe.ApiList<Stripe.Transfer>,
  StripeError
> {
  readonly _tag: "ListTransfersRequest";
  readonly params?: Stripe.TransferListParams;
}

const ListTransfersRequest = Request.tagged<ListTransfersRequest>(
  "ListTransfersRequest"
);

const ListTransfersResolver: RequestResolver.RequestResolver<
  ListTransfersRequest,
  StripeService
> = makeStripeResolver<ListTransfersRequest>((stripe, request) =>
  stripe.transfers.list(request.params)
);

/**
 * Create a transfer
 */
export const create = (
  params: Stripe.TransferCreateParams
): Effect.Effect<Stripe.Transfer, StripeError, StripeService> =>
  Effect.request(
    CreateTransferRequest({ params }),
    RequestResolver.contextFromEffect(CreateTransferResolver)
  );

/**
 * Retrieve a transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.TransferRetrieveParams
): Effect.Effect<Stripe.Transfer, StripeError, StripeService> =>
  Effect.request(
    RetrieveTransferRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveTransferResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a transfer
 */
export const update = (
  id: string,
  params?: Stripe.TransferUpdateParams
): Effect.Effect<Stripe.Transfer, StripeError, StripeService> =>
  Effect.request(
    UpdateTransferRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateTransferResolver)
  );

/**
 * List transfers
 */
export const list = (
  params?: Stripe.TransferListParams
): Effect.Effect<Stripe.ApiList<Stripe.Transfer>, StripeError, StripeService> =>
  Effect.request(
    ListTransfersRequest({ params }),
    RequestResolver.contextFromEffect(ListTransfersResolver)
  ).pipe(Effect.withRequestCaching(true));

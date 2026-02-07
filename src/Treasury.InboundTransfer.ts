/**
 * Treasury.InboundTransfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as InboundTransfer from "@thomasfosterau/effect-stripe/Treasury.InboundTransfer";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createTransfer = (financialAccountId: string, amount: number) =>
 *   InboundTransfer.create({
 *     financial_account: financialAccountId,
 *     amount,
 *     currency: "usd",
 *     origin_payment_method: "pm_...",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const transfer = yield* createTransfer("fa_...", 10000);
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
 * Request to create an inbound transfer
 */
interface CreateInboundTransferRequest
  extends Request.Request<Stripe.Treasury.InboundTransfer, StripeError> {
  readonly _tag: "CreateInboundTransferRequest";
  readonly params: Stripe.Treasury.InboundTransferCreateParams;
}

const CreateInboundTransferRequest =
  Request.tagged<CreateInboundTransferRequest>(
    "CreateInboundTransferRequest"
  );

const CreateInboundTransferResolver: RequestResolver.RequestResolver<
  CreateInboundTransferRequest,
  StripeService
> = makeStripeResolver<CreateInboundTransferRequest>(
  (stripe, request) => stripe.treasury.inboundTransfers.create(request.params)
);

/**
 * Request to retrieve an inbound transfer
 */
interface RetrieveInboundTransferRequest
  extends Request.Request<Stripe.Treasury.InboundTransfer, StripeError> {
  readonly _tag: "RetrieveInboundTransferRequest";
  readonly id: string;
  readonly params?: Stripe.Treasury.InboundTransferRetrieveParams;
}

const RetrieveInboundTransferRequest =
  Request.tagged<RetrieveInboundTransferRequest>(
    "RetrieveInboundTransferRequest"
  );

const RetrieveInboundTransferResolver: RequestResolver.RequestResolver<
  RetrieveInboundTransferRequest,
  StripeService
> = makeStripeResolver<RetrieveInboundTransferRequest>(
  (stripe, request) =>
    stripe.treasury.inboundTransfers.retrieve(request.id, request.params)
);

/**
 * Request to list inbound transfers
 */
interface ListInboundTransfersRequest
  extends Request.Request<
    Stripe.ApiList<Stripe.Treasury.InboundTransfer>,
    StripeError
  > {
  readonly _tag: "ListInboundTransfersRequest";
  readonly params: Stripe.Treasury.InboundTransferListParams;
}

const ListInboundTransfersRequest = Request.tagged<ListInboundTransfersRequest>(
  "ListInboundTransfersRequest"
);

const ListInboundTransfersResolver: RequestResolver.RequestResolver<
  ListInboundTransfersRequest,
  StripeService
> = makeStripeResolver<ListInboundTransfersRequest>(
  (stripe, request) => stripe.treasury.inboundTransfers.list(request.params)
);

/**
 * Request to cancel an inbound transfer
 */
interface CancelInboundTransferRequest
  extends Request.Request<Stripe.Treasury.InboundTransfer, StripeError> {
  readonly _tag: "CancelInboundTransferRequest";
  readonly id: string;
}

const CancelInboundTransferRequest = Request.tagged<CancelInboundTransferRequest>(
  "CancelInboundTransferRequest"
);

const CancelInboundTransferResolver: RequestResolver.RequestResolver<
  CancelInboundTransferRequest,
  StripeService
> = makeStripeResolver<CancelInboundTransferRequest>(
  (stripe, request) => stripe.treasury.inboundTransfers.cancel(request.id)
);

/**
 * Create an inbound transfer
 */
export const create = (
  params: Stripe.Treasury.InboundTransferCreateParams
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeService> =>
  Effect.request(
    CreateInboundTransferRequest({ params }),
    RequestResolver.contextFromEffect(CreateInboundTransferResolver)
  );

/**
 * Retrieve an inbound transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.InboundTransferRetrieveParams
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeService> =>
  Effect.request(
    RetrieveInboundTransferRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveInboundTransferResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * List inbound transfers
 */
export const list = (
  params: Stripe.Treasury.InboundTransferListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Treasury.InboundTransfer>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListInboundTransfersRequest({ params }),
    RequestResolver.contextFromEffect(ListInboundTransfersResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Cancel an inbound transfer
 */
export const cancel = (
  id: string
): Effect.Effect<Stripe.Treasury.InboundTransfer, StripeError, StripeService> =>
  Effect.request(
    CancelInboundTransferRequest({ id }),
    RequestResolver.contextFromEffect(CancelInboundTransferResolver)
  );

/**
 * Treasury.OutboundTransfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as OutboundTransfer from "@thomasfosterau/effect-payments-stripe/Treasury.OutboundTransfer";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createTransfer = (financialAccountId: string, amount: number) =>
 *   OutboundTransfer.create({
 *     financial_account: financialAccountId,
 *     amount,
 *     currency: "usd",
 *     destination_payment_method: "pm_...",
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
 * Request to create an outbound transfer
 */
interface CreateOutboundTransferRequest extends Request.Request<
  Stripe.Treasury.OutboundTransfer,
  StripeError
> {
  readonly _tag: "CreateOutboundTransferRequest";
  readonly params: Stripe.Treasury.OutboundTransferCreateParams;
}

const CreateOutboundTransferRequest =
  Request.tagged<CreateOutboundTransferRequest>(
    "CreateOutboundTransferRequest"
  );

const CreateOutboundTransferResolver: RequestResolver.RequestResolver<
  CreateOutboundTransferRequest,
  StripeService
> = makeStripeResolver<CreateOutboundTransferRequest>((stripe, request) =>
  stripe.treasury.outboundTransfers.create(request.params)
);

/**
 * Request to retrieve an outbound transfer
 */
interface RetrieveOutboundTransferRequest extends Request.Request<
  Stripe.Treasury.OutboundTransfer,
  StripeError
> {
  readonly _tag: "RetrieveOutboundTransferRequest";
  readonly id: string;
  readonly params?: Stripe.Treasury.OutboundTransferRetrieveParams;
}

const RetrieveOutboundTransferRequest =
  Request.tagged<RetrieveOutboundTransferRequest>(
    "RetrieveOutboundTransferRequest"
  );

const RetrieveOutboundTransferResolver: RequestResolver.RequestResolver<
  RetrieveOutboundTransferRequest,
  StripeService
> = makeStripeResolver<RetrieveOutboundTransferRequest>((stripe, request) =>
  stripe.treasury.outboundTransfers.retrieve(request.id, request.params)
);

/**
 * Request to list outbound transfers
 */
interface ListOutboundTransfersRequest extends Request.Request<
  Stripe.ApiList<Stripe.Treasury.OutboundTransfer>,
  StripeError
> {
  readonly _tag: "ListOutboundTransfersRequest";
  readonly params: Stripe.Treasury.OutboundTransferListParams;
}

const ListOutboundTransfersRequest =
  Request.tagged<ListOutboundTransfersRequest>("ListOutboundTransfersRequest");

const ListOutboundTransfersResolver: RequestResolver.RequestResolver<
  ListOutboundTransfersRequest,
  StripeService
> = makeStripeResolver<ListOutboundTransfersRequest>((stripe, request) =>
  stripe.treasury.outboundTransfers.list(request.params)
);

/**
 * Request to cancel an outbound transfer
 */
interface CancelOutboundTransferRequest extends Request.Request<
  Stripe.Treasury.OutboundTransfer,
  StripeError
> {
  readonly _tag: "CancelOutboundTransferRequest";
  readonly id: string;
}

const CancelOutboundTransferRequest =
  Request.tagged<CancelOutboundTransferRequest>(
    "CancelOutboundTransferRequest"
  );

const CancelOutboundTransferResolver: RequestResolver.RequestResolver<
  CancelOutboundTransferRequest,
  StripeService
> = makeStripeResolver<CancelOutboundTransferRequest>((stripe, request) =>
  stripe.treasury.outboundTransfers.cancel(request.id)
);

/**
 * Create an outbound transfer
 */
export const create = (
  params: Stripe.Treasury.OutboundTransferCreateParams
): Effect.Effect<
  Stripe.Treasury.OutboundTransfer,
  StripeError,
  StripeService
> =>
  Effect.request(
    CreateOutboundTransferRequest({ params }),
    RequestResolver.contextFromEffect(CreateOutboundTransferResolver)
  );

/**
 * Retrieve an outbound transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.OutboundTransferRetrieveParams
): Effect.Effect<
  Stripe.Treasury.OutboundTransfer,
  StripeError,
  StripeService
> =>
  Effect.request(
    RetrieveOutboundTransferRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveOutboundTransferResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * List outbound transfers
 */
export const list = (
  params: Stripe.Treasury.OutboundTransferListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Treasury.OutboundTransfer>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListOutboundTransfersRequest({ params }),
    RequestResolver.contextFromEffect(ListOutboundTransfersResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Cancel an outbound transfer
 */
export const cancel = (
  id: string
): Effect.Effect<
  Stripe.Treasury.OutboundTransfer,
  StripeError,
  StripeService
> =>
  Effect.request(
    CancelOutboundTransferRequest({ id }),
    RequestResolver.contextFromEffect(CancelOutboundTransferResolver)
  );

/**
 * Refund resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Refund from "@thomasfosterau/effect-payments-stripe/Refund";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createRefund = (chargeId: string) =>
 *   Refund.create({ charge: chargeId });
 *
 * const program = Effect.gen(function* () {
 *   const refund = yield* createRefund("ch_123");
 *   return refund;
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
 * Request to create a refund
 */
interface CreateRefundRequest extends Request.Request<
  Stripe.Refund,
  StripeError
> {
  readonly _tag: "CreateRefundRequest";
  readonly params: Stripe.RefundCreateParams;
}

const CreateRefundRequest = Request.tagged<CreateRefundRequest>(
  "CreateRefundRequest"
);

const CreateRefundResolver: RequestResolver.RequestResolver<
  CreateRefundRequest,
  StripeService
> = makeStripeResolver<CreateRefundRequest>((stripe, request) =>
  stripe.refunds.create(request.params)
);

/**
 * Request to retrieve a refund
 */
interface RetrieveRefundRequest extends Request.Request<
  Stripe.Refund,
  StripeError
> {
  readonly _tag: "RetrieveRefundRequest";
  readonly id: string;
  readonly params?: Stripe.RefundRetrieveParams;
}

const RetrieveRefundRequest = Request.tagged<RetrieveRefundRequest>(
  "RetrieveRefundRequest"
);

const RetrieveRefundResolver: RequestResolver.RequestResolver<
  RetrieveRefundRequest,
  StripeService
> = makeStripeResolver<RetrieveRefundRequest>((stripe, request) =>
  stripe.refunds.retrieve(request.id, request.params)
);

/**
 * Request to update a refund
 */
interface UpdateRefundRequest extends Request.Request<
  Stripe.Refund,
  StripeError
> {
  readonly _tag: "UpdateRefundRequest";
  readonly id: string;
  readonly params?: Stripe.RefundUpdateParams;
}

const UpdateRefundRequest = Request.tagged<UpdateRefundRequest>(
  "UpdateRefundRequest"
);

const UpdateRefundResolver: RequestResolver.RequestResolver<
  UpdateRefundRequest,
  StripeService
> = makeStripeResolver<UpdateRefundRequest>((stripe, request) =>
  stripe.refunds.update(request.id, request.params)
);

/**
 * Request to list refunds
 */
interface ListRefundsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Refund>,
  StripeError
> {
  readonly _tag: "ListRefundsRequest";
  readonly params?: Stripe.RefundListParams;
}

const ListRefundsRequest =
  Request.tagged<ListRefundsRequest>("ListRefundsRequest");

const ListRefundsResolver: RequestResolver.RequestResolver<
  ListRefundsRequest,
  StripeService
> = makeStripeResolver<ListRefundsRequest>((stripe, request) =>
  stripe.refunds.list(request.params)
);

/**
 * Create a refund
 */
export const create = (
  params: Stripe.RefundCreateParams
): Effect.Effect<Stripe.Refund, StripeError, StripeService> =>
  Effect.request(
    CreateRefundRequest({ params }),
    RequestResolver.contextFromEffect(CreateRefundResolver)
  );

/**
 * Retrieve a refund
 */
export const retrieve = (
  id: string,
  params?: Stripe.RefundRetrieveParams
): Effect.Effect<Stripe.Refund, StripeError, StripeService> =>
  Effect.request(
    RetrieveRefundRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveRefundResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a refund
 */
export const update = (
  id: string,
  params?: Stripe.RefundUpdateParams
): Effect.Effect<Stripe.Refund, StripeError, StripeService> =>
  Effect.request(
    UpdateRefundRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateRefundResolver)
  );

/**
 * List refunds
 */
export const list = (
  params?: Stripe.RefundListParams
): Effect.Effect<Stripe.ApiList<Stripe.Refund>, StripeError, StripeService> =>
  Effect.request(
    ListRefundsRequest({ params }),
    RequestResolver.contextFromEffect(ListRefundsResolver)
  ).pipe(Effect.withRequestCaching(true));

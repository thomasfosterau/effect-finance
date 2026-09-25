/**
 * Payout resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Payout from "@thomasfosterau/effect-payments-stripe/Payout";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createPayout = (amount: number, currency: string) =>
 *   Payout.create({ amount, currency });
 *
 * const program = Effect.gen(function* () {
 *   const payout = yield* createPayout(10000, "usd");
 *   return payout;
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
 * Request to create a payout
 */
interface CreatePayoutRequest extends Request.Request<Stripe.Payout, StripeError> {
  readonly _tag: "CreatePayoutRequest";
  readonly params: Stripe.PayoutCreateParams;
}

const CreatePayoutRequest = Request.tagged<CreatePayoutRequest>("CreatePayoutRequest");

const CreatePayoutResolver: RequestResolver.RequestResolver<CreatePayoutRequest, StripeService> =
  makeStripeResolver<CreatePayoutRequest>((stripe, request) =>
    stripe.payouts.create(request.params),
  );

/**
 * Request to retrieve a payout
 */
interface RetrievePayoutRequest extends Request.Request<Stripe.Payout, StripeError> {
  readonly _tag: "RetrievePayoutRequest";
  readonly id: string;
  readonly params?: Stripe.PayoutRetrieveParams | undefined;
}

const RetrievePayoutRequest = Request.tagged<RetrievePayoutRequest>("RetrievePayoutRequest");

const RetrievePayoutResolver: RequestResolver.RequestResolver<
  RetrievePayoutRequest,
  StripeService
> = makeStripeResolver<RetrievePayoutRequest>((stripe, request) =>
  stripe.payouts.retrieve(request.id, request.params),
);

/**
 * Request to update a payout
 */
interface UpdatePayoutRequest extends Request.Request<Stripe.Payout, StripeError> {
  readonly _tag: "UpdatePayoutRequest";
  readonly id: string;
  readonly params?: Stripe.PayoutUpdateParams | undefined;
}

const UpdatePayoutRequest = Request.tagged<UpdatePayoutRequest>("UpdatePayoutRequest");

const UpdatePayoutResolver: RequestResolver.RequestResolver<UpdatePayoutRequest, StripeService> =
  makeStripeResolver<UpdatePayoutRequest>((stripe, request) =>
    stripe.payouts.update(request.id, request.params),
  );

/**
 * Request to cancel a payout
 */
interface CancelPayoutRequest extends Request.Request<Stripe.Payout, StripeError> {
  readonly _tag: "CancelPayoutRequest";
  readonly id: string;
  readonly params?: Stripe.PayoutCancelParams | undefined;
}

const CancelPayoutRequest = Request.tagged<CancelPayoutRequest>("CancelPayoutRequest");

const CancelPayoutResolver: RequestResolver.RequestResolver<CancelPayoutRequest, StripeService> =
  makeStripeResolver<CancelPayoutRequest>((stripe, request) =>
    stripe.payouts.cancel(request.id, request.params),
  );

/**
 * Request to list payouts
 */
interface ListPayoutsRequest extends Request.Request<Stripe.ApiList<Stripe.Payout>, StripeError> {
  readonly _tag: "ListPayoutsRequest";
  readonly params?: Stripe.PayoutListParams | undefined;
}

const ListPayoutsRequest = Request.tagged<ListPayoutsRequest>("ListPayoutsRequest");

const ListPayoutsResolver: RequestResolver.RequestResolver<ListPayoutsRequest, StripeService> =
  makeStripeResolver<ListPayoutsRequest>((stripe, request) => stripe.payouts.list(request.params));

/**
 * Create a payout
 */
export const create = (
  params: Stripe.PayoutCreateParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  Effect.request(
    CreatePayoutRequest({ params }),
    RequestResolver.contextFromEffect(CreatePayoutResolver),
  );

/**
 * Retrieve a payout
 */
export const retrieve = (
  id: string,
  params?: Stripe.PayoutRetrieveParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  Effect.request(
    RetrievePayoutRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrievePayoutResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a payout
 */
export const update = (
  id: string,
  params?: Stripe.PayoutUpdateParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  Effect.request(
    UpdatePayoutRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdatePayoutResolver),
  );

/**
 * Cancel a payout
 */
export const cancel = (
  id: string,
  params?: Stripe.PayoutCancelParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  Effect.request(
    CancelPayoutRequest({ id, params }),
    RequestResolver.contextFromEffect(CancelPayoutResolver),
  );

/**
 * List payouts
 */
export const list = (
  params?: Stripe.PayoutListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Payout>, StripeError, StripeService> =>
  Effect.request(
    ListPayoutsRequest({ params }),
    RequestResolver.contextFromEffect(ListPayoutsResolver),
  ).pipe(Effect.withRequestCaching(true));

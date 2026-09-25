/**
 * Charge resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Charge from "@thomasfosterau/effect-payments-stripe/Charge";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createCharge = (amount: number, currency: string, source: string) =>
 *   Charge.create({ amount, currency, source });
 *
 * const program = Effect.gen(function* () {
 *   const charge = yield* createCharge(2000, "usd", "tok_visa");
 *   return charge;
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
 * Request to create a charge
 */
interface CreateChargeRequest extends Request.Request<Stripe.Charge, StripeError> {
  readonly _tag: "CreateChargeRequest";
  readonly params: Stripe.ChargeCreateParams;
}

const CreateChargeRequest = Request.tagged<CreateChargeRequest>("CreateChargeRequest");

const CreateChargeResolver: RequestResolver.RequestResolver<CreateChargeRequest, StripeService> =
  makeStripeResolver<CreateChargeRequest>((stripe, request) =>
    stripe.charges.create(request.params),
  );

/**
 * Request to retrieve a charge
 */
interface RetrieveChargeRequest extends Request.Request<Stripe.Charge, StripeError> {
  readonly _tag: "RetrieveChargeRequest";
  readonly id: string;
  readonly params?: Stripe.ChargeRetrieveParams | undefined;
}

const RetrieveChargeRequest = Request.tagged<RetrieveChargeRequest>("RetrieveChargeRequest");

const RetrieveChargeResolver: RequestResolver.RequestResolver<
  RetrieveChargeRequest,
  StripeService
> = makeStripeResolver<RetrieveChargeRequest>((stripe, request) =>
  stripe.charges.retrieve(request.id, request.params),
);

/**
 * Request to update a charge
 */
interface UpdateChargeRequest extends Request.Request<Stripe.Charge, StripeError> {
  readonly _tag: "UpdateChargeRequest";
  readonly id: string;
  readonly params?: Stripe.ChargeUpdateParams | undefined;
}

const UpdateChargeRequest = Request.tagged<UpdateChargeRequest>("UpdateChargeRequest");

const UpdateChargeResolver: RequestResolver.RequestResolver<UpdateChargeRequest, StripeService> =
  makeStripeResolver<UpdateChargeRequest>((stripe, request) =>
    stripe.charges.update(request.id, request.params),
  );

/**
 * Request to list charges
 */
interface ListChargesRequest extends Request.Request<Stripe.ApiList<Stripe.Charge>, StripeError> {
  readonly _tag: "ListChargesRequest";
  readonly params?: Stripe.ChargeListParams | undefined;
}

const ListChargesRequest = Request.tagged<ListChargesRequest>("ListChargesRequest");

const ListChargesResolver: RequestResolver.RequestResolver<ListChargesRequest, StripeService> =
  makeStripeResolver<ListChargesRequest>((stripe, request) => stripe.charges.list(request.params));

/**
 * Create a charge
 */
export const create = (
  params: Stripe.ChargeCreateParams,
): Effect.Effect<Stripe.Charge, StripeError, StripeService> =>
  Effect.request(
    CreateChargeRequest({ params }),
    RequestResolver.contextFromEffect(CreateChargeResolver),
  );

/**
 * Retrieve a charge
 */
export const retrieve = (
  id: string,
  params?: Stripe.ChargeRetrieveParams,
): Effect.Effect<Stripe.Charge, StripeError, StripeService> =>
  Effect.request(
    RetrieveChargeRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveChargeResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a charge
 */
export const update = (
  id: string,
  params?: Stripe.ChargeUpdateParams,
): Effect.Effect<Stripe.Charge, StripeError, StripeService> =>
  Effect.request(
    UpdateChargeRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateChargeResolver),
  );

/**
 * List charges
 */
export const list = (
  params?: Stripe.ChargeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Charge>, StripeError, StripeService> =>
  Effect.request(
    ListChargesRequest({ params }),
    RequestResolver.contextFromEffect(ListChargesResolver),
  ).pipe(Effect.withRequestCaching(true));

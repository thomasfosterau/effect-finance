/**
 * Topup resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Topup from "@thomasfosterau/effect-stripe/Topup";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createTopup = (amount: number) =>
 *   Topup.create({
 *     amount,
 *     currency: "usd",
 *     description: "Top-up for account",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const topup = yield* createTopup(1000);
 *   return topup;
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
 * Request to create a topup
 */
interface CreateTopupRequest
  extends Request.Request<Stripe.Topup, StripeError> {
  readonly _tag: "CreateTopupRequest";
  readonly params: Stripe.TopupCreateParams;
}

const CreateTopupRequest = Request.tagged<CreateTopupRequest>(
  "CreateTopupRequest"
);

const CreateTopupResolver: RequestResolver.RequestResolver<CreateTopupRequest, StripeService> =
  makeStripeResolver<CreateTopupRequest>(
    (stripe, request) => stripe.topups.create(request.params)
  );

/**
 * Request to retrieve a topup
 */
interface RetrieveTopupRequest
  extends Request.Request<Stripe.Topup, StripeError> {
  readonly _tag: "RetrieveTopupRequest";
  readonly id: string;
  readonly params?: Stripe.TopupRetrieveParams;
}

const RetrieveTopupRequest = Request.tagged<RetrieveTopupRequest>(
  "RetrieveTopupRequest"
);

const RetrieveTopupResolver: RequestResolver.RequestResolver<RetrieveTopupRequest, StripeService> =
  makeStripeResolver<RetrieveTopupRequest>(
    (stripe, request) => stripe.topups.retrieve(request.id, request.params)
  );

/**
 * Request to update a topup
 */
interface UpdateTopupRequest
  extends Request.Request<Stripe.Topup, StripeError> {
  readonly _tag: "UpdateTopupRequest";
  readonly id: string;
  readonly params?: Stripe.TopupUpdateParams;
}

const UpdateTopupRequest = Request.tagged<UpdateTopupRequest>(
  "UpdateTopupRequest"
);

const UpdateTopupResolver: RequestResolver.RequestResolver<UpdateTopupRequest, StripeService> =
  makeStripeResolver<UpdateTopupRequest>(
    (stripe, request) => stripe.topups.update(request.id, request.params)
  );

/**
 * Request to list topups
 */
interface ListTopupsRequest
  extends Request.Request<Stripe.ApiList<Stripe.Topup>, StripeError> {
  readonly _tag: "ListTopupsRequest";
  readonly params?: Stripe.TopupListParams;
}

const ListTopupsRequest = Request.tagged<ListTopupsRequest>(
  "ListTopupsRequest"
);

const ListTopupsResolver: RequestResolver.RequestResolver<ListTopupsRequest, StripeService> =
  makeStripeResolver<ListTopupsRequest>(
    (stripe, request) => stripe.topups.list(request.params)
  );

/**
 * Create a topup
 */
export const create = (
  params: Stripe.TopupCreateParams
): Effect.Effect<Stripe.Topup, StripeError, StripeService> =>
  Effect.request(
    CreateTopupRequest({ params }),
    RequestResolver.contextFromEffect(CreateTopupResolver)
  );

/**
 * Retrieve a topup
 */
export const retrieve = (
  id: string,
  params?: Stripe.TopupRetrieveParams
): Effect.Effect<Stripe.Topup, StripeError, StripeService> =>
  Effect.request(
    RetrieveTopupRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveTopupResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a topup
 */
export const update = (
  id: string,
  params?: Stripe.TopupUpdateParams
): Effect.Effect<Stripe.Topup, StripeError, StripeService> =>
  Effect.request(
    UpdateTopupRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateTopupResolver)
  );

/**
 * List topups
 */
export const list = (
  params?: Stripe.TopupListParams
): Effect.Effect<Stripe.ApiList<Stripe.Topup>, StripeError, StripeService> =>
  Effect.request(
    ListTopupsRequest({ params }),
    RequestResolver.contextFromEffect(ListTopupsResolver)
  ).pipe(Effect.withRequestCaching(true));

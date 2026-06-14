/**
 * Dispute resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Dispute from "@thomasfosterau/effect-payments-stripe/Dispute";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const updateDispute = (id: string, evidence: object) =>
 *   Dispute.update(id, { evidence });
 *
 * const program = Effect.gen(function* () {
 *   const dispute = yield* updateDispute("dp_123", { customer_name: "John" });
 *   return dispute;
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
 * Request to retrieve a dispute
 */
interface RetrieveDisputeRequest extends Request.Request<
  Stripe.Dispute,
  StripeError
> {
  readonly _tag: "RetrieveDisputeRequest";
  readonly id: string;
  readonly params?: Stripe.DisputeRetrieveParams;
}

const RetrieveDisputeRequest = Request.tagged<RetrieveDisputeRequest>(
  "RetrieveDisputeRequest"
);

const RetrieveDisputeResolver: RequestResolver.RequestResolver<
  RetrieveDisputeRequest,
  StripeService
> = makeStripeResolver<RetrieveDisputeRequest>((stripe, request) =>
  stripe.disputes.retrieve(request.id, request.params)
);

/**
 * Request to update a dispute
 */
interface UpdateDisputeRequest extends Request.Request<
  Stripe.Dispute,
  StripeError
> {
  readonly _tag: "UpdateDisputeRequest";
  readonly id: string;
  readonly params?: Stripe.DisputeUpdateParams;
}

const UpdateDisputeRequest = Request.tagged<UpdateDisputeRequest>(
  "UpdateDisputeRequest"
);

const UpdateDisputeResolver: RequestResolver.RequestResolver<
  UpdateDisputeRequest,
  StripeService
> = makeStripeResolver<UpdateDisputeRequest>((stripe, request) =>
  stripe.disputes.update(request.id, request.params)
);

/**
 * Request to list disputes
 */
interface ListDisputesRequest extends Request.Request<
  Stripe.ApiList<Stripe.Dispute>,
  StripeError
> {
  readonly _tag: "ListDisputesRequest";
  readonly params?: Stripe.DisputeListParams;
}

const ListDisputesRequest = Request.tagged<ListDisputesRequest>(
  "ListDisputesRequest"
);

const ListDisputesResolver: RequestResolver.RequestResolver<
  ListDisputesRequest,
  StripeService
> = makeStripeResolver<ListDisputesRequest>((stripe, request) =>
  stripe.disputes.list(request.params)
);

/**
 * Retrieve a dispute
 */
export const retrieve = (
  id: string,
  params?: Stripe.DisputeRetrieveParams
): Effect.Effect<Stripe.Dispute, StripeError, StripeService> =>
  Effect.request(
    RetrieveDisputeRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveDisputeResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a dispute
 */
export const update = (
  id: string,
  params?: Stripe.DisputeUpdateParams
): Effect.Effect<Stripe.Dispute, StripeError, StripeService> =>
  Effect.request(
    UpdateDisputeRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateDisputeResolver)
  );

/**
 * List disputes
 */
export const list = (
  params?: Stripe.DisputeListParams
): Effect.Effect<Stripe.ApiList<Stripe.Dispute>, StripeError, StripeService> =>
  Effect.request(
    ListDisputesRequest({ params }),
    RequestResolver.contextFromEffect(ListDisputesResolver)
  ).pipe(Effect.withRequestCaching(true));

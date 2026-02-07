/**
 * Issuing Dispute resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingDispute from "@thomasfosterau/effect-stripe/Issuing.Dispute";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createDispute = (transactionId: string) =>
 *   IssuingDispute.create({
 *     transaction: transactionId,
 *     evidence: {
 *       reason: "fraudulent",
 *       fraudulent: {
 *         explanation: "I did not authorize this transaction.",
 *       },
 *     },
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const dispute = yield* createDispute("ipi_xxx");
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
 * Request to create an issuing dispute
 */
interface CreateDisputeRequest
  extends Request.Request<Stripe.Issuing.Dispute, StripeError> {
  readonly _tag: "CreateDisputeRequest";
  readonly params: Stripe.Issuing.DisputeCreateParams;
}

const CreateDisputeRequest = Request.tagged<CreateDisputeRequest>(
  "CreateDisputeRequest"
);

const CreateDisputeResolver: RequestResolver.RequestResolver<
  CreateDisputeRequest,
  StripeService
> = makeStripeResolver<CreateDisputeRequest>(
  (stripe, request) => stripe.issuing.disputes.create(request.params)
);

/**
 * Request to retrieve an issuing dispute
 */
interface RetrieveDisputeRequest
  extends Request.Request<Stripe.Issuing.Dispute, StripeError> {
  readonly _tag: "RetrieveDisputeRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.DisputeRetrieveParams;
}

const RetrieveDisputeRequest = Request.tagged<RetrieveDisputeRequest>(
  "RetrieveDisputeRequest"
);

const RetrieveDisputeResolver: RequestResolver.RequestResolver<
  RetrieveDisputeRequest,
  StripeService
> = makeStripeResolver<RetrieveDisputeRequest>(
  (stripe, request) =>
    stripe.issuing.disputes.retrieve(request.id, request.params)
);

/**
 * Request to update an issuing dispute
 */
interface UpdateDisputeRequest
  extends Request.Request<Stripe.Issuing.Dispute, StripeError> {
  readonly _tag: "UpdateDisputeRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.DisputeUpdateParams;
}

const UpdateDisputeRequest = Request.tagged<UpdateDisputeRequest>(
  "UpdateDisputeRequest"
);

const UpdateDisputeResolver: RequestResolver.RequestResolver<
  UpdateDisputeRequest,
  StripeService
> = makeStripeResolver<UpdateDisputeRequest>(
  (stripe, request) =>
    stripe.issuing.disputes.update(request.id, request.params)
);

/**
 * Request to list issuing disputes
 */
interface ListDisputesRequest
  extends Request.Request<Stripe.ApiList<Stripe.Issuing.Dispute>, StripeError> {
  readonly _tag: "ListDisputesRequest";
  readonly params?: Stripe.Issuing.DisputeListParams;
}

const ListDisputesRequest = Request.tagged<ListDisputesRequest>(
  "ListDisputesRequest"
);

const ListDisputesResolver: RequestResolver.RequestResolver<
  ListDisputesRequest,
  StripeService
> = makeStripeResolver<ListDisputesRequest>(
  (stripe, request) => stripe.issuing.disputes.list(request.params)
);

/**
 * Create an issuing dispute
 */
export const create = (
  params: Stripe.Issuing.DisputeCreateParams
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeService> =>
  Effect.request(
    CreateDisputeRequest({ params }),
    RequestResolver.contextFromEffect(CreateDisputeResolver)
  );

/**
 * Retrieve an issuing dispute
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.DisputeRetrieveParams
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeService> =>
  Effect.request(
    RetrieveDisputeRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveDisputeResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an issuing dispute
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.DisputeUpdateParams
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeService> =>
  Effect.request(
    UpdateDisputeRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateDisputeResolver)
  );

/**
 * List issuing disputes
 */
export const list = (
  params?: Stripe.Issuing.DisputeListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Issuing.Dispute>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListDisputesRequest({ params }),
    RequestResolver.contextFromEffect(ListDisputesResolver)
  ).pipe(Effect.withRequestCaching(true));

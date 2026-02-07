/**
 * Issuing Cardholder resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingCardholder from "@thomasfosterau/effect-stripe/Issuing.Cardholder";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createCardholder = () =>
 *   IssuingCardholder.create({
 *     name: "John Doe",
 *     email: "john.doe@example.com",
 *     phone_number: "+18888675309",
 *     billing: {
 *       address: {
 *         line1: "123 Main Street",
 *         city: "San Francisco",
 *         state: "CA",
 *         postal_code: "94111",
 *         country: "US",
 *       },
 *     },
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const cardholder = yield* createCardholder();
 *   return cardholder;
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
 * Request to create an issuing cardholder
 */
interface CreateCardholderRequest
  extends Request.Request<Stripe.Issuing.Cardholder, StripeError> {
  readonly _tag: "CreateCardholderRequest";
  readonly params: Stripe.Issuing.CardholderCreateParams;
}

const CreateCardholderRequest = Request.tagged<CreateCardholderRequest>(
  "CreateCardholderRequest"
);

const CreateCardholderResolver: RequestResolver.RequestResolver<
  CreateCardholderRequest,
  StripeService
> = makeStripeResolver<CreateCardholderRequest>(
  (stripe, request) => stripe.issuing.cardholders.create(request.params)
);

/**
 * Request to retrieve an issuing cardholder
 */
interface RetrieveCardholderRequest
  extends Request.Request<Stripe.Issuing.Cardholder, StripeError> {
  readonly _tag: "RetrieveCardholderRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.CardholderRetrieveParams;
}

const RetrieveCardholderRequest = Request.tagged<RetrieveCardholderRequest>(
  "RetrieveCardholderRequest"
);

const RetrieveCardholderResolver: RequestResolver.RequestResolver<
  RetrieveCardholderRequest,
  StripeService
> = makeStripeResolver<RetrieveCardholderRequest>(
  (stripe, request) =>
    stripe.issuing.cardholders.retrieve(request.id, request.params)
);

/**
 * Request to update an issuing cardholder
 */
interface UpdateCardholderRequest
  extends Request.Request<Stripe.Issuing.Cardholder, StripeError> {
  readonly _tag: "UpdateCardholderRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.CardholderUpdateParams;
}

const UpdateCardholderRequest = Request.tagged<UpdateCardholderRequest>(
  "UpdateCardholderRequest"
);

const UpdateCardholderResolver: RequestResolver.RequestResolver<
  UpdateCardholderRequest,
  StripeService
> = makeStripeResolver<UpdateCardholderRequest>(
  (stripe, request) =>
    stripe.issuing.cardholders.update(request.id, request.params)
);

/**
 * Request to list issuing cardholders
 */
interface ListCardholdersRequest
  extends Request.Request<
    Stripe.ApiList<Stripe.Issuing.Cardholder>,
    StripeError
  > {
  readonly _tag: "ListCardholdersRequest";
  readonly params?: Stripe.Issuing.CardholderListParams;
}

const ListCardholdersRequest = Request.tagged<ListCardholdersRequest>(
  "ListCardholdersRequest"
);

const ListCardholdersResolver: RequestResolver.RequestResolver<
  ListCardholdersRequest,
  StripeService
> = makeStripeResolver<ListCardholdersRequest>(
  (stripe, request) => stripe.issuing.cardholders.list(request.params)
);

/**
 * Create an issuing cardholder
 */
export const create = (
  params: Stripe.Issuing.CardholderCreateParams
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeService> =>
  Effect.request(
    CreateCardholderRequest({ params }),
    RequestResolver.contextFromEffect(CreateCardholderResolver)
  );

/**
 * Retrieve an issuing cardholder
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardholderRetrieveParams
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeService> =>
  Effect.request(
    RetrieveCardholderRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveCardholderResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an issuing cardholder
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardholderUpdateParams
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeService> =>
  Effect.request(
    UpdateCardholderRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateCardholderResolver)
  );

/**
 * List issuing cardholders
 */
export const list = (
  params?: Stripe.Issuing.CardholderListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Issuing.Cardholder>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListCardholdersRequest({ params }),
    RequestResolver.contextFromEffect(ListCardholdersResolver)
  ).pipe(Effect.withRequestCaching(true));

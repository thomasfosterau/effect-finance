/**
 * SetupIntent resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as SetupIntent from "@thomasfosterau/effect-payments-stripe/SetupIntent";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createSetupIntent = () =>
 *   SetupIntent.create({ payment_method_types: ["card"] });
 *
 * const program = Effect.gen(function* () {
 *   const setupIntent = yield* createSetupIntent();
 *   return setupIntent;
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
 * Request to create a setup intent
 */
interface CreateSetupIntentRequest extends Request.Request<Stripe.SetupIntent, StripeError> {
  readonly _tag: "CreateSetupIntentRequest";
  readonly params?: Stripe.SetupIntentCreateParams | undefined;
}

const CreateSetupIntentRequest = Request.tagged<CreateSetupIntentRequest>(
  "CreateSetupIntentRequest",
);

const CreateSetupIntentResolver: RequestResolver.RequestResolver<
  CreateSetupIntentRequest,
  StripeService
> = makeStripeResolver<CreateSetupIntentRequest>((stripe, request) =>
  stripe.setupIntents.create(request.params),
);

/**
 * Request to retrieve a setup intent
 */
interface RetrieveSetupIntentRequest extends Request.Request<Stripe.SetupIntent, StripeError> {
  readonly _tag: "RetrieveSetupIntentRequest";
  readonly id: string;
  readonly params?: Stripe.SetupIntentRetrieveParams | undefined;
}

const RetrieveSetupIntentRequest = Request.tagged<RetrieveSetupIntentRequest>(
  "RetrieveSetupIntentRequest",
);

const RetrieveSetupIntentResolver: RequestResolver.RequestResolver<
  RetrieveSetupIntentRequest,
  StripeService
> = makeStripeResolver<RetrieveSetupIntentRequest>((stripe, request) =>
  stripe.setupIntents.retrieve(request.id, request.params),
);

/**
 * Request to update a setup intent
 */
interface UpdateSetupIntentRequest extends Request.Request<Stripe.SetupIntent, StripeError> {
  readonly _tag: "UpdateSetupIntentRequest";
  readonly id: string;
  readonly params?: Stripe.SetupIntentUpdateParams | undefined;
}

const UpdateSetupIntentRequest = Request.tagged<UpdateSetupIntentRequest>(
  "UpdateSetupIntentRequest",
);

const UpdateSetupIntentResolver: RequestResolver.RequestResolver<
  UpdateSetupIntentRequest,
  StripeService
> = makeStripeResolver<UpdateSetupIntentRequest>((stripe, request) =>
  stripe.setupIntents.update(request.id, request.params),
);

/**
 * Request to confirm a setup intent
 */
interface ConfirmSetupIntentRequest extends Request.Request<Stripe.SetupIntent, StripeError> {
  readonly _tag: "ConfirmSetupIntentRequest";
  readonly id: string;
  readonly params?: Stripe.SetupIntentConfirmParams | undefined;
}

const ConfirmSetupIntentRequest = Request.tagged<ConfirmSetupIntentRequest>(
  "ConfirmSetupIntentRequest",
);

const ConfirmSetupIntentResolver: RequestResolver.RequestResolver<
  ConfirmSetupIntentRequest,
  StripeService
> = makeStripeResolver<ConfirmSetupIntentRequest>((stripe, request) =>
  stripe.setupIntents.confirm(request.id, request.params),
);

/**
 * Request to cancel a setup intent
 */
interface CancelSetupIntentRequest extends Request.Request<Stripe.SetupIntent, StripeError> {
  readonly _tag: "CancelSetupIntentRequest";
  readonly id: string;
  readonly params?: Stripe.SetupIntentCancelParams | undefined;
}

const CancelSetupIntentRequest = Request.tagged<CancelSetupIntentRequest>(
  "CancelSetupIntentRequest",
);

const CancelSetupIntentResolver: RequestResolver.RequestResolver<
  CancelSetupIntentRequest,
  StripeService
> = makeStripeResolver<CancelSetupIntentRequest>((stripe, request) =>
  stripe.setupIntents.cancel(request.id, request.params),
);

/**
 * Request to list setup intents
 */
interface ListSetupIntentsRequest extends Request.Request<
  Stripe.ApiList<Stripe.SetupIntent>,
  StripeError
> {
  readonly _tag: "ListSetupIntentsRequest";
  readonly params?: Stripe.SetupIntentListParams | undefined;
}

const ListSetupIntentsRequest = Request.tagged<ListSetupIntentsRequest>("ListSetupIntentsRequest");

const ListSetupIntentsResolver: RequestResolver.RequestResolver<
  ListSetupIntentsRequest,
  StripeService
> = makeStripeResolver<ListSetupIntentsRequest>((stripe, request) =>
  stripe.setupIntents.list(request.params),
);

/**
 * Create a setup intent
 */
export const create = (
  params?: Stripe.SetupIntentCreateParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  Effect.request(
    CreateSetupIntentRequest({ params }),
    RequestResolver.contextFromEffect(CreateSetupIntentResolver),
  );

/**
 * Retrieve a setup intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.SetupIntentRetrieveParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  Effect.request(
    RetrieveSetupIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveSetupIntentResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a setup intent
 */
export const update = (
  id: string,
  params?: Stripe.SetupIntentUpdateParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  Effect.request(
    UpdateSetupIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateSetupIntentResolver),
  );

/**
 * Confirm a setup intent
 */
export const confirm = (
  id: string,
  params?: Stripe.SetupIntentConfirmParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  Effect.request(
    ConfirmSetupIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(ConfirmSetupIntentResolver),
  );

/**
 * Cancel a setup intent
 */
export const cancel = (
  id: string,
  params?: Stripe.SetupIntentCancelParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  Effect.request(
    CancelSetupIntentRequest({ id, params }),
    RequestResolver.contextFromEffect(CancelSetupIntentResolver),
  );

/**
 * List setup intents
 */
export const list = (
  params?: Stripe.SetupIntentListParams,
): Effect.Effect<Stripe.ApiList<Stripe.SetupIntent>, StripeError, StripeService> =>
  Effect.request(
    ListSetupIntentsRequest({ params }),
    RequestResolver.contextFromEffect(ListSetupIntentsResolver),
  ).pipe(Effect.withRequestCaching(true));

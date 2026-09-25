/**
 * SubscriptionSchedule resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as SubscriptionSchedule from "@thomasfosterau/effect-payments-stripe/SubscriptionSchedule";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createSchedule = (customerId: string, phases: object[]) =>
 *   SubscriptionSchedule.create({ customer: customerId, phases });
 *
 * const program = Effect.gen(function* () {
 *   const schedule = yield* createSchedule("cus_123", [{ items: [{ price: "price_123" }] }]);
 *   return schedule;
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
 * Request to create a subscription schedule
 */
interface CreateSubscriptionScheduleRequest extends Request.Request<
  Stripe.SubscriptionSchedule,
  StripeError
> {
  readonly _tag: "CreateSubscriptionScheduleRequest";
  readonly params?: Stripe.SubscriptionScheduleCreateParams | undefined;
}

const CreateSubscriptionScheduleRequest = Request.tagged<CreateSubscriptionScheduleRequest>(
  "CreateSubscriptionScheduleRequest",
);

const CreateSubscriptionScheduleResolver: RequestResolver.RequestResolver<
  CreateSubscriptionScheduleRequest,
  StripeService
> = makeStripeResolver<CreateSubscriptionScheduleRequest>((stripe, request) =>
  stripe.subscriptionSchedules.create(request.params),
);

/**
 * Request to retrieve a subscription schedule
 */
interface RetrieveSubscriptionScheduleRequest extends Request.Request<
  Stripe.SubscriptionSchedule,
  StripeError
> {
  readonly _tag: "RetrieveSubscriptionScheduleRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionScheduleRetrieveParams | undefined;
}

const RetrieveSubscriptionScheduleRequest = Request.tagged<RetrieveSubscriptionScheduleRequest>(
  "RetrieveSubscriptionScheduleRequest",
);

const RetrieveSubscriptionScheduleResolver: RequestResolver.RequestResolver<
  RetrieveSubscriptionScheduleRequest,
  StripeService
> = makeStripeResolver<RetrieveSubscriptionScheduleRequest>((stripe, request) =>
  stripe.subscriptionSchedules.retrieve(request.id, request.params),
);

/**
 * Request to update a subscription schedule
 */
interface UpdateSubscriptionScheduleRequest extends Request.Request<
  Stripe.SubscriptionSchedule,
  StripeError
> {
  readonly _tag: "UpdateSubscriptionScheduleRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionScheduleUpdateParams | undefined;
}

const UpdateSubscriptionScheduleRequest = Request.tagged<UpdateSubscriptionScheduleRequest>(
  "UpdateSubscriptionScheduleRequest",
);

const UpdateSubscriptionScheduleResolver: RequestResolver.RequestResolver<
  UpdateSubscriptionScheduleRequest,
  StripeService
> = makeStripeResolver<UpdateSubscriptionScheduleRequest>((stripe, request) =>
  stripe.subscriptionSchedules.update(request.id, request.params),
);

/**
 * Request to cancel a subscription schedule
 */
interface CancelSubscriptionScheduleRequest extends Request.Request<
  Stripe.SubscriptionSchedule,
  StripeError
> {
  readonly _tag: "CancelSubscriptionScheduleRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionScheduleCancelParams | undefined;
}

const CancelSubscriptionScheduleRequest = Request.tagged<CancelSubscriptionScheduleRequest>(
  "CancelSubscriptionScheduleRequest",
);

const CancelSubscriptionScheduleResolver: RequestResolver.RequestResolver<
  CancelSubscriptionScheduleRequest,
  StripeService
> = makeStripeResolver<CancelSubscriptionScheduleRequest>((stripe, request) =>
  stripe.subscriptionSchedules.cancel(request.id, request.params),
);

/**
 * Request to release a subscription schedule
 */
interface ReleaseSubscriptionScheduleRequest extends Request.Request<
  Stripe.SubscriptionSchedule,
  StripeError
> {
  readonly _tag: "ReleaseSubscriptionScheduleRequest";
  readonly id: string;
  readonly params?: Stripe.SubscriptionScheduleReleaseParams | undefined;
}

const ReleaseSubscriptionScheduleRequest = Request.tagged<ReleaseSubscriptionScheduleRequest>(
  "ReleaseSubscriptionScheduleRequest",
);

const ReleaseSubscriptionScheduleResolver: RequestResolver.RequestResolver<
  ReleaseSubscriptionScheduleRequest,
  StripeService
> = makeStripeResolver<ReleaseSubscriptionScheduleRequest>((stripe, request) =>
  stripe.subscriptionSchedules.release(request.id, request.params),
);

/**
 * Request to list subscription schedules
 */
interface ListSubscriptionSchedulesRequest extends Request.Request<
  Stripe.ApiList<Stripe.SubscriptionSchedule>,
  StripeError
> {
  readonly _tag: "ListSubscriptionSchedulesRequest";
  readonly params?: Stripe.SubscriptionScheduleListParams | undefined;
}

const ListSubscriptionSchedulesRequest = Request.tagged<ListSubscriptionSchedulesRequest>(
  "ListSubscriptionSchedulesRequest",
);

const ListSubscriptionSchedulesResolver: RequestResolver.RequestResolver<
  ListSubscriptionSchedulesRequest,
  StripeService
> = makeStripeResolver<ListSubscriptionSchedulesRequest>((stripe, request) =>
  stripe.subscriptionSchedules.list(request.params),
);

/**
 * Create a subscription schedule
 */
export const create = (
  params?: Stripe.SubscriptionScheduleCreateParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  Effect.request(
    CreateSubscriptionScheduleRequest({ params }),
    RequestResolver.contextFromEffect(CreateSubscriptionScheduleResolver),
  );

/**
 * Retrieve a subscription schedule
 */
export const retrieve = (
  id: string,
  params?: Stripe.SubscriptionScheduleRetrieveParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  Effect.request(
    RetrieveSubscriptionScheduleRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveSubscriptionScheduleResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a subscription schedule
 */
export const update = (
  id: string,
  params?: Stripe.SubscriptionScheduleUpdateParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  Effect.request(
    UpdateSubscriptionScheduleRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateSubscriptionScheduleResolver),
  );

/**
 * Cancel a subscription schedule
 */
export const cancel = (
  id: string,
  params?: Stripe.SubscriptionScheduleCancelParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  Effect.request(
    CancelSubscriptionScheduleRequest({ id, params }),
    RequestResolver.contextFromEffect(CancelSubscriptionScheduleResolver),
  );

/**
 * Release a subscription schedule
 */
export const release = (
  id: string,
  params?: Stripe.SubscriptionScheduleReleaseParams,
): Effect.Effect<Stripe.SubscriptionSchedule, StripeError, StripeService> =>
  Effect.request(
    ReleaseSubscriptionScheduleRequest({ id, params }),
    RequestResolver.contextFromEffect(ReleaseSubscriptionScheduleResolver),
  );

/**
 * List subscription schedules
 */
export const list = (
  params?: Stripe.SubscriptionScheduleListParams,
): Effect.Effect<Stripe.ApiList<Stripe.SubscriptionSchedule>, StripeError, StripeService> =>
  Effect.request(
    ListSubscriptionSchedulesRequest({ params }),
    RequestResolver.contextFromEffect(ListSubscriptionSchedulesResolver),
  ).pipe(Effect.withRequestCaching(true));

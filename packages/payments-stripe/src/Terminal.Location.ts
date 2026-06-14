/**
 * Terminal Location resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TerminalLocation from "@thomasfosterau/effect-payments-stripe/Terminal.Location";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createLocation = () =>
 *   TerminalLocation.create({
 *     display_name: "HQ",
 *     address: {
 *       line1: "1272 Valencia Street",
 *       city: "San Francisco",
 *       state: "CA",
 *       country: "US",
 *       postal_code: "94110"
 *     }
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const location = yield* createLocation();
 *   return location;
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
 * Request to create a terminal location
 */
interface CreateLocationRequest extends Request.Request<
  Stripe.Terminal.Location,
  StripeError
> {
  readonly _tag: "CreateLocationRequest";
  readonly params: Stripe.Terminal.LocationCreateParams;
}

const CreateLocationRequest = Request.tagged<CreateLocationRequest>(
  "CreateLocationRequest"
);

const CreateLocationResolver: RequestResolver.RequestResolver<
  CreateLocationRequest,
  StripeService
> = makeStripeResolver<CreateLocationRequest>((stripe, request) =>
  stripe.terminal.locations.create(request.params)
);

/**
 * Request to retrieve a terminal location
 */
interface RetrieveLocationRequest extends Request.Request<
  Stripe.Terminal.Location,
  StripeError
> {
  readonly _tag: "RetrieveLocationRequest";
  readonly id: string;
  readonly params?: Stripe.Terminal.LocationRetrieveParams;
}

const RetrieveLocationRequest = Request.tagged<RetrieveLocationRequest>(
  "RetrieveLocationRequest"
);

const RetrieveLocationResolver: RequestResolver.RequestResolver<
  RetrieveLocationRequest,
  StripeService
> = makeStripeResolver<RetrieveLocationRequest>(
  (stripe, request) =>
    stripe.terminal.locations.retrieve(
      request.id,
      request.params
    ) as Promise<Stripe.Terminal.Location>
);

/**
 * Request to update a terminal location
 */
interface UpdateLocationRequest extends Request.Request<
  Stripe.Terminal.Location,
  StripeError
> {
  readonly _tag: "UpdateLocationRequest";
  readonly id: string;
  readonly params?: Stripe.Terminal.LocationUpdateParams;
}

const UpdateLocationRequest = Request.tagged<UpdateLocationRequest>(
  "UpdateLocationRequest"
);

const UpdateLocationResolver: RequestResolver.RequestResolver<
  UpdateLocationRequest,
  StripeService
> = makeStripeResolver<UpdateLocationRequest>(
  (stripe, request) =>
    stripe.terminal.locations.update(
      request.id,
      request.params
    ) as Promise<Stripe.Terminal.Location>
);

/**
 * Request to delete a terminal location
 */
interface DeleteLocationRequest extends Request.Request<
  Stripe.Terminal.DeletedLocation,
  StripeError
> {
  readonly _tag: "DeleteLocationRequest";
  readonly id: string;
}

const DeleteLocationRequest = Request.tagged<DeleteLocationRequest>(
  "DeleteLocationRequest"
);

const DeleteLocationResolver: RequestResolver.RequestResolver<
  DeleteLocationRequest,
  StripeService
> = makeStripeResolver<DeleteLocationRequest>((stripe, request) =>
  stripe.terminal.locations.del(request.id)
);

/**
 * Request to list terminal locations
 */
interface ListLocationsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Terminal.Location>,
  StripeError
> {
  readonly _tag: "ListLocationsRequest";
  readonly params?: Stripe.Terminal.LocationListParams;
}

const ListLocationsRequest = Request.tagged<ListLocationsRequest>(
  "ListLocationsRequest"
);

const ListLocationsResolver: RequestResolver.RequestResolver<
  ListLocationsRequest,
  StripeService
> = makeStripeResolver<ListLocationsRequest>((stripe, request) =>
  stripe.terminal.locations.list(request.params)
);

/**
 * Create a terminal location
 */
export const create = (
  params: Stripe.Terminal.LocationCreateParams
): Effect.Effect<Stripe.Terminal.Location, StripeError, StripeService> =>
  Effect.request(
    CreateLocationRequest({ params }),
    RequestResolver.contextFromEffect(CreateLocationResolver)
  );

/**
 * Retrieve a terminal location
 */
export const retrieve = (
  id: string,
  params?: Stripe.Terminal.LocationRetrieveParams
): Effect.Effect<Stripe.Terminal.Location, StripeError, StripeService> =>
  Effect.request(
    RetrieveLocationRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveLocationResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a terminal location
 */
export const update = (
  id: string,
  params?: Stripe.Terminal.LocationUpdateParams
): Effect.Effect<Stripe.Terminal.Location, StripeError, StripeService> =>
  Effect.request(
    UpdateLocationRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateLocationResolver)
  );

/**
 * Delete a terminal location
 */
export const del = (
  id: string
): Effect.Effect<Stripe.Terminal.DeletedLocation, StripeError, StripeService> =>
  Effect.request(
    DeleteLocationRequest({ id }),
    RequestResolver.contextFromEffect(DeleteLocationResolver)
  );

/**
 * List terminal locations
 */
export const list = (
  params?: Stripe.Terminal.LocationListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Terminal.Location>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListLocationsRequest({ params }),
    RequestResolver.contextFromEffect(ListLocationsResolver)
  ).pipe(Effect.withRequestCaching(true));

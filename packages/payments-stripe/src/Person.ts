/**
 * Person resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Person from "@thomasfosterau/effect-payments-stripe/Person";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createPerson = (accountId: string) =>
 *   Person.create(accountId, {
 *     first_name: "Jane",
 *     last_name: "Doe",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const person = yield* createPerson("acct_123");
 *   return person;
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
 * Request to create a person
 */
interface CreatePersonRequest extends Request.Request<
  Stripe.Person,
  StripeError
> {
  readonly _tag: "CreatePersonRequest";
  readonly accountId: string;
  readonly params: Stripe.PersonCreateParams;
}

const CreatePersonRequest = Request.tagged<CreatePersonRequest>(
  "CreatePersonRequest"
);

const CreatePersonResolver: RequestResolver.RequestResolver<
  CreatePersonRequest,
  StripeService
> = makeStripeResolver<CreatePersonRequest>((stripe, request) =>
  stripe.accounts.createPerson(request.accountId, request.params)
);

/**
 * Request to retrieve a person
 */
interface RetrievePersonRequest extends Request.Request<
  Stripe.Person,
  StripeError
> {
  readonly _tag: "RetrievePersonRequest";
  readonly accountId: string;
  readonly id: string;
  readonly params?: Stripe.PersonRetrieveParams;
}

const RetrievePersonRequest = Request.tagged<RetrievePersonRequest>(
  "RetrievePersonRequest"
);

const RetrievePersonResolver: RequestResolver.RequestResolver<
  RetrievePersonRequest,
  StripeService
> = makeStripeResolver<RetrievePersonRequest>((stripe, request) =>
  stripe.accounts.retrievePerson(request.accountId, request.id, request.params)
);

/**
 * Request to update a person
 */
interface UpdatePersonRequest extends Request.Request<
  Stripe.Person,
  StripeError
> {
  readonly _tag: "UpdatePersonRequest";
  readonly accountId: string;
  readonly id: string;
  readonly params?: Stripe.PersonUpdateParams;
}

const UpdatePersonRequest = Request.tagged<UpdatePersonRequest>(
  "UpdatePersonRequest"
);

const UpdatePersonResolver: RequestResolver.RequestResolver<
  UpdatePersonRequest,
  StripeService
> = makeStripeResolver<UpdatePersonRequest>((stripe, request) =>
  stripe.accounts.updatePerson(request.accountId, request.id, request.params)
);

/**
 * Request to delete a person
 */
interface DeletePersonRequest extends Request.Request<
  Stripe.DeletedPerson,
  StripeError
> {
  readonly _tag: "DeletePersonRequest";
  readonly accountId: string;
  readonly id: string;
}

const DeletePersonRequest = Request.tagged<DeletePersonRequest>(
  "DeletePersonRequest"
);

const DeletePersonResolver: RequestResolver.RequestResolver<
  DeletePersonRequest,
  StripeService
> = makeStripeResolver<DeletePersonRequest>((stripe, request) =>
  stripe.accounts.deletePerson(request.accountId, request.id)
);

/**
 * Request to list persons
 */
interface ListPersonsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Person>,
  StripeError
> {
  readonly _tag: "ListPersonsRequest";
  readonly accountId: string;
  readonly params?: Stripe.PersonListParams;
}

const ListPersonsRequest =
  Request.tagged<ListPersonsRequest>("ListPersonsRequest");

const ListPersonsResolver: RequestResolver.RequestResolver<
  ListPersonsRequest,
  StripeService
> = makeStripeResolver<ListPersonsRequest>((stripe, request) =>
  stripe.accounts.listPersons(request.accountId, request.params)
);

/**
 * Create a person
 */
export const create = (
  accountId: string,
  params: Stripe.PersonCreateParams
): Effect.Effect<Stripe.Person, StripeError, StripeService> =>
  Effect.request(
    CreatePersonRequest({ accountId, params }),
    RequestResolver.contextFromEffect(CreatePersonResolver)
  );

/**
 * Retrieve a person
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.PersonRetrieveParams
): Effect.Effect<Stripe.Person, StripeError, StripeService> =>
  Effect.request(
    RetrievePersonRequest({ accountId, id, params }),
    RequestResolver.contextFromEffect(RetrievePersonResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a person
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.PersonUpdateParams
): Effect.Effect<Stripe.Person, StripeError, StripeService> =>
  Effect.request(
    UpdatePersonRequest({ accountId, id, params }),
    RequestResolver.contextFromEffect(UpdatePersonResolver)
  );

/**
 * Delete a person
 */
export const del = (
  accountId: string,
  id: string
): Effect.Effect<Stripe.DeletedPerson, StripeError, StripeService> =>
  Effect.request(
    DeletePersonRequest({ accountId, id }),
    RequestResolver.contextFromEffect(DeletePersonResolver)
  );

/**
 * List persons
 */
export const list = (
  accountId: string,
  params?: Stripe.PersonListParams
): Effect.Effect<Stripe.ApiList<Stripe.Person>, StripeError, StripeService> =>
  Effect.request(
    ListPersonsRequest({ accountId, params }),
    RequestResolver.contextFromEffect(ListPersonsResolver)
  ).pipe(Effect.withRequestCaching(true));

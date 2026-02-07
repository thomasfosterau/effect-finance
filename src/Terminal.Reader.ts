/**
 * Terminal Reader resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TerminalReader from "@thomasfosterau/effect-stripe/Terminal.Reader";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const registerReader = (registrationCode: string, locationId: string) =>
 *   TerminalReader.create({
 *     registration_code: registrationCode,
 *     location: locationId,
 *     label: "Front Desk Reader"
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const reader = yield* registerReader("simulated-wpe", "tml_123");
 *   return reader;
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
 * Request to create a terminal reader
 */
interface CreateReaderRequest
  extends Request.Request<Stripe.Terminal.Reader, StripeError> {
  readonly _tag: "CreateReaderRequest";
  readonly params: Stripe.Terminal.ReaderCreateParams;
}

const CreateReaderRequest = Request.tagged<CreateReaderRequest>(
  "CreateReaderRequest"
);

const CreateReaderResolver: RequestResolver.RequestResolver<CreateReaderRequest, StripeService> =
  makeStripeResolver<CreateReaderRequest>(
    (stripe, request) => stripe.terminal.readers.create(request.params)
  );

/**
 * Request to retrieve a terminal reader
 */
interface RetrieveReaderRequest
  extends Request.Request<Stripe.Terminal.Reader, StripeError> {
  readonly _tag: "RetrieveReaderRequest";
  readonly id: string;
  readonly params?: Stripe.Terminal.ReaderRetrieveParams;
}

const RetrieveReaderRequest = Request.tagged<RetrieveReaderRequest>(
  "RetrieveReaderRequest"
);

const RetrieveReaderResolver: RequestResolver.RequestResolver<RetrieveReaderRequest, StripeService> =
  makeStripeResolver<RetrieveReaderRequest>(
    (stripe, request) =>
      stripe.terminal.readers.retrieve(request.id, request.params) as Promise<Stripe.Terminal.Reader>
  );

/**
 * Request to update a terminal reader
 */
interface UpdateReaderRequest
  extends Request.Request<Stripe.Terminal.Reader, StripeError> {
  readonly _tag: "UpdateReaderRequest";
  readonly id: string;
  readonly params?: Stripe.Terminal.ReaderUpdateParams;
}

const UpdateReaderRequest = Request.tagged<UpdateReaderRequest>(
  "UpdateReaderRequest"
);

const UpdateReaderResolver: RequestResolver.RequestResolver<UpdateReaderRequest, StripeService> =
  makeStripeResolver<UpdateReaderRequest>(
    (stripe, request) =>
      stripe.terminal.readers.update(request.id, request.params) as Promise<Stripe.Terminal.Reader>
  );

/**
 * Request to delete a terminal reader
 */
interface DeleteReaderRequest
  extends Request.Request<Stripe.Terminal.DeletedReader, StripeError> {
  readonly _tag: "DeleteReaderRequest";
  readonly id: string;
}

const DeleteReaderRequest = Request.tagged<DeleteReaderRequest>(
  "DeleteReaderRequest"
);

const DeleteReaderResolver: RequestResolver.RequestResolver<DeleteReaderRequest, StripeService> =
  makeStripeResolver<DeleteReaderRequest>(
    (stripe, request) => stripe.terminal.readers.del(request.id)
  );

/**
 * Request to list terminal readers
 */
interface ListReadersRequest
  extends Request.Request<
    Stripe.ApiList<Stripe.Terminal.Reader>,
    StripeError
  > {
  readonly _tag: "ListReadersRequest";
  readonly params?: Stripe.Terminal.ReaderListParams;
}

const ListReadersRequest = Request.tagged<ListReadersRequest>(
  "ListReadersRequest"
);

const ListReadersResolver: RequestResolver.RequestResolver<ListReadersRequest, StripeService> =
  makeStripeResolver<ListReadersRequest>(
    (stripe, request) => stripe.terminal.readers.list(request.params)
  );

/**
 * Create a terminal reader
 */
export const create = (
  params: Stripe.Terminal.ReaderCreateParams
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeService> =>
  Effect.request(
    CreateReaderRequest({ params }),
    RequestResolver.contextFromEffect(CreateReaderResolver)
  );

/**
 * Retrieve a terminal reader
 */
export const retrieve = (
  id: string,
  params?: Stripe.Terminal.ReaderRetrieveParams
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeService> =>
  Effect.request(
    RetrieveReaderRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveReaderResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a terminal reader
 */
export const update = (
  id: string,
  params?: Stripe.Terminal.ReaderUpdateParams
): Effect.Effect<Stripe.Terminal.Reader, StripeError, StripeService> =>
  Effect.request(
    UpdateReaderRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateReaderResolver)
  );

/**
 * Delete a terminal reader
 */
export const del = (
  id: string
): Effect.Effect<Stripe.Terminal.DeletedReader, StripeError, StripeService> =>
  Effect.request(
    DeleteReaderRequest({ id }),
    RequestResolver.contextFromEffect(DeleteReaderResolver)
  );

/**
 * List terminal readers
 */
export const list = (
  params?: Stripe.Terminal.ReaderListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Terminal.Reader>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListReadersRequest({ params }),
    RequestResolver.contextFromEffect(ListReadersResolver)
  ).pipe(Effect.withRequestCaching(true));

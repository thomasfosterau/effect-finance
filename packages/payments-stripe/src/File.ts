/**
 * File resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as File from "@thomasfosterau/effect-payments-stripe/File";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createFile = (file: Buffer, purpose: string) =>
 *   File.create({ file, purpose });
 *
 * const program = Effect.gen(function* () {
 *   const fileObj = yield* createFile(Buffer.from("..."), "dispute_evidence");
 *   return fileObj;
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
 * Request to create a file
 */
interface CreateFileRequest extends Request.Request<Stripe.File, StripeError> {
  readonly _tag: "CreateFileRequest";
  readonly params: Stripe.FileCreateParams;
}

const CreateFileRequest =
  Request.tagged<CreateFileRequest>("CreateFileRequest");

const CreateFileResolver: RequestResolver.RequestResolver<
  CreateFileRequest,
  StripeService
> = makeStripeResolver<CreateFileRequest>((stripe, request) =>
  stripe.files.create(request.params)
);

/**
 * Request to retrieve a file
 */
interface RetrieveFileRequest extends Request.Request<
  Stripe.File,
  StripeError
> {
  readonly _tag: "RetrieveFileRequest";
  readonly id: string;
  readonly params?: Stripe.FileRetrieveParams;
}

const RetrieveFileRequest = Request.tagged<RetrieveFileRequest>(
  "RetrieveFileRequest"
);

const RetrieveFileResolver: RequestResolver.RequestResolver<
  RetrieveFileRequest,
  StripeService
> = makeStripeResolver<RetrieveFileRequest>((stripe, request) =>
  stripe.files.retrieve(request.id, request.params)
);

/**
 * Request to list files
 */
interface ListFilesRequest extends Request.Request<
  Stripe.ApiList<Stripe.File>,
  StripeError
> {
  readonly _tag: "ListFilesRequest";
  readonly params?: Stripe.FileListParams;
}

const ListFilesRequest = Request.tagged<ListFilesRequest>("ListFilesRequest");

const ListFilesResolver: RequestResolver.RequestResolver<
  ListFilesRequest,
  StripeService
> = makeStripeResolver<ListFilesRequest>((stripe, request) =>
  stripe.files.list(request.params)
);

/**
 * Create a file
 */
export const create = (
  params: Stripe.FileCreateParams
): Effect.Effect<Stripe.File, StripeError, StripeService> =>
  Effect.request(
    CreateFileRequest({ params }),
    RequestResolver.contextFromEffect(CreateFileResolver)
  );

/**
 * Retrieve a file
 */
export const retrieve = (
  id: string,
  params?: Stripe.FileRetrieveParams
): Effect.Effect<Stripe.File, StripeError, StripeService> =>
  Effect.request(
    RetrieveFileRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveFileResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * List files
 */
export const list = (
  params?: Stripe.FileListParams
): Effect.Effect<Stripe.ApiList<Stripe.File>, StripeError, StripeService> =>
  Effect.request(
    ListFilesRequest({ params }),
    RequestResolver.contextFromEffect(ListFilesResolver)
  ).pipe(Effect.withRequestCaching(true));

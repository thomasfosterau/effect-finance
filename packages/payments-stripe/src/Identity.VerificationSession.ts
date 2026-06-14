/**
 * Identity VerificationSession resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IdentityVerificationSession from "@thomasfosterau/effect-payments-stripe/Identity.VerificationSession";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createSession = (type: "document" | "id_number") =>
 *   IdentityVerificationSession.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const session = yield* createSession("document");
 *   return session;
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
 * Request to create a verification session
 */
interface CreateVerificationSessionRequest extends Request.Request<
  Stripe.Identity.VerificationSession,
  StripeError
> {
  readonly _tag: "CreateVerificationSessionRequest";
  readonly params: Stripe.Identity.VerificationSessionCreateParams;
}

const CreateVerificationSessionRequest =
  Request.tagged<CreateVerificationSessionRequest>(
    "CreateVerificationSessionRequest"
  );

const CreateVerificationSessionResolver: RequestResolver.RequestResolver<
  CreateVerificationSessionRequest,
  StripeService
> = makeStripeResolver<CreateVerificationSessionRequest>((stripe, request) =>
  stripe.identity.verificationSessions.create(request.params)
);

/**
 * Request to retrieve a verification session
 */
interface RetrieveVerificationSessionRequest extends Request.Request<
  Stripe.Identity.VerificationSession,
  StripeError
> {
  readonly _tag: "RetrieveVerificationSessionRequest";
  readonly id: string;
  readonly params?: Stripe.Identity.VerificationSessionRetrieveParams;
}

const RetrieveVerificationSessionRequest =
  Request.tagged<RetrieveVerificationSessionRequest>(
    "RetrieveVerificationSessionRequest"
  );

const RetrieveVerificationSessionResolver: RequestResolver.RequestResolver<
  RetrieveVerificationSessionRequest,
  StripeService
> = makeStripeResolver<RetrieveVerificationSessionRequest>((stripe, request) =>
  stripe.identity.verificationSessions.retrieve(request.id, request.params)
);

/**
 * Request to update a verification session
 */
interface UpdateVerificationSessionRequest extends Request.Request<
  Stripe.Identity.VerificationSession,
  StripeError
> {
  readonly _tag: "UpdateVerificationSessionRequest";
  readonly id: string;
  readonly params?: Stripe.Identity.VerificationSessionUpdateParams;
}

const UpdateVerificationSessionRequest =
  Request.tagged<UpdateVerificationSessionRequest>(
    "UpdateVerificationSessionRequest"
  );

const UpdateVerificationSessionResolver: RequestResolver.RequestResolver<
  UpdateVerificationSessionRequest,
  StripeService
> = makeStripeResolver<UpdateVerificationSessionRequest>((stripe, request) =>
  stripe.identity.verificationSessions.update(request.id, request.params)
);

/**
 * Request to cancel a verification session
 */
interface CancelVerificationSessionRequest extends Request.Request<
  Stripe.Identity.VerificationSession,
  StripeError
> {
  readonly _tag: "CancelVerificationSessionRequest";
  readonly id: string;
}

const CancelVerificationSessionRequest =
  Request.tagged<CancelVerificationSessionRequest>(
    "CancelVerificationSessionRequest"
  );

const CancelVerificationSessionResolver: RequestResolver.RequestResolver<
  CancelVerificationSessionRequest,
  StripeService
> = makeStripeResolver<CancelVerificationSessionRequest>((stripe, request) =>
  stripe.identity.verificationSessions.cancel(request.id)
);

/**
 * Request to redact a verification session
 */
interface RedactVerificationSessionRequest extends Request.Request<
  Stripe.Identity.VerificationSession,
  StripeError
> {
  readonly _tag: "RedactVerificationSessionRequest";
  readonly id: string;
}

const RedactVerificationSessionRequest =
  Request.tagged<RedactVerificationSessionRequest>(
    "RedactVerificationSessionRequest"
  );

const RedactVerificationSessionResolver: RequestResolver.RequestResolver<
  RedactVerificationSessionRequest,
  StripeService
> = makeStripeResolver<RedactVerificationSessionRequest>((stripe, request) =>
  stripe.identity.verificationSessions.redact(request.id)
);

/**
 * Request to list verification sessions
 */
interface ListVerificationSessionsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Identity.VerificationSession>,
  StripeError
> {
  readonly _tag: "ListVerificationSessionsRequest";
  readonly params?: Stripe.Identity.VerificationSessionListParams;
}

const ListVerificationSessionsRequest =
  Request.tagged<ListVerificationSessionsRequest>(
    "ListVerificationSessionsRequest"
  );

const ListVerificationSessionsResolver: RequestResolver.RequestResolver<
  ListVerificationSessionsRequest,
  StripeService
> = makeStripeResolver<ListVerificationSessionsRequest>((stripe, request) =>
  stripe.identity.verificationSessions.list(request.params)
);

/**
 * Create a verification session
 *
 * @example
 * ```typescript
 * const session = yield* IdentityVerificationSession.create({
 *   type: "document",
 *   options: { document: { require_matching_selfie: true } }
 * });
 * ```
 */
export const create = (
  params: Stripe.Identity.VerificationSessionCreateParams
): Effect.Effect<
  Stripe.Identity.VerificationSession,
  StripeError,
  StripeService
> =>
  Effect.request(
    CreateVerificationSessionRequest({ params }),
    RequestResolver.contextFromEffect(CreateVerificationSessionResolver)
  );

/**
 * Retrieve a verification session
 *
 * @example
 * ```typescript
 * const session = yield* IdentityVerificationSession.retrieve("vs_123");
 * ```
 */
export const retrieve = (
  id: string,
  params?: Stripe.Identity.VerificationSessionRetrieveParams
): Effect.Effect<
  Stripe.Identity.VerificationSession,
  StripeError,
  StripeService
> =>
  Effect.request(
    RetrieveVerificationSessionRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveVerificationSessionResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a verification session
 *
 * @example
 * ```typescript
 * const updated = yield* IdentityVerificationSession.update("vs_123", {
 *   metadata: { order_id: "order_123" }
 * });
 * ```
 */
export const update = (
  id: string,
  params?: Stripe.Identity.VerificationSessionUpdateParams
): Effect.Effect<
  Stripe.Identity.VerificationSession,
  StripeError,
  StripeService
> =>
  Effect.request(
    UpdateVerificationSessionRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateVerificationSessionResolver)
  );

/**
 * Cancel a verification session
 *
 * Only sessions in `requires_input` status can be canceled.
 *
 * @example
 * ```typescript
 * const canceled = yield* IdentityVerificationSession.cancel("vs_123");
 * ```
 */
export const cancel = (
  id: string
): Effect.Effect<
  Stripe.Identity.VerificationSession,
  StripeError,
  StripeService
> =>
  Effect.request(
    CancelVerificationSessionRequest({ id }),
    RequestResolver.contextFromEffect(CancelVerificationSessionResolver)
  );

/**
 * Redact a verification session
 *
 * Redacts all personal data associated with the verification session,
 * including associated verification reports. This action is irreversible
 * and takes up to four days to complete.
 *
 * @example
 * ```typescript
 * const redacted = yield* IdentityVerificationSession.redact("vs_123");
 * ```
 */
export const redact = (
  id: string
): Effect.Effect<
  Stripe.Identity.VerificationSession,
  StripeError,
  StripeService
> =>
  Effect.request(
    RedactVerificationSessionRequest({ id }),
    RequestResolver.contextFromEffect(RedactVerificationSessionResolver)
  );

/**
 * List verification sessions
 *
 * @example
 * ```typescript
 * const sessions = yield* IdentityVerificationSession.list({
 *   limit: 10,
 *   status: "verified"
 * });
 * ```
 */
export const list = (
  params?: Stripe.Identity.VerificationSessionListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Identity.VerificationSession>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListVerificationSessionsRequest({ params }),
    RequestResolver.contextFromEffect(ListVerificationSessionsResolver)
  ).pipe(Effect.withRequestCaching(true));

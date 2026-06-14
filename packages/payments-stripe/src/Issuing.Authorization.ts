/**
 * Issuing Authorization resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingAuthorization from "@thomasfosterau/effect-payments-stripe/Issuing.Authorization";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const authorization = yield* IssuingAuthorization.retrieve("iauth_xxx");
 *   const approved = yield* IssuingAuthorization.approve(authorization.id);
 *   return approved;
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
 * Request to retrieve an issuing authorization
 */
interface RetrieveAuthorizationRequest extends Request.Request<
  Stripe.Issuing.Authorization,
  StripeError
> {
  readonly _tag: "RetrieveAuthorizationRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.AuthorizationRetrieveParams;
}

const RetrieveAuthorizationRequest =
  Request.tagged<RetrieveAuthorizationRequest>("RetrieveAuthorizationRequest");

const RetrieveAuthorizationResolver: RequestResolver.RequestResolver<
  RetrieveAuthorizationRequest,
  StripeService
> = makeStripeResolver<RetrieveAuthorizationRequest>((stripe, request) =>
  stripe.issuing.authorizations.retrieve(request.id, request.params)
);

/**
 * Request to update an issuing authorization
 */
interface UpdateAuthorizationRequest extends Request.Request<
  Stripe.Issuing.Authorization,
  StripeError
> {
  readonly _tag: "UpdateAuthorizationRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.AuthorizationUpdateParams;
}

const UpdateAuthorizationRequest = Request.tagged<UpdateAuthorizationRequest>(
  "UpdateAuthorizationRequest"
);

const UpdateAuthorizationResolver: RequestResolver.RequestResolver<
  UpdateAuthorizationRequest,
  StripeService
> = makeStripeResolver<UpdateAuthorizationRequest>((stripe, request) =>
  stripe.issuing.authorizations.update(request.id, request.params)
);

/**
 * Request to list issuing authorizations
 */
interface ListAuthorizationsRequest extends Request.Request<
  Stripe.ApiList<Stripe.Issuing.Authorization>,
  StripeError
> {
  readonly _tag: "ListAuthorizationsRequest";
  readonly params?: Stripe.Issuing.AuthorizationListParams;
}

const ListAuthorizationsRequest = Request.tagged<ListAuthorizationsRequest>(
  "ListAuthorizationsRequest"
);

const ListAuthorizationsResolver: RequestResolver.RequestResolver<
  ListAuthorizationsRequest,
  StripeService
> = makeStripeResolver<ListAuthorizationsRequest>((stripe, request) =>
  stripe.issuing.authorizations.list(request.params)
);

/**
 * Request to approve an issuing authorization
 */
interface ApproveAuthorizationRequest extends Request.Request<
  Stripe.Issuing.Authorization,
  StripeError
> {
  readonly _tag: "ApproveAuthorizationRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.AuthorizationApproveParams;
}

const ApproveAuthorizationRequest = Request.tagged<ApproveAuthorizationRequest>(
  "ApproveAuthorizationRequest"
);

const ApproveAuthorizationResolver: RequestResolver.RequestResolver<
  ApproveAuthorizationRequest,
  StripeService
> = makeStripeResolver<ApproveAuthorizationRequest>((stripe, request) =>
  stripe.issuing.authorizations.approve(request.id, request.params)
);

/**
 * Request to decline an issuing authorization
 */
interface DeclineAuthorizationRequest extends Request.Request<
  Stripe.Issuing.Authorization,
  StripeError
> {
  readonly _tag: "DeclineAuthorizationRequest";
  readonly id: string;
  readonly params?: Stripe.Issuing.AuthorizationDeclineParams;
}

const DeclineAuthorizationRequest = Request.tagged<DeclineAuthorizationRequest>(
  "DeclineAuthorizationRequest"
);

const DeclineAuthorizationResolver: RequestResolver.RequestResolver<
  DeclineAuthorizationRequest,
  StripeService
> = makeStripeResolver<DeclineAuthorizationRequest>((stripe, request) =>
  stripe.issuing.authorizations.decline(request.id, request.params)
);

/**
 * Retrieve an issuing authorization
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationRetrieveParams
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  Effect.request(
    RetrieveAuthorizationRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveAuthorizationResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an issuing authorization
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.AuthorizationUpdateParams
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  Effect.request(
    UpdateAuthorizationRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateAuthorizationResolver)
  );

/**
 * List issuing authorizations
 */
export const list = (
  params?: Stripe.Issuing.AuthorizationListParams
): Effect.Effect<
  Stripe.ApiList<Stripe.Issuing.Authorization>,
  StripeError,
  StripeService
> =>
  Effect.request(
    ListAuthorizationsRequest({ params }),
    RequestResolver.contextFromEffect(ListAuthorizationsResolver)
  ).pipe(Effect.withRequestCaching(true));

/**
 * Approve an issuing authorization
 */
export const approve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationApproveParams
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  Effect.request(
    ApproveAuthorizationRequest({ id, params }),
    RequestResolver.contextFromEffect(ApproveAuthorizationResolver)
  );

/**
 * Decline an issuing authorization
 */
export const decline = (
  id: string,
  params?: Stripe.Issuing.AuthorizationDeclineParams
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  Effect.request(
    DeclineAuthorizationRequest({ id, params }),
    RequestResolver.contextFromEffect(DeclineAuthorizationResolver)
  );

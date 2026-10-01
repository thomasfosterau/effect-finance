/**
 * Issuing Authorization resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as IssuingAuthorization from "@thomasfosterau/effect-payments-stripe/Issuing.Authorization";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const authorization = yield* IssuingAuthorization.retrieve("iauth_xxx");
 *   const approved = yield* IssuingAuthorization.approve(authorization.id);
 *   return approved;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve an issuing authorization
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/authorizations/${id}`, params, options);

/**
 * Update an issuing authorization
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.AuthorizationUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/authorizations/${id}`, params, options);

/**
 * List issuing authorizations
 */
export const list = (
  params?: Stripe.Issuing.AuthorizationListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Authorization>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/authorizations", params, options);

/**
 * Approve an issuing authorization
 */
export const approve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationApproveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/authorizations/${id}/approve`, params, options);

/**
 * Decline an issuing authorization
 */
export const decline = (
  id: string,
  params?: Stripe.Issuing.AuthorizationDeclineParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/authorizations/${id}/decline`, params, options);

/**
 * Stripe's `/v1/issuing/authorizations` API as a raw resource module, the
 * escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve an issuing authorization (`GET /v1/issuing/authorizations/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/authorizations/${id}`, params, options);

/**
 * Update an issuing authorization (`POST /v1/issuing/authorizations/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.AuthorizationUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/authorizations/${id}`, params, options);

/**
 * List issuing authorizations (`GET /v1/issuing/authorizations`).
 */
export const list = (
  params?: Stripe.Issuing.AuthorizationListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Authorization>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/authorizations", params, options);

/**
 * Approve an issuing authorization
 * (`POST /v1/issuing/authorizations/{id}/approve`).
 */
export const approve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationApproveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/authorizations/${id}/approve`, params, options);

/**
 * Decline an issuing authorization
 * (`POST /v1/issuing/authorizations/{id}/decline`).
 */
export const decline = (
  id: string,
  params?: Stripe.Issuing.AuthorizationDeclineParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/authorizations/${id}/decline`, params, options);

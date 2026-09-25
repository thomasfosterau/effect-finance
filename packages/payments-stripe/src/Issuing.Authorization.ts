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

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Retrieve an issuing authorization
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationRetrieveParams,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.authorizations.retrieve(id, params));

/**
 * Update an issuing authorization
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.AuthorizationUpdateParams,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.authorizations.update(id, params));

/**
 * List issuing authorizations
 */
export const list = (
  params?: Stripe.Issuing.AuthorizationListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Authorization>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.authorizations.list(params));

/**
 * Approve an issuing authorization
 */
export const approve = (
  id: string,
  params?: Stripe.Issuing.AuthorizationApproveParams,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.authorizations.approve(id, params));

/**
 * Decline an issuing authorization
 */
export const decline = (
  id: string,
  params?: Stripe.Issuing.AuthorizationDeclineParams,
): Effect.Effect<Stripe.Issuing.Authorization, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.authorizations.decline(id, params));

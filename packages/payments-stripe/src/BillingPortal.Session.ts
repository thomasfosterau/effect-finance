/**
 * Billing Portal Session resource operations
 *
 * Like {@link "./CheckoutSession"}, typed by a schema **generated** from
 * Stripe's OpenAPI spec at the pinned API version (not by the `stripe`
 * package), with the response decoded at the boundary: a body that does not
 * match fails with `PaymentProviderError`. Response enumerations are lenient
 * (`Enumeration.Other` carries a value Stripe adds later).
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as BillingPortalSession from "@thomasfosterau/effect-payments-stripe/BillingPortal.Session";
 *
 * const portal = BillingPortalSession.create({
 *   customer: "cus_123",
 *   return_url: "https://example.com/account",
 * }).pipe(Effect.map((session) => session.url));
 * ```
 */

import type { Effect } from "effect";
import * as Generated from "./internal/generated/schemas.js";
import { stripeRequestDecoded } from "./internal/decode.js";
import type { StripeError } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/** The Billing Portal Session object, as a `Schema` (the decoder for the response). */
export const Session = Generated.Billing_portal_session;
/** The Billing Portal Session object. */
export type Session = Generated.Billing_portal_session;

/** The parameters of {@link create}. */
export type SessionCreateParams = Generated.PostBillingPortalSessionsRequestFormUrlEncoded;

/**
 * Create a billing portal session
 */
export const create = (
  params: SessionCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Session, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "billing portal session",
    Session,
    "POST",
    "/v1/billing_portal/sessions",
    params,
    options,
  );

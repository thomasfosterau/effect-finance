/**
 * Stripe's `/v1/identity/verification_sessions` API as a raw resource module,
 * the escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a verification session (`POST /v1/identity/verification_sessions`).
 */
export const create = (
  params: Stripe.Identity.VerificationSessionCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/identity/verification_sessions", params, options);

/**
 * Retrieve a verification session
 * (`GET /v1/identity/verification_sessions/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Identity.VerificationSessionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/identity/verification_sessions/${id}`, params, options);

/**
 * Update a verification session
 * (`POST /v1/identity/verification_sessions/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.Identity.VerificationSessionUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/identity/verification_sessions/${id}`, params, options);

/**
 * Cancel a verification session
 * (`POST /v1/identity/verification_sessions/{id}/cancel`).
 *
 * Only sessions in `requires_input` status can be canceled.
 */
export const cancel = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/identity/verification_sessions/${id}/cancel`, undefined, options);

/**
 * Redact a verification session
 * (`POST /v1/identity/verification_sessions/{id}/redact`).
 *
 * Redacts all personal data associated with the verification session,
 * including associated verification reports. This action is irreversible
 * and takes up to four days to complete.
 */
export const redact = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/identity/verification_sessions/${id}/redact`, undefined, options);

/**
 * List verification sessions (`GET /v1/identity/verification_sessions`).
 */
export const list = (
  params?: Stripe.Identity.VerificationSessionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Identity.VerificationSession>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/identity/verification_sessions", params, options);

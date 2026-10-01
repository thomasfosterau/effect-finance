/**
 * Identity VerificationSession resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as IdentityVerificationSession from "@thomasfosterau/effect-payments-stripe/Identity.VerificationSession";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createSession = (type: "document" | "id_number") =>
 *   IdentityVerificationSession.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const session = yield* createSession("document");
 *   return session;
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
  params: Stripe.Identity.VerificationSessionCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/identity/verification_sessions", params, options);

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
  params?: Stripe.Identity.VerificationSessionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/identity/verification_sessions/${id}`, params, options);

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
  params?: Stripe.Identity.VerificationSessionUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/identity/verification_sessions/${id}`, params, options);

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
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/identity/verification_sessions/${id}/cancel`, undefined, options);

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
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/identity/verification_sessions/${id}/redact`, undefined, options);

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
  params?: Stripe.Identity.VerificationSessionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Identity.VerificationSession>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/identity/verification_sessions", params, options);

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

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

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
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationSessions.create(params));

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
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationSessions.retrieve(id, params));

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
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationSessions.update(id, params));

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
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationSessions.cancel(id));

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
): Effect.Effect<Stripe.Identity.VerificationSession, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationSessions.redact(id));

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
): Effect.Effect<Stripe.ApiList<Stripe.Identity.VerificationSession>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.identity.verificationSessions.list(params));

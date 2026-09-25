/**
 * Issuing Dispute resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingDispute from "@thomasfosterau/effect-payments-stripe/Issuing.Dispute";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createDispute = (transactionId: string) =>
 *   IssuingDispute.create({
 *     transaction: transactionId,
 *     evidence: {
 *       reason: "fraudulent",
 *       fraudulent: {
 *         explanation: "I did not authorize this transaction.",
 *       },
 *     },
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const dispute = yield* createDispute("ipi_xxx");
 *   return dispute;
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
 * Create an issuing dispute
 */
export const create = (
  params: Stripe.Issuing.DisputeCreateParams,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.disputes.create(params));

/**
 * Retrieve an issuing dispute
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.DisputeRetrieveParams,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.disputes.retrieve(id, params));

/**
 * Update an issuing dispute
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.DisputeUpdateParams,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.disputes.update(id, params));

/**
 * List issuing disputes
 */
export const list = (
  params?: Stripe.Issuing.DisputeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Dispute>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.disputes.list(params));

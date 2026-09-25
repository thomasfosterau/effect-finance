/**
 * Dispute resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Dispute from "@thomasfosterau/effect-payments-stripe/Dispute";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const updateDispute = (id: string, evidence: object) =>
 *   Dispute.update(id, { evidence });
 *
 * const program = Effect.gen(function* () {
 *   const dispute = yield* updateDispute("dp_123", { customer_name: "John" });
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
 * Retrieve a dispute
 */
export const retrieve = (
  id: string,
  params?: Stripe.DisputeRetrieveParams,
): Effect.Effect<Stripe.Dispute, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.disputes.retrieve(id, params));

/**
 * Update a dispute
 */
export const update = (
  id: string,
  params?: Stripe.DisputeUpdateParams,
): Effect.Effect<Stripe.Dispute, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.disputes.update(id, params));

/**
 * List disputes
 */
export const list = (
  params?: Stripe.DisputeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Dispute>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.disputes.list(params));

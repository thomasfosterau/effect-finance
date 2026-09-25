/**
 * Refund resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Refund from "@thomasfosterau/effect-payments-stripe/Refund";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createRefund = (chargeId: string) =>
 *   Refund.create({ charge: chargeId });
 *
 * const program = Effect.gen(function* () {
 *   const refund = yield* createRefund("ch_123");
 *   return refund;
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
 * Create a refund
 */
export const create = (
  params: Stripe.RefundCreateParams,
): Effect.Effect<Stripe.Refund, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.refunds.create(params));

/**
 * Retrieve a refund
 */
export const retrieve = (
  id: string,
  params?: Stripe.RefundRetrieveParams,
): Effect.Effect<Stripe.Refund, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.refunds.retrieve(id, params));

/**
 * Update a refund
 */
export const update = (
  id: string,
  params?: Stripe.RefundUpdateParams,
): Effect.Effect<Stripe.Refund, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.refunds.update(id, params));

/**
 * List refunds
 */
export const list = (
  params?: Stripe.RefundListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Refund>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.refunds.list(params));

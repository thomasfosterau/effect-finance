/**
 * Payout resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Payout from "@thomasfosterau/effect-payments-stripe/Payout";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createPayout = (amount: number, currency: string) =>
 *   Payout.create({ amount, currency });
 *
 * const program = Effect.gen(function* () {
 *   const payout = yield* createPayout(10000, "usd");
 *   return payout;
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
 * Create a payout
 */
export const create = (
  params: Stripe.PayoutCreateParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.payouts.create(params));

/**
 * Retrieve a payout
 */
export const retrieve = (
  id: string,
  params?: Stripe.PayoutRetrieveParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.payouts.retrieve(id, params));

/**
 * Update a payout
 */
export const update = (
  id: string,
  params?: Stripe.PayoutUpdateParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.payouts.update(id, params));

/**
 * Cancel a payout
 */
export const cancel = (
  id: string,
  params?: Stripe.PayoutCancelParams,
): Effect.Effect<Stripe.Payout, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.payouts.cancel(id, params));

/**
 * List payouts
 */
export const list = (
  params?: Stripe.PayoutListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Payout>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.payouts.list(params));

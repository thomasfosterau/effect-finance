/**
 * Topup resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Topup from "@thomasfosterau/effect-payments-stripe/Topup";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createTopup = (amount: number) =>
 *   Topup.create({
 *     amount,
 *     currency: "usd",
 *     description: "Top-up for account",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const topup = yield* createTopup(1000);
 *   return topup;
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
 * Create a topup
 */
export const create = (
  params: Stripe.TopupCreateParams,
): Effect.Effect<Stripe.Topup, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.topups.create(params));

/**
 * Retrieve a topup
 */
export const retrieve = (
  id: string,
  params?: Stripe.TopupRetrieveParams,
): Effect.Effect<Stripe.Topup, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.topups.retrieve(id, params));

/**
 * Update a topup
 */
export const update = (
  id: string,
  params?: Stripe.TopupUpdateParams,
): Effect.Effect<Stripe.Topup, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.topups.update(id, params));

/**
 * List topups
 */
export const list = (
  params?: Stripe.TopupListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Topup>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.topups.list(params));

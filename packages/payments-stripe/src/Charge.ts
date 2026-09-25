/**
 * Charge resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Charge from "@thomasfosterau/effect-payments-stripe/Charge";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createCharge = (amount: number, currency: string, source: string) =>
 *   Charge.create({ amount, currency, source });
 *
 * const program = Effect.gen(function* () {
 *   const charge = yield* createCharge(2000, "usd", "tok_visa");
 *   return charge;
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
 * Create a charge
 */
export const create = (
  params: Stripe.ChargeCreateParams,
): Effect.Effect<Stripe.Charge, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.charges.create(params));

/**
 * Retrieve a charge
 */
export const retrieve = (
  id: string,
  params?: Stripe.ChargeRetrieveParams,
): Effect.Effect<Stripe.Charge, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.charges.retrieve(id, params));

/**
 * Update a charge
 */
export const update = (
  id: string,
  params?: Stripe.ChargeUpdateParams,
): Effect.Effect<Stripe.Charge, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.charges.update(id, params));

/**
 * List charges
 */
export const list = (
  params?: Stripe.ChargeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Charge>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.charges.list(params));

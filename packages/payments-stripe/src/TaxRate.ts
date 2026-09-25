/**
 * TaxRate resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TaxRate from "@thomasfosterau/effect-payments-stripe/TaxRate";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createTaxRate = (percentage: number, displayName: string) =>
 *   TaxRate.create({ percentage, display_name: displayName, inclusive: false });
 *
 * const program = Effect.gen(function* () {
 *   const taxRate = yield* createTaxRate(10, "VAT");
 *   return taxRate;
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
 * Create a tax rate
 */
export const create = (
  params: Stripe.TaxRateCreateParams,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.taxRates.create(params));

/**
 * Retrieve a tax rate
 */
export const retrieve = (
  id: string,
  params?: Stripe.TaxRateRetrieveParams,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.taxRates.retrieve(id, params));

/**
 * Update a tax rate
 */
export const update = (
  id: string,
  params?: Stripe.TaxRateUpdateParams,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.taxRates.update(id, params));

/**
 * List tax rates
 */
export const list = (
  params?: Stripe.TaxRateListParams,
): Effect.Effect<Stripe.ApiList<Stripe.TaxRate>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.taxRates.list(params));

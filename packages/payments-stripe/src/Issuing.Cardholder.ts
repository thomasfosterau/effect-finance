/**
 * Issuing Cardholder resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingCardholder from "@thomasfosterau/effect-payments-stripe/Issuing.Cardholder";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createCardholder = () =>
 *   IssuingCardholder.create({
 *     name: "John Doe",
 *     email: "john.doe@example.com",
 *     phone_number: "+18888675309",
 *     billing: {
 *       address: {
 *         line1: "123 Main Street",
 *         city: "San Francisco",
 *         state: "CA",
 *         postal_code: "94111",
 *         country: "US",
 *       },
 *     },
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const cardholder = yield* createCardholder();
 *   return cardholder;
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
 * Create an issuing cardholder
 */
export const create = (
  params: Stripe.Issuing.CardholderCreateParams,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cardholders.create(params));

/**
 * Retrieve an issuing cardholder
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardholderRetrieveParams,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cardholders.retrieve(id, params));

/**
 * Update an issuing cardholder
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardholderUpdateParams,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cardholders.update(id, params));

/**
 * List issuing cardholders
 */
export const list = (
  params?: Stripe.Issuing.CardholderListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Cardholder>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.cardholders.list(params));

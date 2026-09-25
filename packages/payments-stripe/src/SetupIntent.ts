/**
 * SetupIntent resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as SetupIntent from "@thomasfosterau/effect-payments-stripe/SetupIntent";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createSetupIntent = () =>
 *   SetupIntent.create({ payment_method_types: ["card"] });
 *
 * const program = Effect.gen(function* () {
 *   const setupIntent = yield* createSetupIntent();
 *   return setupIntent;
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
 * Create a setup intent
 */
export const create = (
  params?: Stripe.SetupIntentCreateParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.setupIntents.create(params));

/**
 * Retrieve a setup intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.SetupIntentRetrieveParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.setupIntents.retrieve(id, params));

/**
 * Update a setup intent
 */
export const update = (
  id: string,
  params?: Stripe.SetupIntentUpdateParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.setupIntents.update(id, params));

/**
 * Confirm a setup intent
 */
export const confirm = (
  id: string,
  params?: Stripe.SetupIntentConfirmParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.setupIntents.confirm(id, params));

/**
 * Cancel a setup intent
 */
export const cancel = (
  id: string,
  params?: Stripe.SetupIntentCancelParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.setupIntents.cancel(id, params));

/**
 * List setup intents
 */
export const list = (
  params?: Stripe.SetupIntentListParams,
): Effect.Effect<Stripe.ApiList<Stripe.SetupIntent>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.setupIntents.list(params));

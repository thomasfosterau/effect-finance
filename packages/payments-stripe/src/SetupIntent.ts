/**
 * SetupIntent resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as SetupIntent from "@thomasfosterau/effect-payments-stripe/SetupIntent";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createSetupIntent = () =>
 *   SetupIntent.create({ payment_method_types: ["card"] });
 *
 * const program = Effect.gen(function* () {
 *   const setupIntent = yield* createSetupIntent();
 *   return setupIntent;
 * });
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create a setup intent
 */
export const create = (
  params?: Stripe.SetupIntentCreateParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/setup_intents", params);

/**
 * Retrieve a setup intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.SetupIntentRetrieveParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/setup_intents/${id}`, params);

/**
 * Update a setup intent
 */
export const update = (
  id: string,
  params?: Stripe.SetupIntentUpdateParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}`, params);

/**
 * Confirm a setup intent
 */
export const confirm = (
  id: string,
  params?: Stripe.SetupIntentConfirmParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}/confirm`, params);

/**
 * Cancel a setup intent
 */
export const cancel = (
  id: string,
  params?: Stripe.SetupIntentCancelParams,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}/cancel`, params);

/**
 * List setup intents
 */
export const list = (
  params?: Stripe.SetupIntentListParams,
): Effect.Effect<Stripe.ApiList<Stripe.SetupIntent>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/setup_intents", params);

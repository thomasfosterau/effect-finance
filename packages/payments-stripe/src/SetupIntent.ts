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
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a setup intent
 */
export const create = (
  params?: Stripe.SetupIntentCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/setup_intents", params, options);

/**
 * Retrieve a setup intent
 */
export const retrieve = (
  id: string,
  params?: Stripe.SetupIntentRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/setup_intents/${id}`, params, options);

/**
 * Update a setup intent
 */
export const update = (
  id: string,
  params?: Stripe.SetupIntentUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}`, params, options);

/**
 * Confirm a setup intent
 */
export const confirm = (
  id: string,
  params?: Stripe.SetupIntentConfirmParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}/confirm`, params, options);

/**
 * Cancel a setup intent
 */
export const cancel = (
  id: string,
  params?: Stripe.SetupIntentCancelParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.SetupIntent, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/setup_intents/${id}/cancel`, params, options);

/**
 * List setup intents
 */
export const list = (
  params?: Stripe.SetupIntentListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.SetupIntent>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/setup_intents", params, options);

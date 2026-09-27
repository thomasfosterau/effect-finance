/**
 * Issuing Cardholder resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as IssuingCardholder from "@thomasfosterau/effect-payments-stripe/Issuing.Cardholder";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create an issuing cardholder
 */
export const create = (
  params: Stripe.Issuing.CardholderCreateParams,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/issuing/cardholders", params);

/**
 * Retrieve an issuing cardholder
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.CardholderRetrieveParams,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/cardholders/${id}`, params);

/**
 * Update an issuing cardholder
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.CardholderUpdateParams,
): Effect.Effect<Stripe.Issuing.Cardholder, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/cardholders/${id}`, params);

/**
 * List issuing cardholders
 */
export const list = (
  params?: Stripe.Issuing.CardholderListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Cardholder>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/cardholders", params);

/**
 * Terminal Location resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as TerminalLocation from "@thomasfosterau/effect-payments-stripe/Terminal.Location";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createLocation = () =>
 *   TerminalLocation.create({
 *     display_name: "HQ",
 *     address: {
 *       line1: "1272 Valencia Street",
 *       city: "San Francisco",
 *       state: "CA",
 *       country: "US",
 *       postal_code: "94110"
 *     }
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const location = yield* createLocation();
 *   return location;
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
 * Create a terminal location
 */
export const create = (
  params: Stripe.Terminal.LocationCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.Location, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/terminal/locations", params, options);

/**
 * Retrieve a terminal location. Stripe answers a deleted one with its
 * `{ deleted: true }` stub, so the result is the SDK's `Location | DeletedLocation`.
 */
export const retrieve = (
  id: string,
  params?: Stripe.Terminal.LocationRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<
  Stripe.Terminal.Location | Stripe.Terminal.DeletedLocation,
  StripeError,
  StripeHttp
> => stripeRequest("GET", path`/v1/terminal/locations/${id}`, params, options);

/**
 * Update a terminal location. Stripe answers a deleted one with its
 * `{ deleted: true }` stub, so the result is the SDK's `Location | DeletedLocation`.
 */
export const update = (
  id: string,
  params?: Stripe.Terminal.LocationUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<
  Stripe.Terminal.Location | Stripe.Terminal.DeletedLocation,
  StripeError,
  StripeHttp
> => stripeRequest("POST", path`/v1/terminal/locations/${id}`, params, options);

/**
 * Delete a terminal location
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.DeletedLocation, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/terminal/locations/${id}`, undefined, options);

/**
 * List terminal locations
 */
export const list = (
  params?: Stripe.Terminal.LocationListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Terminal.Location>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/terminal/locations", params, options);

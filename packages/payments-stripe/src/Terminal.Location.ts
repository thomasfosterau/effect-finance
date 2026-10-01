/**
 * Stripe's `/v1/terminal/locations` API as a raw resource module, the escape
 * hatch for what the neutral capabilities do not cover. Results are typed with
 * the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a terminal location (`POST /v1/terminal/locations`).
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
 * Delete a terminal location (`DELETE /v1/terminal/locations/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Terminal.DeletedLocation, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/terminal/locations/${id}`, undefined, options);

/**
 * List terminal locations (`GET /v1/terminal/locations`).
 */
export const list = (
  params?: Stripe.Terminal.LocationListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Terminal.Location>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/terminal/locations", params, options);

/**
 * Stripe's `/v1/customers` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded; prefer the neutral
 * `Customers` capability where it covers the call.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Customer from "@thomasfosterau/effect-payments-stripe/Customer";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const layer = StripeHttp.layer({ apiKey: Redacted.make("sk_test_...") }).pipe(
 *   Layer.provide(FetchHttpClient.layer),
 * );
 *
 * const customers = await Effect.runPromise(
 *   Customer.list({ limit: 10 }).pipe(Effect.provide(layer)),
 * );
 * ```
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a customer (`POST /v1/customers`).
 */
export const create = (
  params?: Stripe.CustomerCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Customer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/customers", params, options);

/**
 * Retrieve a customer (`GET /v1/customers/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.CustomerRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Customer | Stripe.DeletedCustomer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/customers/${id}`, params, options);

/**
 * Update a customer (`POST /v1/customers/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.CustomerUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Customer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/customers/${id}`, params, options);

/**
 * Delete a customer (`DELETE /v1/customers/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedCustomer, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/customers/${id}`, undefined, options);

/**
 * List customers (`GET /v1/customers`).
 */
export const list = (
  params?: Stripe.CustomerListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Customer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/customers", params, options);

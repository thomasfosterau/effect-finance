/**
 * Customer resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Customer from "@thomasfosterau/effect-payments-stripe/Customer";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createCustomer = (email: string) =>
 *   Customer.create({ email, name: "John Doe" });
 *
 * const program = Effect.gen(function* () {
 *   const customer = yield* createCustomer("customer@example.com");
 *   return customer;
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
 * Create a customer
 */
export const create = (
  params?: Stripe.CustomerCreateParams,
): Effect.Effect<Stripe.Customer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/customers", params);

/**
 * Retrieve a customer
 */
export const retrieve = (
  id: string,
  params?: Stripe.CustomerRetrieveParams,
): Effect.Effect<Stripe.Customer | Stripe.DeletedCustomer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/customers/${id}`, params);

/**
 * Update a customer
 */
export const update = (
  id: string,
  params?: Stripe.CustomerUpdateParams,
): Effect.Effect<Stripe.Customer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/customers/${id}`, params);

/**
 * Delete a customer
 */
export const del = (id: string): Effect.Effect<Stripe.DeletedCustomer, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/customers/${id}`);

/**
 * List customers
 */
export const list = (
  params?: Stripe.CustomerListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Customer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/customers", params);

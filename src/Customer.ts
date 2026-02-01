/**
 * Customer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Customer from "@thomasfosterau/effect-stripe/Customer";
 * import * as Stripe from "@thomasfosterau/effect-stripe/Stripe";
 *
 * const createCustomer = (email: string) =>
 *   Customer.create({ email, name: "John Doe" });
 *
 * const program = Effect.gen(function* () {
 *   const customer = yield* createCustomer("customer@example.com");
 *   return customer;
 * });
 *
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import { Effect } from "effect";
import type Stripe from "stripe";
import { wrapStripeCall, type StripeError } from "./internal.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create a customer
 */
export const create = (
  params?: Stripe.CustomerCreateParams
): Effect.Effect<Stripe.Customer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.customers.create(params));

/**
 * Retrieve a customer
 */
export const retrieve = (
  id: string,
  params?: Stripe.CustomerRetrieveParams
): Effect.Effect<
  Stripe.Customer | Stripe.DeletedCustomer,
  StripeError,
  StripeService
> => wrapStripeCall((stripe) => stripe.customers.retrieve(id, params));

/**
 * Update a customer
 */
export const update = (
  id: string,
  params?: Stripe.CustomerUpdateParams
): Effect.Effect<Stripe.Customer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.customers.update(id, params));

/**
 * Delete a customer
 */
export const del = (
  id: string
): Effect.Effect<Stripe.DeletedCustomer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.customers.del(id));

/**
 * List customers
 */
export const list = (
  params?: Stripe.CustomerListParams
): Effect.Effect<Stripe.ApiList<Stripe.Customer>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.customers.list(params));

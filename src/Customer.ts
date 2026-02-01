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
import { type StripeError } from "./internal.js";
import type { StripeService } from "./Stripe.js";
import {
  CreateCustomerRequest,
  CreateCustomerResolver,
  RetrieveCustomerRequest,
  RetrieveCustomerResolver,
  UpdateCustomerRequest,
  UpdateCustomerResolver,
  DeleteCustomerRequest,
  DeleteCustomerResolver,
  ListCustomersRequest,
  ListCustomersResolver,
} from "./CustomerRequests.js";

/**
 * Create a customer
 */
export const create = (
  params?: Stripe.CustomerCreateParams
): Effect.Effect<Stripe.Customer, StripeError, StripeService> =>
  Effect.request(
    CreateCustomerRequest({ params }),
    CreateCustomerResolver
  ).pipe(Effect.withRequestCaching(true));

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
> =>
  Effect.request(
    RetrieveCustomerRequest({ id, params }),
    RetrieveCustomerResolver
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a customer
 */
export const update = (
  id: string,
  params?: Stripe.CustomerUpdateParams
): Effect.Effect<Stripe.Customer, StripeError, StripeService> =>
  Effect.request(
    UpdateCustomerRequest({ id, params }),
    UpdateCustomerResolver
  ).pipe(Effect.withRequestCaching(true));

/**
 * Delete a customer
 */
export const del = (
  id: string
): Effect.Effect<Stripe.DeletedCustomer, StripeError, StripeService> =>
  Effect.request(
    DeleteCustomerRequest({ id }),
    DeleteCustomerResolver
  ).pipe(Effect.withRequestCaching(true));

/**
 * List customers
 */
export const list = (
  params?: Stripe.CustomerListParams
): Effect.Effect<Stripe.ApiList<Stripe.Customer>, StripeError, StripeService> =>
  Effect.request(
    ListCustomersRequest({ params }),
    ListCustomersResolver
  ).pipe(Effect.withRequestCaching(true));

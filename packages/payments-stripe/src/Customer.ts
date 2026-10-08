/**
 * Stripe's `/v1/customers` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover; prefer the neutral `Customers`
 * capability where it covers the call.
 *
 * The types here are **generated** from Stripe's OpenAPI spec at the pinned
 * API version (`scripts/generate-stripe-schemas.ts`), not taken from the
 * `stripe` package, and every response is **decoded** with the generated
 * {@link Customer} schema: a body that does not match fails with
 * `PaymentProviderError` instead of being cast. An expandable field
 * (`default_source`, `test_clock`, `invoice_settings.default_payment_method`)
 * decodes as its id or, when expanded, an open JSON object. Every enumeration
 * in a response (`tax_exempt`, `tax.automatic_tax`, …) is lenient
 * (`Enumeration` from the core): a value Stripe adds later decodes as `Other`
 * carrying the raw string. Request enumerations stay closed.
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
 * // Calls Stripe when invoked, so it needs a real key.
 * const listCustomers = () =>
 *   Effect.runPromise(Customer.list({ limit: 10 }).pipe(Effect.provide(layer)));
 * ```
 *
 * @module
 */

import type { Effect } from "effect";
import * as Generated from "./internal/generated/schemas.js";
import { stripeRequestDecoded } from "./internal/decode.js";
import { path, type StripeError } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/** The Customer object, as a `Schema` (the decoder for create and update). */
export const Customer = Generated.Customer;
/** The Customer object. */
export type Customer = Generated.Customer;

/** A deleted customer (`{ id, object: "customer", deleted: true }`), as a `Schema`. */
export const DeletedCustomer = Generated.Deleted_customer;
/** A deleted customer: what {@link del} answers, and {@link retrieve} for a deleted id. */
export type DeletedCustomer = Generated.Deleted_customer;

/** A page of customers, as a `Schema`. */
export const CustomerList = Generated.GetCustomers200;
/** A page of customers. */
export type CustomerList = Generated.GetCustomers200;

/** The parameters of {@link create}. */
export type CustomerCreateParams = Generated.PostCustomersRequestFormUrlEncoded;
/** The parameters of {@link retrieve}. */
export type CustomerRetrieveParams = Generated.GetCustomersCustomerParams;
/** The parameters of {@link update}. */
export type CustomerUpdateParams = Generated.PostCustomersCustomerRequestFormUrlEncoded;
/**
 * The parameters of {@link list}. `created` takes a timestamp or a
 * `{ gt, gte, lt, lte }` range.
 */
export type CustomerListParams = Generated.GetCustomersParams;

/**
 * Create a customer (`POST /v1/customers`).
 */
export const create = (
  params?: CustomerCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Customer, StripeError, StripeHttp> =>
  stripeRequestDecoded("customer", Customer, "POST", "/v1/customers", params, options);

/**
 * Retrieve a customer (`GET /v1/customers/{id}`). A deleted customer is
 * answered as a {@link DeletedCustomer}.
 */
export const retrieve = (
  id: string,
  params?: CustomerRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Customer | DeletedCustomer, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "customer",
    Generated.GetCustomersCustomer200,
    "GET",
    path`/v1/customers/${id}`,
    params,
    options,
  );

/**
 * Update a customer (`POST /v1/customers/{id}`).
 */
export const update = (
  id: string,
  params?: CustomerUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Customer, StripeError, StripeHttp> =>
  stripeRequestDecoded("customer", Customer, "POST", path`/v1/customers/${id}`, params, options);

/**
 * Delete a customer (`DELETE /v1/customers/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<DeletedCustomer, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "deleted customer",
    DeletedCustomer,
    "DELETE",
    path`/v1/customers/${id}`,
    undefined,
    options,
  );

/**
 * List customers (`GET /v1/customers`).
 */
export const list = (
  params?: CustomerListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<CustomerList, StripeError, StripeHttp> =>
  stripeRequestDecoded("customer list", CustomerList, "GET", "/v1/customers", params, options);

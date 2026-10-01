/**
 * Invoice resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Invoice from "@thomasfosterau/effect-payments-stripe/Invoice";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createInvoice = (customerId: string) =>
 *   Invoice.create({ customer: customerId });
 *
 * const program = Effect.gen(function* () {
 *   const invoice = yield* createInvoice("cus_123");
 *   return invoice;
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
 * Create an invoice
 */
export const create = (
  params: Stripe.InvoiceCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/invoices", params, options);

/**
 * Retrieve an invoice
 */
export const retrieve = (
  id: string,
  params?: Stripe.InvoiceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/invoices/${id}`, params, options);

/**
 * Update an invoice
 */
export const update = (
  id: string,
  params?: Stripe.InvoiceUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/invoices/${id}`, params, options);

/**
 * Delete an invoice
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedInvoice, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/invoices/${id}`, undefined, options);

/**
 * List invoices
 */
export const list = (
  params?: Stripe.InvoiceListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Invoice>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/invoices", params, options);

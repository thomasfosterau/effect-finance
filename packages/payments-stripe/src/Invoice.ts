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
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create an invoice
 */
export const create = (
  params: Stripe.InvoiceCreateParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/invoices", params);

/**
 * Retrieve an invoice
 */
export const retrieve = (
  id: string,
  params?: Stripe.InvoiceRetrieveParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/invoices/${id}`, params);

/**
 * Update an invoice
 */
export const update = (
  id: string,
  params?: Stripe.InvoiceUpdateParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/invoices/${id}`, params);

/**
 * Delete an invoice
 */
export const del = (id: string): Effect.Effect<Stripe.DeletedInvoice, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/invoices/${id}`);

/**
 * List invoices
 */
export const list = (
  params?: Stripe.InvoiceListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Invoice>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/invoices", params);

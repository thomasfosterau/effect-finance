/**
 * Stripe's `/v1/invoices` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create an invoice (`POST /v1/invoices`).
 */
export const create = (
  params: Stripe.InvoiceCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/invoices", params, options);

/**
 * Retrieve an invoice (`GET /v1/invoices/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.InvoiceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/invoices/${id}`, params, options);

/**
 * Update an invoice (`POST /v1/invoices/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.InvoiceUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Invoice, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/invoices/${id}`, params, options);

/**
 * Delete an invoice (`DELETE /v1/invoices/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedInvoice, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/invoices/${id}`, undefined, options);

/**
 * List invoices (`GET /v1/invoices`).
 */
export const list = (
  params?: Stripe.InvoiceListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Invoice>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/invoices", params, options);

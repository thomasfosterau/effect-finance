/**
 * Stripe's `/v1/invoices` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover.
 *
 * Like {@link "./Customer"}, typed by a schema **generated** from Stripe's
 * OpenAPI spec at the pinned API version (not by the `stripe` package), with
 * every response decoded at the boundary: a body that does not match fails
 * with `PaymentProviderError`. An expandable field (`customer`,
 * `default_payment_method`, `test_clock`, …) decodes as its id or, when
 * expanded, an open JSON object; so does each resource a
 * `last_finalization_error` carries (`payment_intent`, `payment_method`, …).
 * Response enumerations (`status`, `billing_reason`, `collection_method`, …)
 * are lenient: a value Stripe adds later decodes as `Enumeration.Other`.
 * Request enumerations stay closed.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import * as Generated from "./internal/generated/schemas.js";
import { stripeRequestDecoded } from "./internal/decode.js";
import { path, type StripeError } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/** The Invoice object, as a `Schema` (the decoder for create, retrieve and update). */
export const Invoice = Generated.Invoice;
/** The Invoice object. */
export type Invoice = Generated.Invoice;

/** A deleted draft invoice (`{ id, object: "invoice", deleted: true }`), as a `Schema`. */
export const DeletedInvoice = Generated.Deleted_invoice;
/** A deleted draft invoice: what {@link del} answers. */
export type DeletedInvoice = Generated.Deleted_invoice;

/** A page of invoices, as a `Schema`. */
export const InvoiceList = Generated.GetInvoices200;
/** A page of invoices. */
export type InvoiceList = Generated.GetInvoices200;

/** The parameters of {@link create}. */
export type InvoiceCreateParams = Generated.PostInvoicesRequestFormUrlEncoded;
/** The parameters of {@link retrieve}. */
export type InvoiceRetrieveParams = Generated.GetInvoicesInvoiceParams;
/** The parameters of {@link update}. */
export type InvoiceUpdateParams = Generated.PostInvoicesInvoiceRequestFormUrlEncoded;
/**
 * The parameters of {@link list}. `created` and `due_date` take a timestamp
 * or a `{ gt, gte, lt, lte }` range.
 */
export type InvoiceListParams = Generated.GetInvoicesParams;

/**
 * Create an invoice (`POST /v1/invoices`).
 */
export const create = (
  params: InvoiceCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Invoice, StripeError, StripeHttp> =>
  stripeRequestDecoded("invoice", Invoice, "POST", "/v1/invoices", params, options);

/**
 * Retrieve an invoice (`GET /v1/invoices/{id}`).
 */
export const retrieve = (
  id: string,
  params?: InvoiceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Invoice, StripeError, StripeHttp> =>
  stripeRequestDecoded("invoice", Invoice, "GET", path`/v1/invoices/${id}`, params, options);

/**
 * Update an invoice (`POST /v1/invoices/{id}`).
 */
export const update = (
  id: string,
  params?: InvoiceUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Invoice, StripeError, StripeHttp> =>
  stripeRequestDecoded("invoice", Invoice, "POST", path`/v1/invoices/${id}`, params, options);

/**
 * Delete a draft invoice (`DELETE /v1/invoices/{id}`).
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<DeletedInvoice, StripeError, StripeHttp> =>
  stripeRequestDecoded(
    "deleted invoice",
    DeletedInvoice,
    "DELETE",
    path`/v1/invoices/${id}`,
    undefined,
    options,
  );

/**
 * List invoices (`GET /v1/invoices`).
 */
export const list = (
  params?: InvoiceListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<InvoiceList, StripeError, StripeHttp> =>
  stripeRequestDecoded("invoice list", InvoiceList, "GET", "/v1/invoices", params, options);

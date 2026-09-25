/**
 * Invoice resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Invoice from "@thomasfosterau/effect-payments-stripe/Invoice";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createInvoice = (customerId: string) =>
 *   Invoice.create({ customer: customerId });
 *
 * const program = Effect.gen(function* () {
 *   const invoice = yield* createInvoice("cus_123");
 *   return invoice;
 * });
 *
 * const layer = Stripe.layer({ apiKey: "sk_test_..." });
 * const result = await Effect.runPromise(program.pipe(Effect.provide(layer)));
 * ```
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { type StripeError, wrapStripeCall } from "./internal/index.js";
import type { StripeService } from "./Stripe.js";

/**
 * Create an invoice
 */
export const create = (
  params: Stripe.InvoiceCreateParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.invoices.create(params));

/**
 * Retrieve an invoice
 */
export const retrieve = (
  id: string,
  params?: Stripe.InvoiceRetrieveParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.invoices.retrieve(id, params));

/**
 * Update an invoice
 */
export const update = (
  id: string,
  params?: Stripe.InvoiceUpdateParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.invoices.update(id, params));

/**
 * Delete an invoice
 */
export const del = (id: string): Effect.Effect<Stripe.DeletedInvoice, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.invoices.del(id));

/**
 * List invoices
 */
export const list = (
  params?: Stripe.InvoiceListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Invoice>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.invoices.list(params));

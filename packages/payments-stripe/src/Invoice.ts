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

import { Effect, Request, RequestResolver } from "effect";
import type Stripe from "stripe";
import { makeStripeResolver, type StripeError } from "./internal/index.js";
import { StripeService } from "./Stripe.js";

/**
 * Request to create an invoice
 */
interface CreateInvoiceRequest extends Request.Request<Stripe.Invoice, StripeError> {
  readonly _tag: "CreateInvoiceRequest";
  readonly params: Stripe.InvoiceCreateParams;
}

const CreateInvoiceRequest = Request.tagged<CreateInvoiceRequest>("CreateInvoiceRequest");

const CreateInvoiceResolver: RequestResolver.RequestResolver<CreateInvoiceRequest, StripeService> =
  makeStripeResolver<CreateInvoiceRequest>((stripe, request) =>
    stripe.invoices.create(request.params),
  );

/**
 * Request to retrieve an invoice
 */
interface RetrieveInvoiceRequest extends Request.Request<Stripe.Invoice, StripeError> {
  readonly _tag: "RetrieveInvoiceRequest";
  readonly id: string;
  readonly params?: Stripe.InvoiceRetrieveParams | undefined;
}

const RetrieveInvoiceRequest = Request.tagged<RetrieveInvoiceRequest>("RetrieveInvoiceRequest");

const RetrieveInvoiceResolver: RequestResolver.RequestResolver<
  RetrieveInvoiceRequest,
  StripeService
> = makeStripeResolver<RetrieveInvoiceRequest>((stripe, request) =>
  stripe.invoices.retrieve(request.id, request.params),
);

/**
 * Request to update an invoice
 */
interface UpdateInvoiceRequest extends Request.Request<Stripe.Invoice, StripeError> {
  readonly _tag: "UpdateInvoiceRequest";
  readonly id: string;
  readonly params?: Stripe.InvoiceUpdateParams | undefined;
}

const UpdateInvoiceRequest = Request.tagged<UpdateInvoiceRequest>("UpdateInvoiceRequest");

const UpdateInvoiceResolver: RequestResolver.RequestResolver<UpdateInvoiceRequest, StripeService> =
  makeStripeResolver<UpdateInvoiceRequest>((stripe, request) =>
    stripe.invoices.update(request.id, request.params),
  );

/**
 * Request to delete an invoice
 */
interface DeleteInvoiceRequest extends Request.Request<Stripe.DeletedInvoice, StripeError> {
  readonly _tag: "DeleteInvoiceRequest";
  readonly id: string;
}

const DeleteInvoiceRequest = Request.tagged<DeleteInvoiceRequest>("DeleteInvoiceRequest");

const DeleteInvoiceResolver: RequestResolver.RequestResolver<DeleteInvoiceRequest, StripeService> =
  makeStripeResolver<DeleteInvoiceRequest>((stripe, request) => stripe.invoices.del(request.id));

/**
 * Request to list invoices
 */
interface ListInvoicesRequest extends Request.Request<Stripe.ApiList<Stripe.Invoice>, StripeError> {
  readonly _tag: "ListInvoicesRequest";
  readonly params?: Stripe.InvoiceListParams | undefined;
}

const ListInvoicesRequest = Request.tagged<ListInvoicesRequest>("ListInvoicesRequest");

const ListInvoicesResolver: RequestResolver.RequestResolver<ListInvoicesRequest, StripeService> =
  makeStripeResolver<ListInvoicesRequest>((stripe, request) =>
    stripe.invoices.list(request.params),
  );

/**
 * Create an invoice
 */
export const create = (
  params: Stripe.InvoiceCreateParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeService> =>
  Effect.request(
    CreateInvoiceRequest({ params }),
    RequestResolver.contextFromEffect(CreateInvoiceResolver),
  );

/**
 * Retrieve an invoice
 */
export const retrieve = (
  id: string,
  params?: Stripe.InvoiceRetrieveParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeService> =>
  Effect.request(
    RetrieveInvoiceRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveInvoiceResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update an invoice
 */
export const update = (
  id: string,
  params?: Stripe.InvoiceUpdateParams,
): Effect.Effect<Stripe.Invoice, StripeError, StripeService> =>
  Effect.request(
    UpdateInvoiceRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateInvoiceResolver),
  );

/**
 * Delete an invoice
 */
export const del = (id: string): Effect.Effect<Stripe.DeletedInvoice, StripeError, StripeService> =>
  Effect.request(
    DeleteInvoiceRequest({ id }),
    RequestResolver.contextFromEffect(DeleteInvoiceResolver),
  );

/**
 * List invoices
 */
export const list = (
  params?: Stripe.InvoiceListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Invoice>, StripeError, StripeService> =>
  Effect.request(
    ListInvoicesRequest({ params }),
    RequestResolver.contextFromEffect(ListInvoicesResolver),
  ).pipe(Effect.withRequestCaching(true));

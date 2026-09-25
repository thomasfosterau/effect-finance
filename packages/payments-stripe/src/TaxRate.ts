/**
 * TaxRate resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as TaxRate from "@thomasfosterau/effect-payments-stripe/TaxRate";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createTaxRate = (percentage: number, displayName: string) =>
 *   TaxRate.create({ percentage, display_name: displayName, inclusive: false });
 *
 * const program = Effect.gen(function* () {
 *   const taxRate = yield* createTaxRate(10, "VAT");
 *   return taxRate;
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
 * Request to create a tax rate
 */
interface CreateTaxRateRequest extends Request.Request<Stripe.TaxRate, StripeError> {
  readonly _tag: "CreateTaxRateRequest";
  readonly params: Stripe.TaxRateCreateParams;
}

const CreateTaxRateRequest = Request.tagged<CreateTaxRateRequest>("CreateTaxRateRequest");

const CreateTaxRateResolver: RequestResolver.RequestResolver<CreateTaxRateRequest, StripeService> =
  makeStripeResolver<CreateTaxRateRequest>((stripe, request) =>
    stripe.taxRates.create(request.params),
  );

/**
 * Request to retrieve a tax rate
 */
interface RetrieveTaxRateRequest extends Request.Request<Stripe.TaxRate, StripeError> {
  readonly _tag: "RetrieveTaxRateRequest";
  readonly id: string;
  readonly params?: Stripe.TaxRateRetrieveParams | undefined;
}

const RetrieveTaxRateRequest = Request.tagged<RetrieveTaxRateRequest>("RetrieveTaxRateRequest");

const RetrieveTaxRateResolver: RequestResolver.RequestResolver<
  RetrieveTaxRateRequest,
  StripeService
> = makeStripeResolver<RetrieveTaxRateRequest>((stripe, request) =>
  stripe.taxRates.retrieve(request.id, request.params),
);

/**
 * Request to update a tax rate
 */
interface UpdateTaxRateRequest extends Request.Request<Stripe.TaxRate, StripeError> {
  readonly _tag: "UpdateTaxRateRequest";
  readonly id: string;
  readonly params?: Stripe.TaxRateUpdateParams | undefined;
}

const UpdateTaxRateRequest = Request.tagged<UpdateTaxRateRequest>("UpdateTaxRateRequest");

const UpdateTaxRateResolver: RequestResolver.RequestResolver<UpdateTaxRateRequest, StripeService> =
  makeStripeResolver<UpdateTaxRateRequest>((stripe, request) =>
    stripe.taxRates.update(request.id, request.params),
  );

/**
 * Request to list tax rates
 */
interface ListTaxRatesRequest extends Request.Request<Stripe.ApiList<Stripe.TaxRate>, StripeError> {
  readonly _tag: "ListTaxRatesRequest";
  readonly params?: Stripe.TaxRateListParams | undefined;
}

const ListTaxRatesRequest = Request.tagged<ListTaxRatesRequest>("ListTaxRatesRequest");

const ListTaxRatesResolver: RequestResolver.RequestResolver<ListTaxRatesRequest, StripeService> =
  makeStripeResolver<ListTaxRatesRequest>((stripe, request) =>
    stripe.taxRates.list(request.params),
  );

/**
 * Create a tax rate
 */
export const create = (
  params: Stripe.TaxRateCreateParams,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeService> =>
  Effect.request(
    CreateTaxRateRequest({ params }),
    RequestResolver.contextFromEffect(CreateTaxRateResolver),
  );

/**
 * Retrieve a tax rate
 */
export const retrieve = (
  id: string,
  params?: Stripe.TaxRateRetrieveParams,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeService> =>
  Effect.request(
    RetrieveTaxRateRequest({ id, params }),
    RequestResolver.contextFromEffect(RetrieveTaxRateResolver),
  ).pipe(Effect.withRequestCaching(true));

/**
 * Update a tax rate
 */
export const update = (
  id: string,
  params?: Stripe.TaxRateUpdateParams,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeService> =>
  Effect.request(
    UpdateTaxRateRequest({ id, params }),
    RequestResolver.contextFromEffect(UpdateTaxRateResolver),
  );

/**
 * List tax rates
 */
export const list = (
  params?: Stripe.TaxRateListParams,
): Effect.Effect<Stripe.ApiList<Stripe.TaxRate>, StripeError, StripeService> =>
  Effect.request(
    ListTaxRatesRequest({ params }),
    RequestResolver.contextFromEffect(ListTaxRatesResolver),
  ).pipe(Effect.withRequestCaching(true));

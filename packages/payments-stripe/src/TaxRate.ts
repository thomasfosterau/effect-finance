/**
 * TaxRate resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as TaxRate from "@thomasfosterau/effect-payments-stripe/TaxRate";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createTaxRate = (percentage: number, displayName: string) =>
 *   TaxRate.create({ percentage, display_name: displayName, inclusive: false });
 *
 * const program = Effect.gen(function* () {
 *   const taxRate = yield* createTaxRate(10, "VAT");
 *   return taxRate;
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
 * Create a tax rate
 */
export const create = (
  params: Stripe.TaxRateCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/tax_rates", params, options);

/**
 * Retrieve a tax rate
 */
export const retrieve = (
  id: string,
  params?: Stripe.TaxRateRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/tax_rates/${id}`, params, options);

/**
 * Update a tax rate
 */
export const update = (
  id: string,
  params?: Stripe.TaxRateUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/tax_rates/${id}`, params, options);

/**
 * List tax rates
 */
export const list = (
  params?: Stripe.TaxRateListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.TaxRate>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/tax_rates", params, options);

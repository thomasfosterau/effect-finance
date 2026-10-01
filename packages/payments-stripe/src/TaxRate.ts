/**
 * Stripe's `/v1/tax_rates` API as a raw resource module, the escape hatch for
 * what the neutral capabilities do not cover. Results are typed with the
 * `stripe` package's declarations and are not decoded.
 *
 * Operations require `StripeHttp`: provide `StripeHttp.layer` (with
 * `FetchHttpClient.layer`) or the SDK transport's `Stripe.layer`.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a tax rate (`POST /v1/tax_rates`).
 */
export const create = (
  params: Stripe.TaxRateCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/tax_rates", params, options);

/**
 * Retrieve a tax rate (`GET /v1/tax_rates/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.TaxRateRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/tax_rates/${id}`, params, options);

/**
 * Update a tax rate (`POST /v1/tax_rates/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.TaxRateUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.TaxRate, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/tax_rates/${id}`, params, options);

/**
 * List tax rates (`GET /v1/tax_rates`).
 */
export const list = (
  params?: Stripe.TaxRateListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.TaxRate>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/tax_rates", params, options);

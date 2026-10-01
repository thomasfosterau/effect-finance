/**
 * Stripe's `/v1/treasury/financial_accounts` API as a raw resource module, the
 * escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create a financial account (`POST /v1/treasury/financial_accounts`).
 */
export const create = (
  params: Stripe.Treasury.FinancialAccountCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/financial_accounts", params, options);

/**
 * Retrieve a financial account (`GET /v1/treasury/financial_accounts/{id}`).
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/financial_accounts/${id}`, params, options);

/**
 * Update a financial account (`POST /v1/treasury/financial_accounts/{id}`).
 */
export const update = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}`, params, options);

/**
 * List financial accounts (`GET /v1/treasury/financial_accounts`).
 */
export const list = (
  params?: Stripe.Treasury.FinancialAccountListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.FinancialAccount>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/financial_accounts", params, options);

/**
 * Close a financial account
 * (`POST /v1/treasury/financial_accounts/{id}/close`).
 */
export const close = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}/close`, undefined, options);

/**
 * Retrieve features of a financial account
 * (`GET /v1/treasury/financial_accounts/{id}/features`).
 */
export const retrieveFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveFeaturesParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/financial_accounts/${id}/features`, params, options);

/**
 * Update features of a financial account
 * (`POST /v1/treasury/financial_accounts/{id}/features`).
 */
export const updateFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateFeaturesParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}/features`, params, options);

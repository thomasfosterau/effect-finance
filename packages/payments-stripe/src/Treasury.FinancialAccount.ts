/**
 * Treasury.FinancialAccount resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as FinancialAccount from "@thomasfosterau/effect-payments-stripe/Treasury.FinancialAccount";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createAccount = (supportedCurrencies: string[]) =>
 *   FinancialAccount.create({ supported_currencies: supportedCurrencies });
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* createAccount(["usd"]);
 *   return account;
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
 * Create a financial account
 */
export const create = (
  params: Stripe.Treasury.FinancialAccountCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/financial_accounts", params, options);

/**
 * Retrieve a financial account
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/financial_accounts/${id}`, params, options);

/**
 * Update a financial account
 */
export const update = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}`, params, options);

/**
 * List financial accounts
 */
export const list = (
  params?: Stripe.Treasury.FinancialAccountListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.FinancialAccount>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/financial_accounts", params, options);

/**
 * Close a financial account
 */
export const close = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}/close`, undefined, options);

/**
 * Retrieve features of a financial account
 */
export const retrieveFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveFeaturesParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/financial_accounts/${id}/features`, params, options);

/**
 * Update features of a financial account
 */
export const updateFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateFeaturesParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}/features`, params, options);

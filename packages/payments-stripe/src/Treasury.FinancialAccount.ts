/**
 * Treasury.FinancialAccount resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
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
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create a financial account
 */
export const create = (
  params: Stripe.Treasury.FinancialAccountCreateParams,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/treasury/financial_accounts", params);

/**
 * Retrieve a financial account
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveParams,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/financial_accounts/${id}`, params);

/**
 * Update a financial account
 */
export const update = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateParams,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}`, params);

/**
 * List financial accounts
 */
export const list = (
  params?: Stripe.Treasury.FinancialAccountListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.FinancialAccount>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/treasury/financial_accounts", params);

/**
 * Close a financial account
 */
export const close = (
  id: string,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}/close`);

/**
 * Retrieve features of a financial account
 */
export const retrieveFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveFeaturesParams,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/treasury/financial_accounts/${id}/features`, params);

/**
 * Update features of a financial account
 */
export const updateFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateFeaturesParams,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/treasury/financial_accounts/${id}/features`, params);

/**
 * Treasury.FinancialAccount resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as FinancialAccount from "@thomasfosterau/effect-payments-stripe/Treasury.FinancialAccount";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createAccount = (supportedCurrencies: string[]) =>
 *   FinancialAccount.create({ supported_currencies: supportedCurrencies });
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* createAccount(["usd"]);
 *   return account;
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
 * Create a financial account
 */
export const create = (
  params: Stripe.Treasury.FinancialAccountCreateParams,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.financialAccounts.create(params));

/**
 * Retrieve a financial account
 */
export const retrieve = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveParams,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.financialAccounts.retrieve(id, params));

/**
 * Update a financial account
 */
export const update = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateParams,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.financialAccounts.update(id, params));

/**
 * List financial accounts
 */
export const list = (
  params?: Stripe.Treasury.FinancialAccountListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Treasury.FinancialAccount>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.financialAccounts.list(params));

/**
 * Close a financial account
 */
export const close = (
  id: string,
): Effect.Effect<Stripe.Treasury.FinancialAccount, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.financialAccounts.close(id));

/**
 * Retrieve features of a financial account
 */
export const retrieveFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountRetrieveFeaturesParams,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.financialAccounts.retrieveFeatures(id, params));

/**
 * Update features of a financial account
 */
export const updateFeatures = (
  id: string,
  params?: Stripe.Treasury.FinancialAccountUpdateFeaturesParams,
): Effect.Effect<Stripe.Treasury.FinancialAccountFeatures, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.treasury.financialAccounts.updateFeatures(id, params));

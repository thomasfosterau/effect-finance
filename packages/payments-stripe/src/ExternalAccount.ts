/**
 * ExternalAccount resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as ExternalAccount from "@thomasfosterau/effect-payments-stripe/ExternalAccount";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createExternalAccount = (accountId: string) =>
 *   ExternalAccount.create(accountId, {
 *     external_account: "btok_123",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const externalAccount = yield* createExternalAccount("acct_123");
 *   return externalAccount;
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
 * Create an external account
 */
export const create = (
  accountId: string,
  params: Stripe.ExternalAccountCreateParams,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.createExternalAccount(accountId, params));

/**
 * Retrieve an external account
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.ExternalAccountRetrieveParams,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.retrieveExternalAccount(accountId, id, params));

/**
 * Update an external account
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.ExternalAccountUpdateParams,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.updateExternalAccount(accountId, id, params));

/**
 * Delete an external account
 */
export const del = (
  accountId: string,
  id: string,
): Effect.Effect<Stripe.DeletedBankAccount | Stripe.DeletedCard, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.deleteExternalAccount(accountId, id));

/**
 * List external accounts
 */
export const list = (
  accountId: string,
  params?: Stripe.ExternalAccountListParams,
): Effect.Effect<Stripe.ApiList<Stripe.BankAccount | Stripe.Card>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.listExternalAccounts(accountId, params));

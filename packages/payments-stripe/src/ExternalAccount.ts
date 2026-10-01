/**
 * ExternalAccount resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as ExternalAccount from "@thomasfosterau/effect-payments-stripe/ExternalAccount";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create an external account
 */
export const create = (
  accountId: string,
  params: Stripe.AccountCreateExternalAccountParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/external_accounts`, params, options);

/**
 * Retrieve an external account
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.AccountRetrieveExternalAccountParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/external_accounts/${id}`, params, options);

/**
 * Update an external account
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.AccountUpdateExternalAccountParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/external_accounts/${id}`, params, options);

/**
 * Delete an external account
 */
export const del = (
  accountId: string,
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedBankAccount | Stripe.DeletedCard, StripeError, StripeHttp> =>
  stripeRequest(
    "DELETE",
    path`/v1/accounts/${accountId}/external_accounts/${id}`,
    undefined,
    options,
  );

/**
 * List external accounts
 */
export const list = (
  accountId: string,
  params?: Stripe.AccountListExternalAccountsParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.BankAccount | Stripe.Card>, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/external_accounts`, params, options);

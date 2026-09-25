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
import type { StripeHttp } from "./StripeHttp.js";

/**
 * Create an external account
 */
export const create = (
  accountId: string,
  params: Stripe.ExternalAccountCreateParams,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/external_accounts`, params);

/**
 * Retrieve an external account
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.ExternalAccountRetrieveParams,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/external_accounts/${id}`, params);

/**
 * Update an external account
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.ExternalAccountUpdateParams,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/external_accounts/${id}`, params);

/**
 * Delete an external account
 */
export const del = (
  accountId: string,
  id: string,
): Effect.Effect<Stripe.DeletedBankAccount | Stripe.DeletedCard, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/accounts/${accountId}/external_accounts/${id}`);

/**
 * List external accounts
 */
export const list = (
  accountId: string,
  params?: Stripe.ExternalAccountListParams,
): Effect.Effect<Stripe.ApiList<Stripe.BankAccount | Stripe.Card>, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/external_accounts`, params);

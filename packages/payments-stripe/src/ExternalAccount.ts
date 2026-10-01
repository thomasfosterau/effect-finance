/**
 * Stripe's `/v1/accounts/{accountId}/external_accounts` API as a raw resource
 * module, the escape hatch for what the neutral capabilities do not cover.
 * Results are typed with the `stripe` package's declarations and are not
 * decoded.
 *
 * @module
 */

import type { Effect } from "effect";
import type Stripe from "stripe";
import { path, type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Create an external account
 * (`POST /v1/accounts/{accountId}/external_accounts`).
 */
export const create = (
  accountId: string,
  params: Stripe.AccountCreateExternalAccountParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.BankAccount | Stripe.Card, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/external_accounts`, params, options);

/**
 * Retrieve an external account
 * (`GET /v1/accounts/{accountId}/external_accounts/{id}`).
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
 * (`POST /v1/accounts/{accountId}/external_accounts/{id}`).
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
 * (`DELETE /v1/accounts/{accountId}/external_accounts/{id}`).
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
 * List external accounts (`GET /v1/accounts/{accountId}/external_accounts`).
 */
export const list = (
  accountId: string,
  params?: Stripe.AccountListExternalAccountsParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.BankAccount | Stripe.Card>, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/external_accounts`, params, options);

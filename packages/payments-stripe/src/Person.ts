/**
 * Stripe's `/v1/accounts/{accountId}/persons` API as a raw resource module, the
 * escape hatch for what the neutral capabilities do not cover. Results are
 * typed with the `stripe` package's declarations and are not decoded.
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
 * Create a person (`POST /v1/accounts/{accountId}/persons`).
 */
export const create = (
  accountId: string,
  params: Stripe.AccountCreatePersonParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Person, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/persons`, params, options);

/**
 * Retrieve a person (`GET /v1/accounts/{accountId}/persons/{id}`).
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.AccountRetrievePersonParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Person, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/persons/${id}`, params, options);

/**
 * Update a person (`POST /v1/accounts/{accountId}/persons/{id}`).
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.AccountUpdatePersonParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Person, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/persons/${id}`, params, options);

/**
 * Delete a person (`DELETE /v1/accounts/{accountId}/persons/{id}`).
 */
export const del = (
  accountId: string,
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedPerson, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/accounts/${accountId}/persons/${id}`, undefined, options);

/**
 * List persons (`GET /v1/accounts/{accountId}/persons`).
 */
export const list = (
  accountId: string,
  params?: Stripe.AccountListPersonsParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Person>, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/persons`, params, options);

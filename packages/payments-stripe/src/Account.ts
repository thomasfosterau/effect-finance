/**
 * Account resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Account from "@thomasfosterau/effect-payments-stripe/Account";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createAccount = (type: "standard" | "express" | "custom") =>
 *   Account.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* createAccount("express");
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
 * Create an account
 */
export const create = (
  params: Stripe.AccountCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Account, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/accounts", params, options);

/**
 * Retrieve an account
 */
export const retrieve = (
  id: string,
  params?: Stripe.AccountRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Account, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${id}`, params, options);

/**
 * Update an account
 */
export const update = (
  id: string,
  params?: Stripe.AccountUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Account, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${id}`, params, options);

/**
 * Delete an account
 */
export const del = (
  id: string,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.DeletedAccount, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/accounts/${id}`, undefined, options);

/**
 * List accounts
 */
export const list = (
  params?: Stripe.AccountListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Account>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/accounts", params, options);

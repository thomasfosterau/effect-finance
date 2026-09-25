/**
 * Account resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Account from "@thomasfosterau/effect-payments-stripe/Account";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createAccount = (type: "standard" | "express" | "custom") =>
 *   Account.create({ type });
 *
 * const program = Effect.gen(function* () {
 *   const account = yield* createAccount("express");
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
 * Create an account
 */
export const create = (
  params: Stripe.AccountCreateParams,
): Effect.Effect<Stripe.Account, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.create(params));

/**
 * Retrieve an account
 */
export const retrieve = (
  id: string,
  params?: Stripe.AccountRetrieveParams,
): Effect.Effect<Stripe.Account, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.retrieve(id, params));

/**
 * Update an account
 */
export const update = (
  id: string,
  params?: Stripe.AccountUpdateParams,
): Effect.Effect<Stripe.Account, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.update(id, params));

/**
 * Delete an account
 */
export const del = (id: string): Effect.Effect<Stripe.DeletedAccount, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.del(id));

/**
 * List accounts
 */
export const list = (
  params?: Stripe.AccountListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Account>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.list(params));

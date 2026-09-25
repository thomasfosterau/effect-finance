/**
 * Person resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Person from "@thomasfosterau/effect-payments-stripe/Person";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createPerson = (accountId: string) =>
 *   Person.create(accountId, {
 *     first_name: "Jane",
 *     last_name: "Doe",
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const person = yield* createPerson("acct_123");
 *   return person;
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
 * Create a person
 */
export const create = (
  accountId: string,
  params: Stripe.PersonCreateParams,
): Effect.Effect<Stripe.Person, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.createPerson(accountId, params));

/**
 * Retrieve a person
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.PersonRetrieveParams,
): Effect.Effect<Stripe.Person, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.retrievePerson(accountId, id, params));

/**
 * Update a person
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.PersonUpdateParams,
): Effect.Effect<Stripe.Person, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.updatePerson(accountId, id, params));

/**
 * Delete a person
 */
export const del = (
  accountId: string,
  id: string,
): Effect.Effect<Stripe.DeletedPerson, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.deletePerson(accountId, id));

/**
 * List persons
 */
export const list = (
  accountId: string,
  params?: Stripe.PersonListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Person>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.accounts.listPersons(accountId, params));

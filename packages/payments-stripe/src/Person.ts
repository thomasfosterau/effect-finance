/**
 * Person resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Person from "@thomasfosterau/effect-payments-stripe/Person";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create a person
 */
export const create = (
  accountId: string,
  params: Stripe.AccountCreatePersonParams,
): Effect.Effect<Stripe.Person, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/persons`, params);

/**
 * Retrieve a person
 */
export const retrieve = (
  accountId: string,
  id: string,
  params?: Stripe.AccountRetrievePersonParams,
): Effect.Effect<Stripe.Person, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/persons/${id}`, params);

/**
 * Update a person
 */
export const update = (
  accountId: string,
  id: string,
  params?: Stripe.AccountUpdatePersonParams,
): Effect.Effect<Stripe.Person, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/accounts/${accountId}/persons/${id}`, params);

/**
 * Delete a person
 */
export const del = (
  accountId: string,
  id: string,
): Effect.Effect<Stripe.DeletedPerson, StripeError, StripeHttp> =>
  stripeRequest("DELETE", path`/v1/accounts/${accountId}/persons/${id}`);

/**
 * List persons
 */
export const list = (
  accountId: string,
  params?: Stripe.AccountListPersonsParams,
): Effect.Effect<Stripe.ApiList<Stripe.Person>, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/accounts/${accountId}/persons`, params);

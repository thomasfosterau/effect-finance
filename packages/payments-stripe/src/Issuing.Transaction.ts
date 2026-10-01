/**
 * Issuing Transaction resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as IssuingTransaction from "@thomasfosterau/effect-payments-stripe/Issuing.Transaction";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const transaction = yield* IssuingTransaction.retrieve("ipi_xxx");
 *   return transaction;
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
 * Retrieve an issuing transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.TransactionRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/transactions/${id}`, params, options);

/**
 * Update an issuing transaction
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.TransactionUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/transactions/${id}`, params, options);

/**
 * List issuing transactions
 */
export const list = (
  params?: Stripe.Issuing.TransactionListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Transaction>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/transactions", params, options);

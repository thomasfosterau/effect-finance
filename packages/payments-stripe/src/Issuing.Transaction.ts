/**
 * Issuing Transaction resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as IssuingTransaction from "@thomasfosterau/effect-payments-stripe/Issuing.Transaction";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const program = Effect.gen(function* () {
 *   const transaction = yield* IssuingTransaction.retrieve("ipi_xxx");
 *   return transaction;
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
 * Retrieve an issuing transaction
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.TransactionRetrieveParams,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.transactions.retrieve(id, params));

/**
 * Update an issuing transaction
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.TransactionUpdateParams,
): Effect.Effect<Stripe.Issuing.Transaction, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.transactions.update(id, params));

/**
 * List issuing transactions
 */
export const list = (
  params?: Stripe.Issuing.TransactionListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Transaction>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.issuing.transactions.list(params));

/**
 * Transfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect } from "effect";
 * import * as Transfer from "@thomasfosterau/effect-payments-stripe/Transfer";
 * import * as Stripe from "@thomasfosterau/effect-payments-stripe/Stripe";
 *
 * const createTransfer = (amount: number, destination: string) =>
 *   Transfer.create({
 *     amount,
 *     currency: "usd",
 *     destination,
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const transfer = yield* createTransfer(1000, "acct_123");
 *   return transfer;
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
 * Create a transfer
 */
export const create = (
  params: Stripe.TransferCreateParams,
): Effect.Effect<Stripe.Transfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.transfers.create(params));

/**
 * Retrieve a transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.TransferRetrieveParams,
): Effect.Effect<Stripe.Transfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.transfers.retrieve(id, params));

/**
 * Update a transfer
 */
export const update = (
  id: string,
  params?: Stripe.TransferUpdateParams,
): Effect.Effect<Stripe.Transfer, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.transfers.update(id, params));

/**
 * List transfers
 */
export const list = (
  params?: Stripe.TransferListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Transfer>, StripeError, StripeService> =>
  wrapStripeCall((stripe) => stripe.transfers.list(params));

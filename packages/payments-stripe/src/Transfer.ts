/**
 * Transfer resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Transfer from "@thomasfosterau/effect-payments-stripe/Transfer";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
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
 * Create a transfer
 */
export const create = (
  params: Stripe.TransferCreateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Transfer, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/transfers", params, options);

/**
 * Retrieve a transfer
 */
export const retrieve = (
  id: string,
  params?: Stripe.TransferRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Transfer, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/transfers/${id}`, params, options);

/**
 * Update a transfer
 */
export const update = (
  id: string,
  params?: Stripe.TransferUpdateParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Transfer, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/transfers/${id}`, params, options);

/**
 * List transfers
 */
export const list = (
  params?: Stripe.TransferListParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.ApiList<Stripe.Transfer>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/transfers", params, options);

/**
 * Balance resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/http";
 * import * as Balance from "@thomasfosterau/effect-payments-stripe/Balance";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const balance = yield* Balance.retrieve();
 *   return balance;
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
import { type StripeError, stripeRequest } from "./internal/index.js";
import type { RequestOptions, StripeHttp } from "./StripeHttp.js";

/**
 * Retrieve the balance
 */
export const retrieve = (
  params?: Stripe.BalanceRetrieveParams,
  options?: RequestOptions | undefined,
): Effect.Effect<Stripe.Balance, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/balance", params, options);

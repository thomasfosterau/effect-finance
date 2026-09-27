/**
 * Refund resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Refund from "@thomasfosterau/effect-payments-stripe/Refund";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createRefund = (chargeId: string) =>
 *   Refund.create({ charge: chargeId });
 *
 * const program = Effect.gen(function* () {
 *   const refund = yield* createRefund("ch_123");
 *   return refund;
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
 * Create a refund
 */
export const create = (
  params: Stripe.RefundCreateParams,
): Effect.Effect<Stripe.Refund, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/refunds", params);

/**
 * Retrieve a refund
 */
export const retrieve = (
  id: string,
  params?: Stripe.RefundRetrieveParams,
): Effect.Effect<Stripe.Refund, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/refunds/${id}`, params);

/**
 * Update a refund
 */
export const update = (
  id: string,
  params?: Stripe.RefundUpdateParams,
): Effect.Effect<Stripe.Refund, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/refunds/${id}`, params);

/**
 * List refunds
 */
export const list = (
  params?: Stripe.RefundListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Refund>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/refunds", params);

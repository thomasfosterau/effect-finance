/**
 * Issuing Dispute resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as IssuingDispute from "@thomasfosterau/effect-payments-stripe/Issuing.Dispute";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const createDispute = (transactionId: string) =>
 *   IssuingDispute.create({
 *     transaction: transactionId,
 *     evidence: {
 *       reason: "fraudulent",
 *       fraudulent: {
 *         explanation: "I did not authorize this transaction.",
 *       },
 *     },
 *   });
 *
 * const program = Effect.gen(function* () {
 *   const dispute = yield* createDispute("ipi_xxx");
 *   return dispute;
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
 * Create an issuing dispute
 */
export const create = (
  params: Stripe.Issuing.DisputeCreateParams,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeHttp> =>
  stripeRequest("POST", "/v1/issuing/disputes", params);

/**
 * Retrieve an issuing dispute
 */
export const retrieve = (
  id: string,
  params?: Stripe.Issuing.DisputeRetrieveParams,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/issuing/disputes/${id}`, params);

/**
 * Update an issuing dispute
 */
export const update = (
  id: string,
  params?: Stripe.Issuing.DisputeUpdateParams,
): Effect.Effect<Stripe.Issuing.Dispute, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/issuing/disputes/${id}`, params);

/**
 * List issuing disputes
 */
export const list = (
  params?: Stripe.Issuing.DisputeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Issuing.Dispute>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/issuing/disputes", params);

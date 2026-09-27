/**
 * Dispute resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Dispute from "@thomasfosterau/effect-payments-stripe/Dispute";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const updateDispute = (id: string, evidence: object) =>
 *   Dispute.update(id, { evidence });
 *
 * const program = Effect.gen(function* () {
 *   const dispute = yield* updateDispute("dp_123", { customer_name: "John" });
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
 * Retrieve a dispute
 */
export const retrieve = (
  id: string,
  params?: Stripe.DisputeRetrieveParams,
): Effect.Effect<Stripe.Dispute, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/disputes/${id}`, params);

/**
 * Update a dispute
 */
export const update = (
  id: string,
  params?: Stripe.DisputeUpdateParams,
): Effect.Effect<Stripe.Dispute, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/disputes/${id}`, params);

/**
 * List disputes
 */
export const list = (
  params?: Stripe.DisputeListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Dispute>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/disputes", params);

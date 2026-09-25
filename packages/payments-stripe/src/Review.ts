/**
 * Review resource operations
 *
 * @example
 * ```typescript
 * import { Effect, Layer, Redacted } from "effect";
 * import { FetchHttpClient } from "effect/unstable/http";
 * import * as Review from "@thomasfosterau/effect-payments-stripe/Review";
 * import * as StripeHttp from "@thomasfosterau/effect-payments-stripe/StripeHttp";
 *
 * const program = Effect.gen(function* () {
 *   const review = yield* Review.retrieve("prv_123");
 *   const approved = yield* Review.approve(review.id);
 *   return approved;
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
 * Retrieve a review
 */
export const retrieve = (
  id: string,
  params?: Stripe.ReviewRetrieveParams,
): Effect.Effect<Stripe.Review, StripeError, StripeHttp> =>
  stripeRequest("GET", path`/v1/reviews/${id}`, params);

/**
 * List reviews
 */
export const list = (
  params?: Stripe.ReviewListParams,
): Effect.Effect<Stripe.ApiList<Stripe.Review>, StripeError, StripeHttp> =>
  stripeRequest("GET", "/v1/reviews", params);

/**
 * Approve a review
 */
export const approve = (
  id: string,
  params?: Stripe.ReviewApproveParams,
): Effect.Effect<Stripe.Review, StripeError, StripeHttp> =>
  stripeRequest("POST", path`/v1/reviews/${id}/approve`, params);
